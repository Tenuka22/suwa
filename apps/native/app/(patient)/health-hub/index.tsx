"use client";

import { authClient } from "@/utils/better-auth";
import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import { env } from "@suwa/env/native";
import {
  Activity,
  BarChart3,
  Brain,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { PatientTabScaffold } from "@/components/design/patient-tab-scaffold";
import { Screen } from "@/components/design/ui/screen";
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
  type StoredPrediction,
  type StressBundle,
} from "@/utils/stress-storage";

export default function HealthHubScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [streamLoading, setStreamLoading] = useState(true);
  const [bundles, setBundles] = useState<StressBundle[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [bufferedSamples, setBufferedSamples] = useState(0);
  const [iconPressed, setIconPressed] = useState(false);

  const cancelRef = useRef<(() => Promise<void>) | null>(null);

  const acknowledgeMutation = useMutation(
    orpc.acknowledgeStressDownload.mutationOptions()
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

    function handleStressEvent(data: unknown) {
      if (!data || typeof data !== "object" || !("type" in data)) {
        return;
      }

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
        setBufferedSamples(0);
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
    }

    async function subscribe() {
      try {
        setStreamLoading(true);
        const controller = new AbortController();
        cancelRef.current = async () => {
          controller.abort();
        };

        const cookie = Platform.OS === "web" ? null : authClient.getCookie();
        const response = await fetch(`${env.EXPO_PUBLIC_SERVER_URL}/api/iot/stress-stream`, {
          headers: cookie ? { Cookie: cookie } : undefined,
          credentials: Platform.OS === "web" ? "include" : undefined,
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          setStreamLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!isCancelled) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const dataLine = chunk
              .split("\n")
              .find((line) => line.startsWith("data: "));
            if (!dataLine) continue;

            try {
              handleStressEvent(JSON.parse(dataLine.slice(6)));
            } catch {
              // Ignore malformed stream events and keep the stream alive.
            }
          }
        }
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") {
          return;
        }
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
  const collectionProgress = Math.min(100, (bufferedSamples / 360) * 100);
  const statusLabel = status?.label ?? (bufferedSamples > 0 ? "Collecting" : "No Data");
  const currentStateLabel =
    insights?.dominantLabel ?? (bufferedSamples > 0 ? "Collecting" : "Idle");

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
          contentClassName="flex-1 gap-lg pt-10 px-lg bg-background"
          scrollClassName="flex-1 bg-background"
        >
          {/* Header */}
          <View className="mt-sm">
            <Text className="font-serif text-[56px] text-primary leading-tight">
              Health Hub
            </Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
              Wellness Monitor
            </Text>
          </View>

          {/* Status Ring */}
          <View className="items-center py-lg">
            <Pressable
              className="h-44 w-44 items-center justify-center rounded-full border-4 border-border bg-background-elevated shadow-lg"
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
                    <StatusIcon className={status?.color || "text-primary"} size={44} />
                    <Text
                      className={`mt-sm text-center font-serif text-subtitle uppercase tracking-wider ${status?.color || "text-foreground-muted"}`}
                    >
                      {statusLabel}
                    </Text>
                    {bufferedSamples > 0 && !status && (
                      <Text className="mt-xxs font-sans text-caption text-foreground-muted text-center">
                        {bufferedSamples}/360
                      </Text>
                    )}
                  </>
                )}
              </View>
            </Pressable>
            {bufferedSamples > 0 && !status && (
              <View className="mt-md w-full max-w-[280px] gap-xs">
                <View className="h-2 overflow-hidden rounded-full bg-background-subtle">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${collectionProgress}%` }}
                  />
                </View>
                <Text className="text-center font-sans text-micro text-foreground-muted uppercase tracking-widest">
                  {Math.round(collectionProgress)}% to first prediction
                </Text>
              </View>
            )}
          </View>

          {/* Live Stats */}
          <View className="gap-lg rounded-3xl bg-background-elevated p-lg shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="font-serif text-primary text-title">
                Live Stats
              </Text>
              {!streamLoading && (
                <View className="flex-row items-center gap-xs rounded-full bg-primary-subtle px-md py-xxs">
                  <View className="h-2 w-2 rounded-full bg-primary" />
                  <Text className="font-bold font-sans text-micro text-primary uppercase tracking-widest">
                    Live
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
                  {currentStateLabel}
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

          <View className="mt-sm items-center justify-center rounded-3xl border border-border bg-background-elevated px-lg py-md">
            <Text className="text-center font-bold font-sans text-caption text-foreground-muted">
              {bufferedSamples > 0
                ? `Buffering live samples: ${bufferedSamples}/360`
                : "Waiting for device data..."}
            </Text>
          </View>
        </Screen>
      </View>
    </PatientTabScaffold>
  );
}
