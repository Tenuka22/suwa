'use client';

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
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
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
import { useThemeColor } from "@/utils/theme";

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

export default function StressHubScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { user } = useUser();
  const userId = user?.id;

  const [streaming, setStreaming] = useState(getSimulationState);
  const [streamLoading, setStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [bundles, setBundles] = useState<StressBundle[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [bufferedSamples, setBufferedSamples] = useState(0);

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
        setStreamError(false);

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
              const eventData = data as {
                type: "bundle";
                data: StressBundle;
              };
              appendBundles(uid, [eventData.data]);

              const stored = getBundles(uid);
              setBundles(stored);
              setTotalSamples(stored.length * 360);
              setStreamLoading(false);
              setStreamError(false);
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
              setStreamError(false);
              return;
            }
          },
          onError: () => {
            if (!isCancelled) {
              setStreamLoading(false);
              setStreamError(true);
            }
          },
        });
        cancelRef.current = cancel;
      } catch {
        if (!isCancelled) {
          setStreamLoading(false);
          setStreamError(true);
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
  }, [totalSamples, userId]);

  const latestPrediction: StoredPrediction | null =
    bundles.length > 0 ? bundles[bundles.length - 1].prediction : null;

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
      const genInterval = setInterval(() => {
        pendingBatchRef.current.push(generateMockSample());
      }, 250);
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="gap-section bg-background px-page py-page"
        scrollClassName="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-section py-page pb-24"
        >
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1 gap-2">
              <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
                Stress Hub
              </Text>
              <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
                Monitor
              </Text>
              <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
                Keep track of your current stress levels through continuous
                monitoring.
              </Text>
            </View>
          </View>

          <View className="items-center py-6">
            <Pressable
              className="h-64 w-64 items-center justify-center rounded-full border-4 border-border bg-card shadow-sm"
              onPressIn={() => setIconPressed(true)}
              onPressOut={() => setIconPressed(false)}
            >
              <View
                className={`h-full w-full items-center justify-center rounded-full ${status?.bg || "bg-muted/30"}`}
                style={{
                  transform: [
                    { translateY: iconPressed ? 4 : 0 },
                    { scale: iconPressed ? 0.96 : 1 },
                  ],
                }}
              >
                {streamLoading && bundles.length === 0 ? (
                  <ActivityIndicator color={colors.primary} size="large" />
                ) : (
                  <>
                    <StatusIcon
                      color={
                        status?.color === "text-destructive"
                          ? colors.destructive
                          : status?.color === "text-success"
                            ? colors.success
                            : colors.primary
                      }
                      size={64}
                    />
                    <Text
                      className={`mt-4 font-black font-sans text-xl uppercase tracking-widest ${
                        status?.color || "text-muted-foreground"
                      }`}
                    >
                      {status?.label || "No Data"}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>

          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                Live Stats
              </Text>
              {streaming && (
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-primary" />
                  <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
                    Active
                  </Text>
                </View>
              )}
            </View>

            <View className="gap-3 rounded-card border-2 border-border bg-card p-4">
              <View className="flex-row items-center gap-3">
                <View className="rounded-full bg-primary/10 p-3">
                  <Activity color={colors.primary} size={18} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Current State
                  </Text>
                  <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                    {insights?.dominantLabel || "Idle"}
                  </Text>
                </View>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Stress Ratio
                  </Text>
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
                    {insights?.stressRatio || 0}%
                  </Text>
                </View>
                <View className="h-3 overflow-hidden rounded-full bg-muted">
                  <View
                    className="h-full rounded-full bg-destructive"
                    style={{
                      width: `${Math.min(100, insights?.stressRatio || 0)}%`,
                    }}
                  />
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                  <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                    Trend
                  </Text>
                  <View className="mt-1 flex-row items-center gap-1">
                    {insights?.trendDirection === "up" ? (
                      <TrendingUp color={colors.destructive} size={16} />
                    ) : insights?.trendDirection === "down" ? (
                      <TrendingDown color={colors.success} size={16} />
                    ) : (
                      <BarChart3 color={colors.foreground} size={16} />
                    )}
                    <Text
                      className="font-black font-sans text-foreground text-lg"
                      numberOfLines={1}
                    >
                      {insights?.trendLabel || "Stable"}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                  <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                    Avg Confidence
                  </Text>
                  <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                    {insights?.averageConfidence || 0}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {bundles.length > 0 && (
            <View className="gap-4">
              <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                Prediction Timeline
              </Text>
              <View className="rounded-card border-2 border-border bg-card p-4">
                <View className="flex-row items-end gap-[2px]">
                  {bundles.slice(-60).map((b, i) => {
                    const idx = b.prediction
                      ? classIndex(b.prediction.predictedClass)
                      : -1;
                    const color =
                      idx >= 0 ? CLASS_COLORS[idx] : colors.mutedForeground;
                    const height = idx >= 0 ? 16 + idx * 10 : 6;
                    return (
                      <View
                        key={b.bundleId ?? i}
                        style={{
                          backgroundColor: color,
                          borderRadius: 2,
                          flex: 1,
                          height,
                          opacity: b.prediction ? 1 : 0.3,
                        }}
                      />
                    );
                  })}
                </View>
                <View className="mt-3 flex-row gap-4">
                  {CLASS_LABELS.map((label, i) => (
                    <View className="flex-row items-center gap-1.5" key={label}>
                      <View
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: CLASS_COLORS[i] }}
                      />
                      <Text className="font-sans text-muted-foreground text-xs">
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View className="gap-4">
            <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
              Data Summary
            </Text>
            <View className="gap-3 rounded-card border-2 border-border bg-card p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-muted-foreground text-xs">
                  Total Bundles
                </Text>
                <Text className="font-black font-sans text-foreground">
                  {bundles.length}
                </Text>
              </View>
              <View className="h-px bg-border" />
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-muted-foreground text-xs">
                  Total Samples
                </Text>
                <Text className="font-black font-sans text-foreground">
                  {totalSamples.toLocaleString()}
                </Text>
              </View>
              {insights && (
                <>
                  <View className="h-px bg-border" />
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-muted-foreground text-xs">
                      State Distribution
                    </Text>
                    <View className="flex-row items-center gap-2">
                      {insights.stateCounts.map((count, i) => (
                        <View
                          className="flex-row items-center gap-1"
                          key={CLASS_LABELS[i]}
                        >
                          <View
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: CLASS_COLORS[i] }}
                          />
                          <Text className="font-sans text-muted-foreground text-xs">
                            {count}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View className="h-px bg-border" />
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-muted-foreground text-xs">
                      Buffered Samples
                    </Text>
                    <Text className="font-black font-sans text-foreground">
                      {bufferedSamples.toLocaleString()}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </Screen>
      <ScreenBottomBar>
        <Button
          className="h-12 flex-1"
          icon={
            streaming ? (
              <Square color={colors.foreground} size={16} />
            ) : (
              <Play color="#ffffff" size={16} />
            )
          }
          onPress={handleStartStop}
          variant={streaming ? "secondary" : "primary"}
        >
          {streaming ? "Stop Monitoring" : "Start Monitoring"}
        </Button>
        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
