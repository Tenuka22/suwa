"use client";

import { useUser } from "@clerk/expo";
import { consumeEventIterator } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  Play,
  Square,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/design/ui/button";
import { Screen } from "@/components/design/ui/screen";
import { vibrate } from "@/utils/haptics";
import { orpc } from "@/utils/orpc";
import {
  CLASS_COLORS,
  CLASS_LABELS,
  classIndex,
  computeInsights,
  statusFromPrediction,
} from "@/utils/stress/analysis";
import {
  appendBundles,
  getBundles,
  getSimulationState,
  type StoredPrediction,
  type StressBundle,
  setSimulationState,
} from "@/utils/stress-storage";

function generateMockSample(): number[] {
  const meanRr = 700 + Math.random() * 300;
  const sdnn = 30 + Math.random() * 50;
  const rmssd = 20 + Math.random() * 40;
  const pnn50 = Math.random() * 30;
  const hr = 60_000 / meanRr;

  return [
    Math.round(meanRr * 100) / 100,
    Math.round(sdnn * 100) / 100,
    Math.round(rmssd * 100) / 100,
    Math.round(pnn50 * 100) / 100,
    Math.round(hr * 100) / 100,
  ];
}

export default function HealthHubScreen() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;

  const [streaming, setStreaming] = useState(getSimulationState);
  const [streamLoading, setStreamLoading] = useState(true);
  const [bundles, setBundles] = useState<StressBundle[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [bufferedSamples, setBufferedSamples] = useState(0);
  const [iconPressed, setIconPressed] = useState(false);

  const cancelRef = useRef<(() => Promise<void>) | null>(null);
  const pendingBatchRef = useRef<number[][]>([]);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ingestMutation = useMutation(orpc.ingestIoTData.mutationOptions());
  const acknowledgeMutation = useMutation(orpc.acknowledgeStressDownload.mutationOptions());
  const startSimulationMutation = useMutation(orpc.startStressSimulation.mutationOptions());
  const stopSimulationMutation = useMutation(orpc.stopStressSimulation.mutationOptions());

  useEffect(() => {
    if (!userId) return;

    const uid: string = userId;
    const mmkvBundles = getBundles(uid);

    if (mmkvBundles.length > 0) {
      setBundles(mmkvBundles);
      setTotalSamples(mmkvBundles.length * 360);
    }

    let isCancelled = false;

    async function subscribe() {
      try {
        setStreamLoading(true);
        const iterator = await orpc.subscribeStressStream.call({} as never);
        if (isCancelled) {
          await iterator.return?.();
          return;
        }

        const cancel = consumeEventIterator(iterator, {
          onEvent: (data) => {
            if (data.type === "state") {
              const stateData = data as { type: "state"; bundles: StressBundle[]; totalSamples: number; buffered: number };
              if (mmkvBundles.length === 0 && stateData.bundles.length > 0) appendBundles(uid, stateData.bundles);
              const stored = getBundles(uid);
              setBundles(stored);
              setBufferedSamples(stateData.buffered);
              setTotalSamples(stored.length > 0 ? stored.length * 360 : stateData.totalSamples);
              setStreamLoading(false);
              return;
            }

            if (data.type === "bundle") {
              const eventData = data as { type: "bundle"; data: StressBundle };
              appendBundles(uid, [eventData.data]);
              const stored = getBundles(uid);
              setBundles(stored);
              setTotalSamples(stored.length * 360);
              setStreamLoading(false);
              return;
            }

            if (data.type === "progress") {
              const pData = data as { type: "progress"; buffered: number; totalSamples: number };
              setBufferedSamples(pData.buffered);
              setTotalSamples(pData.totalSamples);
              setStreamLoading(false);
            }
          },
          onError: () => !isCancelled && setStreamLoading(false),
        });
        cancelRef.current = cancel;
      } catch {
        if (!isCancelled) setStreamLoading(false);
      }
    }

    subscribe();

    return () => {
      isCancelled = true;
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    if (totalSamples > 0 && userId) acknowledgeMutation.mutate({} as never);
  }, [totalSamples, userId]);

  const latestPrediction: StoredPrediction | null = bundles.length > 0 ? bundles[bundles.length - 1].prediction : null;
  const status = latestPrediction ? statusFromPrediction(latestPrediction.predictedClass) : null;
  const StatusIcon = status?.icon ?? Brain;
  const insights = useMemo(() => computeInsights(bundles), [bundles]);

  const handleStartStop = useCallback(() => {
    if (streaming) {
      stopSimulationMutation.mutate({} as never);
      if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
      if (flushTimerRef.current) { clearInterval(flushTimerRef.current); flushTimerRef.current = null; }
      if (pendingBatchRef.current.length > 0) {
        const batch = pendingBatchRef.current;
        pendingBatchRef.current = [];
        const now = Date.now();
        ingestMutation.mutate({ deviceId: "mock-iot-001", samples: batch.map((sample, i) => ({ sample, timestamp: now + i * 250 })) } as never);
      }
      setStreaming(false);
      setSimulationState(false);
    } else {
      startSimulationMutation.mutate({} as never);
      const genInterval = setInterval(() => pendingBatchRef.current.push(generateMockSample()), 250);
      const flushInterval = setInterval(() => {
        const batch = pendingBatchRef.current;
        pendingBatchRef.current = [];
        if (batch.length > 0) {
          const now = Date.now();
          ingestMutation.mutate({ deviceId: "mock-iot-001", samples: batch.map((sample, i) => ({ sample, timestamp: now + i * 250 })) } as never);
        }
      }, 1000);
      genTimerRef.current = genInterval;
      flushTimerRef.current = flushInterval;
      setStreaming(true);
      setSimulationState(true);
    }
    vibrate(10);
  }, [streaming, startSimulationMutation, stopSimulationMutation, ingestMutation]);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="flex-1 gap-xl pb-32 pt-lg px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center gap-md mt-sm">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} className="text-primary" />
          </Pressable>
          <View>
            <Text className="font-serif text-hero text-primary leading-tight">Health Hub</Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">Wellness Monitor</Text>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Status Ring */}
          <View className="items-center py-huge">
            <Pressable
              onPressIn={() => setIconPressed(true)}
              onPressOut={() => setIconPressed(false)}
              className="h-52 w-52 items-center justify-center rounded-full border-4 border-border shadow-lg"
            >
              <View
                className={`h-full w-full items-center justify-center rounded-full ${status?.bg || "bg-background-subtle/50"}`}
                style={{ transform: [{ translateY: iconPressed ? 4 : 0 }, { scale: iconPressed ? 0.96 : 1 }] }}
              >
                {streamLoading && bundles.length === 0 ? (
                  <ActivityIndicator color="#2d3e35" size="large" />
                ) : (
                  <>
                    <StatusIcon size={56} className={status?.color || "text-primary"} />
                    <Text className={`mt-md font-serif text-title uppercase tracking-wider ${status?.color || "text-foreground-muted"}`}>
                      {status?.label || "No Data"}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>

          {/* Live Stats */}
          <View className="bg-background-elevated rounded-3xl p-lg shadow-sm gap-lg">
            <View className="flex-row items-center justify-between">
              <Text className="font-serif text-title text-primary">Live Stats</Text>
              {streaming && (
                <View className="flex-row items-center gap-xs bg-primary-subtle px-md py-xxs rounded-full">
                  <View className="h-2 w-2 rounded-full bg-primary" />
                  <Text className="font-sans text-micro text-primary font-bold uppercase tracking-widest">Active</Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-lg bg-background-subtle/50 p-lg rounded-2xl">
              <View className="h-12 w-12 rounded-full bg-tint-green items-center justify-center">
                <Activity size={24} className="text-tint-green-foreground" />
              </View>
              <View className="flex-1">
                <Text className="font-sans text-micro text-foreground-muted uppercase tracking-widest">Current State</Text>
                <Text className="font-serif text-subtitle text-foreground">{insights?.dominantLabel || "Idle"}</Text>
              </View>
            </View>

            <View className="gap-sm">
              <View className="flex-row justify-between">
                <Text className="font-sans text-micro text-foreground-muted uppercase">Stress Level</Text>
                <Text className="font-sans text-micro font-bold text-foreground">{insights?.stressRatio || 0}%</Text>
              </View>
              <View className="h-2 rounded-full bg-background-subtle">
                <View className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, insights?.stressRatio || 0)}%` }} />
              </View>
            </View>

            <View className="flex-row gap-md">
              <View className="flex-1 bg-background-subtle/50 p-md rounded-2xl items-center gap-xxs">
                {insights?.trendDirection === "up" ? <TrendingUp size={20} className="text-destructive" /> : insights?.trendDirection === "down" ? <TrendingDown size={20} className="text-accent" /> : <BarChart3 size={20} className="text-primary" />}
                <Text className="font-sans text-micro text-foreground-muted">Trend</Text>
                <Text className="font-sans text-caption font-bold text-foreground">{insights?.trendLabel || "Stable"}</Text>
              </View>
              <View className="flex-1 bg-background-subtle/50 p-md rounded-2xl items-center gap-xxs">
                <Brain size={20} className="text-tint-purple-foreground" />
                <Text className="font-sans text-micro text-foreground-muted">Confidence</Text>
                <Text className="font-sans text-caption font-bold text-foreground">{insights?.averageConfidence || 0}%</Text>
              </View>
            </View>
          </View>

          {/* Timeline */}
          {bundles.length > 0 && (
            <View className="gap-md mt-md">
              <Text className="font-serif text-title text-primary">Prediction Timeline</Text>
              <View className="bg-background-elevated rounded-3xl p-lg shadow-sm">
                <View className="flex-row items-end gap-[2px]">
                  {bundles.slice(-60).map((b, i) => {
                    const idx = b.prediction ? classIndex(b.prediction.predictedClass) : -1;
                    const color = idx >= 0 ? CLASS_COLORS[idx] : "#7f8a83";
                    const height = idx >= 0 ? 16 + idx * 10 : 6;
                    return <View key={b.bundleId ?? i} className="flex-1 rounded-sm" style={{ backgroundColor: color, height }} />;
                  })}
                </View>
                <View className="flex-row gap-lg mt-md">
                  {CLASS_LABELS.map((label, i) => (
                    <View className="flex-row items-center gap-xs" key={label}>
                      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: CLASS_COLORS[i] }} />
                      <Text className="font-sans text-micro text-foreground-muted">{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </Screen>

      {/* Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-background-elevated/90 px-lg py-md flex-row items-center gap-lg border-t border-border rounded-t-3xl">
        <Button
          className="flex-1"
          icon={streaming ? <Square size={16} className="text-foreground" /> : <Play size={16} className="text-white" />}
          onPress={handleStartStop}
          variant={streaming ? "outline" : "primary"}
        >
          {streaming ? "Stop Monitoring" : "Start Monitoring"}
        </Button>
        <Pressable onPress={() => router.back()} className="h-12 w-12 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm">
          <ArrowLeft size={20} className="text-primary" />
        </Pressable>
      </View>
    </View>
  );
}