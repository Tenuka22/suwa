import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, HeartPulse, Moon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
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
  const router = useRouter();
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
  const [mascotPressed, setMascotPressed] = useState(false);

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
          </View>

          <View className="items-center py-6">
            <Pressable
              className="h-80 w-80 items-center justify-center"
              onPressIn={() => setMascotPressed(true)}
              onPressOut={() => setMascotPressed(false)}
            >
              <View
                className="items-center justify-center"
                style={{
                  transform: [
                    { translateY: mascotPressed ? 4 : 0 },
                    { scale: mascotPressed ? 0.98 : 1 },
                  ],
                }}
              >
                <SpriteAnimation
                  action={moodToAction(sprite?.mood ?? "idle")}
                  size="lg"
                />
              </View>
            </Pressable>
          </View>

          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                Sprite Stats
              </Text>
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                Live
              </Text>
            </View>

            <View className="gap-3 rounded-card border-2 border-border bg-card p-4">
              <View className="flex-row items-center gap-3">
                <View className="rounded-full bg-orange-500/15 p-3">
                  <HeartPulse color="#f97316" size={18} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Mood
                  </Text>
                  <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                    {sprite?.mood ?? "idle"}
                  </Text>
                </View>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Progress
                  </Text>
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
                    {todayActions.length}/5
                  </Text>
                </View>
                <View className="h-3 overflow-hidden rounded-full bg-muted">
                  <View
                    className="h-full rounded-full bg-orange-500"
                    style={{
                      width: `${Math.min(100, (todayActions.length / 5) * 100)}%`,
                    }}
                  />
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                  <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                    Streak
                  </Text>
                  <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                    {todayActions.length}
                  </Text>
                </View>
                <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3">
                  <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                    Credits
                  </Text>
                  <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                    {credits?.balance ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Screen>
      <ScreenBottomBar>
        <View className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-background px-3 py-2">
          <Moon color="#f97316" size={18} />
          <Text className="font-black font-sans text-foreground text-lg">
            {credits?.balance ?? 0}
          </Text>
        </View>
        <Button
          className="h-12 flex-1"
          href="/sprite/actions"
          icon={<ChevronRight color="#ffffff" size={16} />}
          variant="primary"
        >
          Actions
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
