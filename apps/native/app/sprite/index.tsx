import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { MoonlightCreditsDisplay } from "@/components/ui/moonlight-credits-display";
import { Screen } from "@/components/ui/screen";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { WellnessActionCard } from "@/components/ui/wellness-action-card";
import { orpc } from "@/utils/orpc";

function moodToAction(mood: string): "idle" | "happy" | "thinking" | "alert" {
  if (mood === "sleep") {
    return "alert";
  }
  if (mood === "yawn") {
    return "thinking";
  }
  return "idle";
}

const WELLNESS_ACTIONS = [
  {
    icon: "B",
    title: "Breath Rhythm",
    description:
      "Morning breathing exercise to start your day calm and centered.",
    timeSlot: "morning" as const,
    actionType: "breathing_morning",
    credits: 10,
  },
  {
    icon: "M",
    title: "Morning Meditation",
    description: "Set your intention for the day with a short meditation.",
    timeSlot: "morning" as const,
    actionType: "meditation_morning",
    credits: 10,
  },
  {
    icon: "B",
    title: "Evening Breath",
    description: "Wind down with a guided evening breathing session.",
    timeSlot: "evening" as const,
    actionType: "breathing_evening",
    credits: 10,
  },
  {
    icon: "M",
    title: "Evening Meditation",
    description: "Release the day's tension with a calming meditation.",
    timeSlot: "evening" as const,
    actionType: "meditation_evening",
    credits: 10,
  },
  {
    icon: "B",
    title: "Night Calm",
    description: "Deep breathing for a restful night's sleep.",
    timeSlot: "night" as const,
    actionType: "breathing_night",
    credits: 10,
  },
] as const;

const SLOT_HEADERS: Record<string, { label: string; icon: string }> = {
  morning: { label: "Morning", icon: "☀" },
  evening: { label: "Evening", icon: "☽" },
  night: { label: "Night", icon: "☾" },
};

const SLOTS = ["morning", "evening", "night"] as const;

export default function SpriteScreen() {
  const spriteQuery = useQuery(
    orpc.getSpriteState.queryOptions({ queryKey: ["getSpriteState"] })
  );
  const creditsQuery = useQuery(
    orpc.getMoonlightCredits.queryOptions({ queryKey: ["getMoonlightCredits"] })
  );
  const historyQuery = useQuery(
    orpc.getWellnessHistory.queryOptions({ queryKey: ["getWellnessHistory"] })
  );

  const sprite = spriteQuery.data;
  const credits = creditsQuery.data;
  const todayActions =
    historyQuery.data?.filter((a) => {
      const today = new Date().toISOString().split("T")[0];
      return a.completedAt.startsWith(today);
    }) ?? [];

  const completedTypes = new Set(todayActions.map((a) => a.actionType));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="gap-section bg-background px-page py-page"
        scrollClassName="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-section py-page"
        >
          {/* Header */}
          <View className="gap-2">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Wellness
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Your Sprite
            </Text>
            <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
              Keep your Sprite healthy through consistent wellness actions.
              Rewarded for showing up every day.
            </Text>
          </View>

          {/* Sprite Visual - no border, large */}
          <View className="items-center py-4">
            <View className="h-48 w-48 items-center justify-center">
              <SpriteAnimation action={moodToAction(sprite?.mood ?? "idle")} size="lg" />
            </View>
          </View>

          {/* Today's Actions - grouped by time slot */}
          <View className="gap-4">
            <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
              Today's Wellness Actions
            </Text>

            {SLOTS.map((slot) => {
              const slotActions = WELLNESS_ACTIONS.filter(
                (a) => a.timeSlot === slot
              );
              if (slotActions.length === 0) {
                return null;
              }

              return (
                <View className="gap-2" key={slot}>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                      {SLOT_HEADERS[slot]?.icon} {SLOT_HEADERS[slot]?.label}
                    </Text>
                    <View className="h-px flex-1 bg-border" />
                  </View>

                  {slotActions.map((action) => {
                    const completed = completedTypes.has(action.actionType);

                    return (
                      <WellnessActionCard
                        completed={completed}
                        credits={action.credits}
                        description={action.description}
                        icon={completed ? "✓" : action.icon}
                        key={action.actionType}
                        timeSlot={action.timeSlot}
                        title={action.title}
                      />
                    );
                  })}
                </View>
              );
            })}
          </View>

          {/* Moonlight Credits Bar */}
          {credits && (
            <View className="rounded-card border-2 border-border bg-card px-card py-card">
              <Text className="mb-2 font-bold font-sans text-foreground text-xs uppercase tracking-[0.2em]">
                Moonlight Credits
              </Text>
              <MoonlightCreditsDisplay
                balance={credits.balance}
                consistencyScore={credits.consistencyScore}
                totalEarned={credits.totalEarned}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-2">
            <Button className="w-full" href="/sprite/actions" variant="primary">
              Start Wellness Action
            </Button>
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}
