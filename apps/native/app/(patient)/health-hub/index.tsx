"use client";

import { authClient } from "@/utils/better-auth";
import { consumeEventIterator } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import {
  Activity,
  BarChart3,
  Brain,
  Play,
  Square,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { PatientTabScaffold } from "@/components/design/patient-tab-scaffold";
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
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [streaming, setStreaming] = useState(getSimulationState);
  const [streamLoading, setStreamLoading] = useState(true);
  const [bundles, setBundles] = useState<StressBundle[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [_bufferedSamples, setBufferedSamples] = useState(0);
  const [iconPressed, setIconPressed] = useState(false);

  const cancelRef = useRef<(() => Promise<void>) | null>(null);
  const pendingBatchRef = useRef<number[][]>([]);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ingestMutation = useMutation(orpc.ingestIoTData.mutationOptions());
  const acknowledgeMutation = useMutation(
    orpc.acknowledgeStressDownload.mutationOptions()
  );
  const startSimulationMutation = useMutation(
    orpc.startStressSimulation.mutationOptions()
  );
  const stopSimulationMutation = useMutation(
    orpc.stopStressSimulation.mutationOptions()
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

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
              const stateData = data as {
                type: "state";
                bundles: StressBundle[];
                totalSamples: number;
                buffered: number;
              };
              if (mmkvBundles.length === 0 && stateData.bundles.length > 0) {
                appendBundles(uid, stateData.bundles);
              }
              const stored = getBundles(uid);
              setBundles(stored);
              setBufferedSamples(stateData.buffered);
              setTotalSamples(
                stored.length > 0 ? stored.length * 360 : stateData.totalSamples
              );
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
              const pData = data as {
                type: "progress";
                buffered: number;
                totalSamples: number;
              };
              setBufferedSamples(pData.buffered);
              setTotalSamples(pData.totalSamples);
              setStreamLoading(false);
            }
          },
          onError: () => !isCancelled && setStreamLoading(false),
        });
        cancelRef.current = cancel;
      } catch {
        if (!isCancelled) {
          setStreamLoading(false);
        }
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
    if (totalSamples > 0 && userId) {
      acknowledgeMutation.mutate({} as never);
    }
  }, [totalSamples, userId, acknowledgeMutation.mutate]);

  const latestPrediction: StoredPrediction | null =
    bundles.length > 0 ? (bundles.at(-1)?.prediction ?? null) : null;
  const status = latestPrediction
    ? statusFromPrediction(latestPrediction.predictedClass)
    : null;
  const StatusIcon = status?.icon ?? Brain;
  const insights = useMemo(() => computeInsights(bundles), [bundles]);

  const handleStartStop = useCallback(() => {
    if (streaming) {
      stopSimulationMutation.mutate({} as never);
      if (genTimerRef.current) {
        clearInterval(genTimerRef.current);
        genTimerRef.current = null;
      }
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      if (pendingBatchRef.current.length > 0) {
        const batch = pendingBatchRef.current;
        pendingBatchRef.current = [];
        const now = Date.now();
        ingestMutation.mutate({
          deviceId: "mock-iot-001",
          samples: batch.map((sample, i) => ({
            sample,
            timestamp: now + i * 250,
          })),
        } as never);
      }
      setStreaming(false);
      setSimulationState(false);
    } else {
      startSimulationMutation.mutate({} as never);
      const genInterval = setInterval(
        () => pendingBatchRef.current.push(generateMockSample()),
        250
      );
      const flushInterval = setInterval(() => {
        const batch = pendingBatchRef.current;
        pendingBatchRef.current = [];
        if (batch.length > 0) {
          const now = Date.now();
          ingestMutation.mutate({
            deviceId: "mock-iot-001",
            samples: batch.map((sample, i) => ({
              sample,
              timestamp: now + i * 250,
            })),
          } as never);
        }
      }, 1000);
      genTimerRef.current = genInterval;
      flushTimerRef.current = flushInterval;
      setStreaming(true);
      setSimulationState(true);
    }
    vibrate(10);
  }, [
    streaming,
    startSimulationMutation,
    stopSimulationMutation,
    ingestMutation,
  ]);

  function trendIcon(direction: string | undefined) {
    if (direction === "up") {
      return <TrendingUp className="text-destructive" size={20} />;
    }

    if (direction === "down") {
      return <TrendingDown className="text-accent" size={20} />;
    }

    return <BarChart3 className="text-primary" size={20} />;
  }

  return (
    <PatientTabScaffold activeTab="health">
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ animation: "fade", headerShown: false, title: getScreenTitle("native:patient:health-hub") }} />
        <Screen
          contentClassName="flex-1 gap-xl pt-12 px-lg bg-background"
          scrollClassName="flex-1 bg-background"
        >
          {/* Header */}
          <View className="mt-sm">
            <Text className="font-serif text-hero text-primary leading-tight">
              Health Hub
            </Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
              Wellness Monitor
            </Text>
          </View>

          {/* Status Ring */}
          <View className="items-center py-huge">
            <Pressable
              className="h-52 w-52 items-center justify-center rounded-full border-4 border-border shadow-lg"
              onPressIn={() => setIconPressed(true)}
              onPressOut={() => setIconPressed(false)}
            >
              <View
                className={`h-full w-full items-center justify-center rounded-full ${status?.bg || "bg-background-subtle/50"}`}
                style={{
                  transform: [
                    { translateY: iconPressed ? 4 : 0 },
                    { scale: iconPressed ? 0.96 : 1 },
                  ],
                }}
              >
                {streamLoading && bundles.length === 0 ? (
                  <ActivityIndicator color="#2d3e35" size="large" />
                ) : (
                  <>
                    <StatusIcon
                      className={status?.color || "text-primary"}
                      size={56}
                    />
                    <Text
                      className={`mt-md font-serif text-title uppercase tracking-wider ${status?.color || "text-foreground-muted"}`}
                    >
                      {status?.label || "No Data"}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>

          {/* Live Stats */}
          <View className="gap-lg rounded-3xl bg-background-elevated p-lg shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="font-serif text-primary text-title">
                Live Stats
              </Text>
              {streaming && (
                <View className="flex-row items-center gap-xs rounded-full bg-primary-subtle px-md py-xxs">
                  <View className="h-2 w-2 rounded-full bg-primary" />
                  <Text className="font-bold font-sans text-micro text-primary uppercase tracking-widest">
                    Active
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-lg rounded-2xl bg-background-subtle/50 p-lg">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-tint-green">
                <Activity className="text-tint-green-foreground" size={24} />
              </View>
              <View className="flex-1">
                <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
                  Current State
                </Text>
                <Text className="font-serif text-foreground text-subtitle">
                  {insights?.dominantLabel || "Idle"}
                </Text>
              </View>
            </View>

            <View className="gap-sm">
              <View className="flex-row justify-between">
                <Text className="font-sans text-foreground-muted text-micro uppercase">
                  Stress Level
                </Text>
                <Text className="font-bold font-sans text-foreground text-micro">
                  {insights?.stressRatio || 0}%
                </Text>
              </View>
              <View className="h-2 rounded-full bg-background-subtle">
                <View
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${Math.min(100, insights?.stressRatio || 0)}%`,
                  }}
                />
              </View>
            </View>

            <View className="flex-row gap-md">
              <View className="flex-1 items-center gap-xxs rounded-2xl bg-background-subtle/50 p-md">
                {trendIcon(insights?.trendDirection)}
                <Text className="font-sans text-foreground-muted text-micro">
                  Trend
                </Text>
                <Text className="font-bold font-sans text-caption text-foreground">
                  {insights?.trendLabel || "Stable"}
                </Text>
              </View>
              <View className="flex-1 items-center gap-xxs rounded-2xl bg-background-subtle/50 p-md">
                <Brain className="text-tint-purple-foreground" size={20} />
                <Text className="font-sans text-foreground-muted text-micro">
                  Confidence
                </Text>
                <Text className="font-bold font-sans text-caption text-foreground">
                  {insights?.averageConfidence || 0}%
                </Text>
              </View>
            </View>
          </View>

          {/* Timeline */}
          {bundles.length > 0 && (
            <View className="mt-md gap-md">
              <Text className="font-serif text-primary text-title">
                Prediction Timeline
              </Text>
              <View className="rounded-3xl bg-background-elevated p-lg shadow-sm">
                <View className="flex-row items-end gap-[2px]">
                  {bundles.slice(-60).map((b, i) => {
                    const idx = b.prediction
                      ? classIndex(b.prediction.predictedClass)
                      : -1;
                    const color = idx >= 0 ? CLASS_COLORS[idx] : "#7f8a83";
                    const height = idx >= 0 ? 16 + idx * 10 : 6;
                    return (
                      <View
                        className="flex-1 rounded-sm"
                        key={b.bundleId ?? i}
                        style={{ backgroundColor: color, height }}
                      />
                    );
                  })}
                </View>
                <View className="mt-md flex-row gap-lg">
                  {CLASS_LABELS.map((label, i) => (
                    <View className="flex-row items-center gap-xs" key={label}>
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CLASS_COLORS[i] }}
                      />
                      <Text className="font-sans text-foreground-muted text-micro">
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <Pressable
            className={`mt-md flex-row items-center justify-center gap-2 rounded-full py-3.5 ${streaming ? "border-2 border-border bg-background-elevated" : "bg-primary"}`}
            onPress={handleStartStop}
          >
            {streaming ? (
              <Square className="text-foreground" size={18} />
            ) : (
              <Play className="text-primary-foreground" size={18} />
            )}
            <Text
              className={`font-bold font-sans text-body ${streaming ? "text-foreground" : "text-primary-foreground"}`}
            >
              {streaming ? "Stop Monitoring" : "Start Monitoring"}
            </Text>
          </Pressable>
        </Screen>
      </View>
    </PatientTabScaffold>
  );
}
