import { consumeEventIterator } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Brain,
  Clock,
  Database,
  TrendingDown,
  WifiOff,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, ViewStyle } from "react-native";

import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { orpc } from "@/utils/orpc";
import {
  CLASS_COLORS,
  CLASS_LABELS,
  formatStressTime,
  statusFromPrediction,
} from "@/utils/stress/analysis";
import { useThemeColor } from "@/utils/theme";

type PredictionResult = { prediction: string; probabilities: number[] };

interface StressDataPoint {
  sample: number[];
  timestamp: number;
}

interface StressData {
  fetchedAt: number;
  predictions: Record<string, unknown> | null;
  sampleCount: number;
  samples: StressDataPoint[];
  totalSamples: number;
}

export default function GuardianPatientStressScreen() {
  const { patientUserId } = useLocalSearchParams<{ patientUserId: string }>();
  const colors = useThemeColor();
  const router = useRouter();

  const [streamData, setStreamData] = useState<StressData | null>(null);
  const [streamLoading, setStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);

  const cancelRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!patientUserId) {
      return;
    }

    let isCancelled = false;

    async function subscribe() {
      try {
        setStreamLoading(true);
        setStreamError(false);

        const iterator = await orpc.subscribePatientStressStream.call({
          patientUserId,
        } as never);
        if (isCancelled) {
          await iterator.return?.();
          return;
        }

        const cancel = consumeEventIterator(iterator, {
          onEvent: (data) => {
            if (data.type === "update") {
              const stressData = data.data as StressData;
              setStreamData(stressData);
              setStreamLoading(false);
              setStreamError(false);
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
  }, [patientUserId]);

  const guardianAckMutation = useMutation(
    orpc.guardianAcknowledgeStressDownload.mutationOptions()
  );

  useEffect(() => {
    if (streamData && patientUserId) {
      guardianAckMutation.mutate({ patientUserId } as never);
    }
  }, [streamData, patientUserId]);

  const results = (
    streamData?.predictions as Record<string, unknown> | undefined
  )?.results as Record<string, PredictionResult> | undefined;
  const combined = results?.["0"] ?? null;

  const status = combined ? statusFromPrediction(combined.prediction) : null;
  const StatusIcon = status?.icon ?? Brain;

  const handleRetry = useCallback(() => {
    setStreamError(false);
    setStreamLoading(true);
    cancelRef.current?.();
    cancelRef.current = null;
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="gap-section bg-background px-page py-page pb-40"
        scrollClassName="flex-1 bg-background"
      >
        <View className="mb-2 gap-1.5">
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
            Patient Stress
          </Text>
          <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
            Metrics
          </Text>
        </View>

        {streamError && !streamData ? (
          <Card className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="rounded-full border-2 border-border bg-destructive/10 p-3">
                <WifiOff color={colors.destructive} size={24} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-black font-sans text-2xl text-destructive tracking-tight">
                  Connection Lost
                </Text>
                <Text className="font-medium font-sans text-muted-foreground text-xs">
                  Unable to reach the server. Pull down to retry.
                </Text>
              </View>
            </View>
            <Pressable onPress={handleRetry}>
              <Text className="text-center font-bold font-sans text-primary text-sm">
                Retry Connection
              </Text>
            </Pressable>
          </Card>
        ) : streamLoading && !streamData ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            {status && combined ? (
              <Card className={`gap-4 ${status.bg}`}>
                <View className="flex-row items-center gap-3">
                  <View className="rounded-full border-2 border-border bg-background p-3">
                    <StatusIcon color={colors.foreground} size={24} />
                  </View>
                  <View className="gap-0.5">
                    <Text
                      className={`font-black font-sans text-2xl tracking-tight ${status.color}`}
                    >
                      {status.label}
                    </Text>
                    <Text className="font-medium font-sans text-muted-foreground text-xs">
                      Current Stress Level
                    </Text>
                  </View>
                </View>

                <View className="gap-2">
                  {combined.probabilities.map((prob, i) => {
                    const pct = (prob * 100).toFixed(1);
                    const isActive =
                      CLASS_LABELS[i].toLowerCase() ===
                      combined.prediction.toLowerCase();
                    return (
                      <View
                        className="flex-row items-center gap-2"
                        key={CLASS_LABELS[i]}
                      >
                        <Text className="w-20 text-right font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                          {CLASS_LABELS[i]}
                        </Text>
                        <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: pct + "%",
                              backgroundColor: isActive
                                ? CLASS_COLORS[i]
                                : `${CLASS_COLORS[i]}44`,
                            } as ViewStyle}
                          />
                        </View>
                        <Text className="w-10 text-right font-mono text-[10px] text-muted-foreground">
                          {pct}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            ) : (
              <Card className="gap-3">
                <View className="flex-row items-center gap-2">
                  <BarChart3 color={colors.mutedForeground} size={20} />
                  <Text className="font-bold font-sans text-base text-foreground">
                    No stress data available yet
                  </Text>
                </View>
                <Text className="font-medium font-sans text-muted-foreground text-xs leading-5">
                  Once the patient collects enough IoT readings, their stress
                  predictions will appear here.
                </Text>
              </Card>
            )}

            {streamData && (
              <Card className="gap-3">
                <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wider">
                  Data Summary
                </Text>
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-medium font-sans text-muted-foreground text-xs">
                      <Database color={colors.mutedForeground} size={12} />{" "}
                      Samples Collected
                    </Text>
                    <Text className="font-bold font-sans text-foreground text-sm">
                      {streamData.sampleCount}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-medium font-sans text-muted-foreground text-xs">
                      <Clock color={colors.mutedForeground} size={12} /> Last
                      Sync
                    </Text>
                    <Text className="font-bold font-sans text-foreground text-sm">
                      {formatStressTime(streamData.fetchedAt)}
                    </Text>
                  </View>
                </View>

                {streamData.samples.length > 0 && (
                  <View className="gap-1 pt-1">
                    <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-[0.12em]">
                      Recent Signal
                    </Text>
                    <View className="flex-row flex-wrap gap-0.5">
                      {streamData.samples.slice(-60).map((s, i) => {
                        const hr = s.sample[4];
                        const intensity = Math.min(
                          1,
                          Math.max(0, (hr - 50) / 100)
                        );
                        return (
                          <View
                            key={i}
                            style={{
                              width: 4,
                              height: 16,
                              borderRadius: 1,
                              backgroundColor: `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`,
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}
              </Card>
            )}
          </>
        )}
      </Screen>
      <ScreenBottomBar>
        <Pressable
          className="aspect-square h-1 items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.foreground} size={18} strokeWidth={2.5} />
        </Pressable>
      </ScreenBottomBar>
    </>
  );
}
