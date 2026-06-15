"use client";

import { useQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CloudSun,
  Moon,
  Sun,
  Trophy,
  Zap,
  Wind,
  Droplet,
  Footprints,
  Sparkles,
  Heart,
} from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playSoftChime } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const ACTION_ROUTES: Record<string, string> = {
  breathing_morning:
    "/sprite/actions/breathing?type=morning&action=breathing_morning",
  breathing_evening:
    "/sprite/actions/breathing?type=afternoon&action=breathing_evening",
  breathing_night:
    "/sprite/actions/breathing?type=night&action=breathing_night",
  meditation_morning:
    "/sprite/actions/meditation?type=morning&action=meditation_morning",
  meditation_evening:
    "/sprite/actions/meditation?type=evening&action=meditation_evening",
  gratitude_morning:
    "/sprite/actions/gratitude?type=morning&action=gratitude_morning",
  gratitude_evening:
    "/sprite/actions/gratitude?type=evening&action=gratitude_evening",
  hydration: "/sprite/actions/hydration",
  walking: "/sprite/actions/walking",
  sleep_prep: "/sprite/actions/sleep-prep",
  journaling: "/sprite/actions/journaling",
  nutrition: "/sprite/actions/nutrition",
  social_checkin: "/sprite/actions/social-checkin",
  stretching: "/sprite/actions/stretching",
};

const ACTION_ICONS: Record<string, any> = {
  breathing: Wind,
  meditation: Sparkles,
  gratitude: Heart,
  hydration: Droplet,
  walking: Footprints,
  sleep_prep: Moon,
  journaling: Sparkles,
  nutrition: Zap,
  social_checkin: Heart,
  stretching: Wind,
};

export default function SpriteActionsScreen() {
  const colors = useThemeColor();
  const router = useRouter();

  const ACTION_COLORS = useMemo<Record<string, string>>(() => ({
    breathing: colors.primary,
    meditation: colors.accent,
    gratitude: colors.destructive,
    hydration: colors.primary,
    walking: colors.success,
    sleep_prep: colors.accent,
    journaling: colors.primary,
    nutrition: colors.warning,
    social_checkin: colors.destructive,
    stretching: colors.success,
  }), [colors]);

  const tasksQuery = useQuery(
    orpc.getTodayTasks.queryOptions({ queryKey: ["getTodayTasks"] })
  );

  const tasks = tasksQuery.data?.tasks ?? [];
  const timeOfDay = tasksQuery.data?.timeOfDay ?? "morning";
  const completedCount = tasks.filter((t) => t.completed).length;

  useEffect(() => {
    if (tasksQuery.isFetched) {
      playSoftChime();
    }
  }, [tasksQuery.isFetched]);

  const progress = tasks.length > 0 ? (completedCount / tasks.length) : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="bg-background"
        scrollClassName="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-page py-page pb-32"
        >
          {/* Header */}
          <View className="gap-2">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Daily Quests
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Mission Hub
            </Text>
          </View>

          {/* Progress Summary Card */}
          <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
               <View className="gap-1">
                 <Text className="font-black font-sans text-foreground text-xl">Today's Goal</Text>
                 <Text className="font-bold font-sans text-muted-foreground text-xs uppercase">
                   {completedCount}/{tasks.length} Missions Complete
                 </Text>
               </View>
               <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20">
                 <Trophy color={colors.primary} size={28} />
               </View>
            </View>
            
            <View className="gap-2">
               <View className="h-3 overflow-hidden rounded-full bg-muted border border-border/50">
                 <View
                   className="h-full rounded-full bg-primary shadow-sm"
                   style={{ width: `${progress * 100}%` }}
                 />
               </View>
               <Text className="text-right font-bold font-sans text-primary text-[10px] uppercase tracking-widest">
                 {Math.round(progress * 100)}% to Daily Reward
               </Text>
            </View>
          </View>

          {/* Missions Grid */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between px-1">
               <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wider">
                 Available Missions
               </Text>
               <View className="flex-row items-center gap-1 rounded-full bg-muted px-3 py-1">
                  {timeOfDay === "morning" && <Sun color={colors.warning} size={12} />}
                  {timeOfDay === "afternoon" && <CloudSun color={colors.warning} size={12} />}
                  {timeOfDay === "night" && <Moon color={colors.primary} size={12} />}
                  <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase">
                    {timeOfDay}
                  </Text>
               </View>
            </View>

            <View className="flex-row flex-wrap gap-4">
              {tasks.map((task) => {
                const completed = task.completed;
                const route = ACTION_ROUTES[task.actionType];
                const baseType = task.actionType.split('_')[0] ?? 'breathing';
                const Icon = ACTION_ICONS[baseType] ?? Wind;
                const color = ACTION_COLORS[baseType] ?? colors.primary;

                return (
                  <Pressable
                    key={task.actionType}
                    style={{ width: '47%' }}
                    className={`rounded-card border-2 p-4 gap-3 bg-card shadow-sm ${
                      completed ? "border-success opacity-60" : "border-border"
                    }`}
                    onPress={() => {
                      vibrate(20);
                      router.push(route as Href);
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                       <View 
                         className="h-10 w-10 items-center justify-center rounded-xl"
                         style={{ backgroundColor: `${color}15` }}
                       >
                         <Icon color={color} size={20} />
                       </View>
                       <View className="flex-row items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5">
                          <Moon color={colors.warning} size={10} />
                          <Text className="font-black font-sans text-warning text-[10px]">
                            +10
                          </Text>
                       </View>
                    </View>

                    <View className="gap-1">
                      <Text className="font-black font-sans text-foreground text-sm leading-tight" numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text className="font-medium font-sans text-muted-foreground text-[10px]" numberOfLines={2}>
                        {task.description}
                      </Text>
                    </View>

                    <View className="mt-2 h-8 items-center justify-center rounded-xl bg-muted/50 border border-border/50">
                       {completed ? (
                         <View className="flex-row items-center gap-1">
                            <Check color={colors.success} size={14} />
                            <Text className="font-bold font-sans text-success text-[10px] uppercase">Done</Text>
                         </View>
                       ) : (
                         <Text className="font-bold font-sans text-primary text-[10px] uppercase tracking-widest">
                           Start Quest
                         </Text>
                       )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Fully Grown / All Done */}
          {completedCount === tasks.length && tasks.length > 0 && (
            <View className="items-center gap-3 rounded-card border-2 border-success bg-success/5 p-6 shadow-sm">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-success/10 border-4 border-white shadow-sm">
                <Trophy color={colors.success} size={32} />
              </View>
              <View className="items-center gap-1">
                <Text className="text-center font-black font-sans text-success text-xl">
                  Daily Streak Maintained!
                </Text>
                <Text className="text-center font-bold font-sans text-success text-xs">
                  All wellness tasks complete. You've earned a bonus +50 Credits!
                </Text>
              </View>
              <Button className="w-full mt-2" href="/sprite" variant="primary">
                Back to Dashboard
              </Button>
            </View>
          )}
        </ScrollView>
      </Screen>

      <ScreenBottomBar>
        <View className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-background px-3 py-2">
          <Zap color={colors.primary} size={16} />
          <Text className="font-black font-sans text-foreground text-lg tracking-tight">
            {completedCount}/{tasks.length} Done
          </Text>
        </View>
        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            vibrate(15);
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
