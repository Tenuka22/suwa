import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  HeartPulse,
  Moon,
  Sparkles,
  Users,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { moodToAction } from "@/utils/mood";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export function GuardianLanding() {
  const colors = useThemeColor();
  const router = useRouter();

  const patientsQuery = useQuery(orpc.getManagedPatients.queryOptions());
  const patients = patientsQuery.data ?? [];

  const firstPatientId = patients[0]?.userId;

  const spriteQuery = useQuery(
    orpc.getManagedPatientSprite.queryOptions({
      input: { patientUserId: firstPatientId ?? "" },
      enabled: !!firstPatientId,
    })
  );

  const wellnessQuery = useQuery(
    orpc.getManagedPatientWellness.queryOptions({
      input: { patientUserId: firstPatientId ?? "" },
      enabled: !!firstPatientId,
    })
  );

  const wellnessActions = wellnessQuery.data ?? [];
  const totalCredits = wellnessActions.reduce(
    (sum, a) => sum + a.creditsEarned,
    0
  );

  return (
    <View className="gap-14 pb-12">
      {/* Header */}
      <Animated.View className="gap-2 px-1" entering={FadeInDown.duration(600)}>
        <View className="flex-row items-center gap-3">
          <View className="h-[3px] w-6 bg-primary" />
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
            Guardian Dashboard
          </Text>
        </View>
        <Text className="font-black font-sans text-3xl text-foreground leading-none tracking-tighter">
          Your Patients
        </Text>
        <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-relaxed">
          Monitor wellness via subscribePatientStressStream. Sprite health,
          Moonlight Credits, and activity progress for all linked patients.
        </Text>
      </Animated.View>

      {patientsQuery.isLoading && (
        <View className="items-center justify-center py-20">
          <View className="h-16 w-16 animate-pulse rounded-card border-[3px] border-border bg-muted" />
          <Text className="mt-4 font-bold font-sans text-muted-foreground uppercase tracking-wider">
            Loading patients...
          </Text>
        </View>
      )}

      {!patientsQuery.isLoading && patients.length === 0 && (
        <Animated.View
          className="relative px-1"
          entering={FadeIn.duration(600)}
        >
          <View
            className="relative overflow-hidden rounded-card border-[3px] border-border bg-card"
            style={{ minHeight: 280 }}
          >
            <View className="absolute -top-8 -right-8 h-24 w-24 rotate-12 border-[5px] border-primary/15" />
            <View className="absolute -bottom-6 -left-6 h-16 w-16 bg-primary/10" />
            <View className="h-full items-center justify-center gap-4 px-card py-card">
              <Users color={colors.mutedForeground} size={48} />
              <Text className="font-black font-sans text-foreground text-lg tracking-tight">
                No patients linked yet
              </Text>
              <Text className="max-w-[80%] text-center font-medium font-sans text-muted-foreground text-sm leading-5">
                When a patient sends you an invitation, accept it here to start
                monitoring their wellness via a secure stream.
              </Text>
              <View className="h-[3px] w-12 bg-primary/40" />
            </View>
          </View>
        </Animated.View>
      )}

      {patients.length > 0 && (
        <>
          {/* Section divider */}
          <View className="mx-1 h-[3px] bg-primary" />

          {/* Linked Patients carousel */}
          <Animated.View className="gap-4" entering={FadeIn.duration(600)}>
            <Text className="px-1 font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
              Linked Patients ({patients.length})
            </Text>

            <ScrollView
              className="flex-row"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row gap-3 px-1">
                {patients.map((patient) => (
                  <Pressable
                    className="w-48 gap-3 rounded-card border-[3px] border-border bg-muted p-4"
                    key={patient.userId}
                    onPress={() => router.push("/activities")}
                    style={({ pressed }) => [
                      {
                        transform: pressed
                          ? [{ translateX: 3 }, { translateY: 3 }]
                          : [{ translateX: 0 }, { translateY: 0 }],
                      },
                    ]}
                  >
                    <View className="items-center">
                      <View className="h-24 w-24 items-center justify-center rounded-card border-2 border-border bg-card">
                        <SpriteAnimation action="idle" size="sm" />
                      </View>
                    </View>
                    <Text className="text-center font-black font-sans text-base text-foreground tracking-tight">
                      {patient.alias}
                    </Text>
                    <View className="flex-row items-center justify-center gap-1 rounded-card border-2 border-primary/30 bg-primary/20 px-3 py-1">
                      <ArrowRight color={colors.primary} size={14} />
                      <Text className="font-bold font-sans text-[10px] text-primary uppercase tracking-wider">
                        View Activities
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          {spriteQuery.data && (
            <Animated.View className="px-1" entering={FadeInDown.duration(700)}>
              <View className="relative" style={{ overflow: "visible" }}>
                <View
                  className="absolute inset-0 rounded-card bg-border"
                  style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                />
                <View className="gap-section rounded-card border-2 border-border bg-card p-card">
                  <View className="flex-row items-center gap-2">
                    <Sparkles color={colors.foreground} size={16} />
                    <Text className="font-bold text-foreground text-sm uppercase tracking-wider">
                      {patients[0].alias}'s Sprite Status
                    </Text>
                  </View>

                  <View className="items-center py-2">
                    <View className="h-40 w-40 items-center justify-center">
                      <SpriteAnimation
                        action={moodToAction(spriteQuery.data.sprite.mood)}
                        size="md"
                      />
                    </View>
                  </View>

                  <View className="gap-3">
                    <View className="flex-row items-center gap-3 rounded-card border-2 border-border bg-muted p-3">
                      <View className="rounded-full bg-orange-500/15 p-2">
                        <HeartPulse color="#f97316" size={16} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                          Mood
                        </Text>
                        <Text className="font-black font-sans text-base text-foreground uppercase tracking-tight">
                          {spriteQuery.data.sprite.mood}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                          Health
                        </Text>
                        <Text className="font-black font-sans text-base text-foreground">
                          {spriteQuery.data.sprite.health}%
                        </Text>
                      </View>
                    </View>

                    <View className="h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
                      <View
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${spriteQuery.data.sprite.health}%` }}
                      />
                    </View>

                    <View className="flex-row gap-2">
                      <View className="flex-1 rounded-card border-[3px] border-border bg-muted px-3 py-3">
                        <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                          Streak
                        </Text>
                        <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                          {spriteQuery.data.sprite.streakDays}
                        </Text>
                      </View>
                      <View className="flex-1 rounded-card border-[3px] border-border bg-muted px-3 py-3">
                        <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                          Credits
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <Moon color={colors.foreground} size={16} />
                          <Text className="font-black font-sans text-2xl text-foreground">
                            {spriteQuery.data.credits.balance}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-1 rounded-card border-[3px] border-border bg-muted px-3 py-3">
                        <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                          Actions
                        </Text>
                        <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                          {wellnessActions.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Button
                    className="h-12 w-full"
                    href="/activities"
                    icon={<ArrowRight color="white" size={18} />}
                  >
                    View All Activities
                  </Button>
                </View>
              </View>
            </Animated.View>
          )}

          {patients.length > 1 && (
            <Animated.View
              className="gap-4 px-1"
              entering={FadeInDown.duration(800)}
            >
              <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                Other Patients
              </Text>
              <View className="gap-3">
                {patients.slice(1).map((patient) => (
                  <Pressable
                    className="flex-row items-center gap-4 rounded-card border-[3px] border-border bg-muted p-4"
                    key={patient.userId}
                    onPress={() => router.push("/activities")}
                    style={({ pressed }) => [
                      {
                        transform: pressed
                          ? [{ translateX: 3 }, { translateY: 3 }]
                          : [{ translateX: 0 }, { translateY: 0 }],
                      },
                    ]}
                  >
                    <View className="h-14 w-14 items-center justify-center rounded-card border-2 border-border bg-card">
                      <SpriteAnimation action="idle" size="sm" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-black font-sans text-base text-foreground tracking-tight">
                        {patient.alias}
                      </Text>
                      <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
                        Tap to monitor activities
                      </Text>
                    </View>
                    <View className="rounded-card border-2 border-border bg-card p-2">
                      <ArrowRight color={colors.foreground} size={18} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}
