import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  Activity,
  BarChart3,
  Brain,
  TrendingDown,
  TrendingUp,
  Users,
  WifiOff,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { RootBottomBar } from "@/components/ui/root-bottom-bar";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";
import {
  CLASS_COLORS,
  CLASS_LABELS,
  classIndex,
  computeInsights,
  computeStressEmergence,
  formatStressDuration,
  formatStressTime,
  type StoredPrediction,
  type StressData,
  statusFromPrediction,
} from "@/utils/stress/analysis";
import { useThemeColor } from "@/utils/theme";

export default function GuardianTrackManagementScreen() {
  const colors = useThemeColor();

  const patientsQuery = useQuery(orpc.getManagedPatients.queryOptions());
  const patients = patientsQuery.data ?? [];

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].userId);
    }
  }, [patients, selectedPatientId]);

  const stressQuery = useQuery(
    orpc.getPatientStressData.queryOptions({
      input: { patientUserId: selectedPatientId ?? "" },
      enabled: !!selectedPatientId,
    })
  );

  const stressData = stressQuery.data as StressData | undefined;
  const bundles = stressData?.bundles ?? [];
  const totalSamples = stressData?.totalSamples ?? 0;

  const latestPrediction: StoredPrediction | null =
    bundles.length > 0 ? bundles[bundles.length - 1].prediction : null;

  const status = latestPrediction
    ? statusFromPrediction(latestPrediction.predictedClass)
    : null;

  const StatusIcon = status?.icon ?? Brain;
  const insights = useMemo(() => computeInsights(bundles), [bundles]);
  const stressEmergence = useMemo(
    () => computeStressEmergence(bundles),
    [bundles]
  );

  const isLoading = patientsQuery.isLoading && patients.length === 0;
  const noPatients = !patientsQuery.isLoading && patients.length === 0;
  const hasData = bundles.length > 0;

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
                Stress Tracking
              </Text>
              <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
                Monitor
              </Text>
              <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
                Monitor real-time stress metrics of your linked patients.
              </Text>
            </View>
          </View>

          {patients.length > 0 && (
            <ScrollView
              className="-mx-page"
              contentContainerClassName="px-page gap-2"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {patients.map((patient) => {
                const isSelected = patient.userId === selectedPatientId;
                return (
                  <Pressable
                    className={`h-9 rounded-full border-2 px-4 py-2 ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border bg-card"
                    }`}
                    key={patient.userId}
                    onPress={() => setSelectedPatientId(patient.userId)}
                  >
                    <Text
                      className={`font-bold text-xs uppercase tracking-wider ${
                        isSelected
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {patient.alias}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {isLoading && (
            <View className="items-center justify-center py-16">
              <Text className="font-bold font-sans text-muted-foreground">
                Loading patients...
              </Text>
            </View>
          )}

          {noPatients && (
            <View className="items-center justify-center rounded-card border-2 border-border border-dashed py-16">
              <Users color={colors.mutedForeground} size={48} />
              <Text className="mt-4 font-bold font-sans text-muted-foreground">
                No patients linked yet
              </Text>
            </View>
          )}

          {stressQuery.isError && selectedPatientId && (
            <View className="gap-3 rounded-card border-2 border-border bg-card p-4">
              <View className="flex-row items-center gap-3">
                <View className="rounded-full border-2 border-border bg-destructive/10 p-3">
                  <WifiOff color={colors.destructive} size={24} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-black font-sans text-2xl text-destructive tracking-tight">
                    Connection Lost
                  </Text>
                  <Text className="font-medium text-muted-foreground text-xs">
                    Unable to reach the server.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {selectedPatientId &&
            !stressQuery.isLoading &&
            !stressQuery.isError &&
            bundles.length === 0 && (
              <View className="gap-3 rounded-card border-2 border-border bg-card p-4">
                <View className="flex-row items-center gap-3">
                  <View className="rounded-full border-2 border-border bg-muted p-3">
                    <Brain color={colors.mutedForeground} size={24} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-black font-sans text-2xl text-foreground tracking-tight">
                      No Data Yet
                    </Text>
                    <Text className="font-medium text-muted-foreground text-xs">
                      Patient has no stress data available yet.
                    </Text>
                  </View>
                </View>
              </View>
            )}

          {hasData && (
            <>
              <View className="items-center py-6">
                <View className="h-48 w-48 items-center justify-center rounded-full border-4 border-border bg-card shadow-sm">
                  <View
                    className={`h-full w-full items-center justify-center rounded-full ${status?.bg || "bg-muted/30"}`}
                  >
                    <StatusIcon
                      color={
                        status?.color === "text-destructive"
                          ? colors.destructive
                          : status?.color === "text-success"
                            ? colors.success
                            : colors.primary
                      }
                      size={48}
                    />
                    <Text
                      className={`mt-3 font-black font-sans text-lg uppercase tracking-widest ${status?.color || "text-muted-foreground"}`}
                    >
                      {status?.label || "No Data"}
                    </Text>
                  </View>
                </View>
              </View>

              {latestPrediction && (
                <View className="gap-3 rounded-card border-2 border-border bg-card p-4">
                  {latestPrediction.probabilities.map((prob, i) => {
                    const pct = (prob * 100).toFixed(1);
                    const isActive =
                      CLASS_LABELS[i].toLowerCase() ===
                      latestPrediction.predictedClass.toLowerCase();
                    return (
                      <View
                        className="flex-row items-center gap-2"
                        key={CLASS_LABELS[i]}
                      >
                        <Text className="w-16 text-right font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                          {CLASS_LABELS[i]}
                        </Text>
                        <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(prob * 100)}%`,
                              backgroundColor: isActive
                                ? CLASS_COLORS[i]
                                : `${CLASS_COLORS[i]}44`,
                            }}
                          />
                        </View>
                        <Text className="w-10 text-right font-mono text-[10px] text-muted-foreground">
                          {pct}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                    Prediction Timeline
                  </Text>
                  {stressEmergence && (
                    <Text className="font-sans text-muted-foreground text-xs">
                      {stressEmergence.stressEpisodeActive
                        ? "Stress active"
                        : `First stress ${stressEmergence.firstStressAgo}`}
                    </Text>
                  )}
                </View>
                <View className="gap-3 rounded-card border-2 border-border bg-card p-4">
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

                  <View className="flex-row gap-4">
                    {CLASS_LABELS.map((label, i) => (
                      <View
                        className="flex-row items-center gap-1.5"
                        key={label}
                      >
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

                  {stressEmergence && <View className="h-px bg-border" />}

                  {stressEmergence && (
                    <View className="gap-2">
                      {stressEmergence.stressEpisodeActive && (
                        <View className="flex-row items-center gap-2">
                          <View className="h-2 w-2 rounded-full bg-destructive" />
                          <Text className="font-bold font-sans text-destructive text-xs uppercase tracking-wider">
                            Stress episode ongoing ·{" "}
                            {stressEmergence.stressEpisodeDuration}m
                          </Text>
                        </View>
                      )}
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans text-muted-foreground text-xs">
                          First stress detected
                        </Text>
                        <Text className="font-bold font-sans text-foreground text-xs">
                          {stressEmergence.firstStressAgo}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans text-muted-foreground text-xs">
                          Stress bundles
                        </Text>
                        <Text className="font-bold font-sans text-foreground text-xs">
                          {stressEmergence.totalStressBundles} /{" "}
                          {bundles.length}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans text-muted-foreground text-xs">
                          Stress episodes
                        </Text>
                        <Text className="font-bold font-sans text-foreground text-xs">
                          {stressEmergence.stressPeriodCount}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {insights && (
                <View className="gap-4">
                  <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                    Live Stats
                  </Text>
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
                          {insights.dominantLabel}
                        </Text>
                      </View>
                    </View>

                    <View className="gap-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                          Stress Ratio
                        </Text>
                        <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
                          {insights.stressRatio}%
                        </Text>
                      </View>
                      <View className="h-3 overflow-hidden rounded-full bg-muted">
                        <View
                          className="h-full rounded-full bg-destructive"
                          style={{
                            width: `${Math.min(100, insights.stressRatio)}%`,
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
                          {insights.trendDirection === "up" ? (
                            <TrendingUp color={colors.destructive} size={16} />
                          ) : insights.trendDirection === "down" ? (
                            <TrendingDown color={colors.success} size={16} />
                          ) : (
                            <BarChart3 color={colors.foreground} size={16} />
                          )}
                          <Text
                            className="font-black font-sans text-foreground text-lg"
                            numberOfLines={1}
                          >
                            {insights.trendLabel}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                        <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                          Avg Confidence
                        </Text>
                        <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                          {insights.averageConfidence}%
                        </Text>
                      </View>
                    </View>

                    {insights.sessionMinutes > 0 && (
                      <View className="flex-row items-center justify-between">
                        <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                          Session Duration
                        </Text>
                        <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
                          {formatStressDuration(insights.sessionMinutes) ||
                            "0m"}
                        </Text>
                      </View>
                    )}
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
                                style={{
                                  backgroundColor: CLASS_COLORS[i],
                                }}
                              />
                              <Text className="font-sans text-muted-foreground text-xs">
                                {count}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </>
                  )}
                  <View className="h-px bg-border" />
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-muted-foreground text-xs">
                      Last Bundle
                    </Text>
                    <Text className="font-bold font-sans text-foreground">
                      {bundles.length > 0
                        ? formatStressTime(
                            bundles[bundles.length - 1].createdAt
                          )
                        : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Screen>
      <View className="absolute right-page bottom-page left-page">
        <RootBottomBar />
      </View>
    </>
  );
}
