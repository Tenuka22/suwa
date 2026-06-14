'use client';

import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  Activity,
  Calendar,
  HeartPulse,
  Moon,
  Users,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/card";
import { RootBottomBar } from "@/components/ui/root-bottom-bar";
import { Screen } from "@/components/ui/screen";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { moodToAction } from "@/utils/mood";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function GuardianActivitiesScreen() {
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

  const spriteQuery = useQuery(
    orpc.getManagedPatientSprite.queryOptions({
      input: { patientUserId: selectedPatientId ?? "" },
      enabled: !!selectedPatientId,
    })
  );

  const spriteData = spriteQuery.data;

  const wellnessQuery = useQuery(
    orpc.getManagedPatientWellness.queryOptions({
      input: { patientUserId: selectedPatientId ?? "" },
      enabled: !!selectedPatientId,
    })
  );

  const wellnessActions = wellnessQuery.data ?? [];
  const totalActions = wellnessActions.length;
  const totalCredits = wellnessActions.reduce(
    (sum, a) => sum + a.creditsEarned,
    0
  );

  const selectedPatient = patients.find((p) => p.userId === selectedPatientId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen
        contentClassName="flex-1 gap-section px-page py-page pb-24"
        scrollClassName="flex-1 bg-background"
      >
        <View className="gap-2">
          <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
            Patient Activities
          </Text>
          <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
            Monitor wellness activities of your linked patients.
          </Text>
        </View>

        {patientsQuery.isLoading && patients.length === 0 && (
          <View className="items-center justify-center py-16">
            <Text className="font-bold font-sans text-muted-foreground">
              Loading patients...
            </Text>
          </View>
        )}

        {!patientsQuery.isLoading && patients.length === 0 && (
          <View className="items-center justify-center rounded-card border-2 border-border border-dashed py-16">
            <Users color={colors.mutedForeground} size={48} />
            <Text className="mt-4 font-bold font-sans text-muted-foreground">
              No patients linked yet
            </Text>
          </View>
        )}

        {patients.length > 0 && (
          <>
            <ScrollView
              className="flex-row"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row gap-2">
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
              </View>
            </ScrollView>

            {spriteQuery.isLoading && (
              <View className="items-center justify-center py-16">
                <Text className="font-bold font-sans text-muted-foreground">
                  Loading patient sprite...
                </Text>
              </View>
            )}

            {spriteData && (
              <>
                <Card className="gap-4">
                  <View className="flex-row items-center gap-2">
                    <HeartPulse color={colors.foreground} size={16} />
                    <Text className="font-bold text-foreground text-sm uppercase tracking-wider">
                      {selectedPatient?.alias ?? "Patient"}'s Sprite
                    </Text>
                  </View>

                  <View className="items-center py-4">
                    <View className="h-48 w-48 items-center justify-center">
                      <SpriteAnimation
                        action={moodToAction(spriteData.sprite.mood)}
                        size="lg"
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3 rounded-xl border border-border/50 bg-muted/5 p-3">
                    <View className="rounded-full bg-orange-500/15 p-2">
                      <HeartPulse color="#f97316" size={16} />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                        Mood
                      </Text>
                      <Text className="font-black font-sans text-base text-foreground uppercase tracking-tight">
                        {spriteData.sprite.mood}
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                        Health
                      </Text>
                      <Text className="font-bold text-foreground text-xs uppercase tracking-wider">
                        {spriteData.sprite.health}%
                      </Text>
                    </View>
                    <View className="h-3 overflow-hidden rounded-full bg-muted">
                      <View
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${spriteData.sprite.health}%` }}
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                      <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                        Streak
                      </Text>
                      <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                        {spriteData.sprite.streakDays}
                      </Text>
                    </View>
                    <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                      <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                        Moonlight Credits
                      </Text>
                      <View className="mt-1 flex-row items-center gap-1">
                        <Moon color={colors.foreground} size={16} />
                        <Text className="font-black font-sans text-2xl text-foreground">
                          {spriteData.credits.balance}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>

                {!wellnessQuery.isLoading && wellnessActions.length === 0 && (
                  <View className="items-center justify-center rounded-card border-2 border-border border-dashed py-16">
                    <Activity color={colors.mutedForeground} size={48} />
                    <Text className="mt-4 font-bold font-sans text-muted-foreground">
                      No activities recorded yet
                    </Text>
                  </View>
                )}

                {!wellnessQuery.isLoading && wellnessActions.length > 0 && (
                  <>
                    <Card className="gap-4">
                      <View className="flex-row items-center gap-2">
                        <Activity color={colors.foreground} size={16} />
                        <Text className="font-bold text-foreground text-sm uppercase tracking-wider">
                          Wellness Summary
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                          <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                            Total Actions
                          </Text>
                          <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                            {totalActions}
                          </Text>
                        </View>
                        <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                          <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                            Credits Earned
                          </Text>
                          <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                            {totalCredits}
                          </Text>
                        </View>
                      </View>
                    </Card>

                    <View className="gap-3">
                      <Text className="font-bold text-foreground text-sm uppercase tracking-wider">
                        Activity History
                      </Text>
                      {wellnessActions.map((action) => (
                        <Card className="gap-3" key={action.id}>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                              <Activity color={colors.foreground} size={16} />
                              <Text className="font-bold text-foreground text-sm uppercase tracking-wide">
                                {action.actionType.replace(/_/g, " ")}
                              </Text>
                            </View>
                          </View>
                          <View className="gap-2 rounded-xl border border-border/50 bg-muted/5 p-3">
                            <View className="flex-row items-center gap-2">
                              <Calendar color={colors.foreground} size={14} />
                              <Text className="font-medium text-foreground text-sm">
                                {new Date(
                                  action.completedAt
                                ).toLocaleDateString()}
                              </Text>
                            </View>
                            <Text className="font-medium text-foreground text-sm">
                              Duration: {action.durationSeconds}s
                            </Text>
                            <Text className="font-medium text-primary text-sm">
                              +{action.creditsEarned} credits
                            </Text>
                          </View>
                        </Card>
                      ))}
                    </View>
                  </>
                )}

                {wellnessQuery.isLoading && (
                  <View className="items-center justify-center py-16">
                    <Text className="font-bold font-sans text-muted-foreground">
                      Loading activities...
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </Screen>

      <View className="absolute right-page bottom-page left-page">
        <RootBottomBar />
      </View>
    </>
  );
}
