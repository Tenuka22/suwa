"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Lightbulb,
  MessageSquare,
  Moon,
  Smartphone,
  Wind,
  Zap,
  CheckCircle2
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playSoftChime, playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const SLEEP_TASKS = [
  {
    id: "screens",
    label: "Minimize screen use before bed",
    icon: Smartphone,
  },
  { id: "dim", label: "Dim the lights", icon: Lightbulb },
  { id: "breathing", label: "Practice deep breathing", icon: Wind },
  { id: "tomorrow", label: "Prepare for tomorrow", icon: ClipboardList },
  { id: "gratitude", label: "Reflect on the day", icon: MessageSquare },
];

export default function SleepPrepActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);

  const moonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonScale, { toValue: 1.1, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(moonScale, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const completeMutation = useMutation(
    orpc.completeWellnessAction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getSpriteState.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getMoonlightCredits.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getTodayTasks.key() });
        setCompleted(true);
        playToneSequence();
      },
    })
  );

  const toggleTask = (id: string) => {
    vibrate(20);
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleComplete = useCallback(() => {
    vibrate(30);
    completeMutation.mutate({
      actionType: "sleep_prep",
      metadata: JSON.stringify({
        tasks: Array.from(checkedTasks),
        completedAt: new Date().toISOString(),
      }),
    });
  }, [checkedTasks, completeMutation]);

  const completedCount = checkedTasks.size;
  const progress = completedCount / SLEEP_TASKS.length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-8 px-page py-12 pb-32"
        >
          {/* Header */}
          <View className="items-center gap-2">
            <View className="flex-row items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5">
               <Moon color={colors.accent} size={14} />
               <Text className="font-bold font-sans text-accent text-[10px] uppercase tracking-widest">
                 Dusk Ritual
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Sleep Prep
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Wind down for deep restoration and sweet dreams.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="items-center justify-center py-4 relative">
             <View className="absolute h-48 w-48 rounded-full bg-accent/5 blur-3xl" />
             <Animated.View style={{ transform: [{ scale: moonScale }] }}>
                <View className="h-32 w-32 items-center justify-center rounded-full bg-accent/10 border-4 border-accent/20 shadow-2xl shadow-accent/20">
                   <Moon color={colors.accent} size={48} fill={colors.accent} opacity={0.6} />
                </View>
             </Animated.View>
          </View>

          {completed ? (
            <View className="items-center gap-4 bg-success/10 border-2 border-success/30 rounded-card p-6">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-success/20">
                 <Zap color={colors.success} size={24} />
              </View>
              <View className="items-center">
                 <Text className="font-black font-sans text-success text-xl">Rest Ready!</Text>
                 <Text className="font-bold font-sans text-success/80 text-xs text-center">
                   Your preparation is complete. You earned +10 Moonlight Credits.
                 </Text>
              </View>
              <Button className="w-full mt-2" href="/sprite" variant="secondary">
                Back to Mission Hub
              </Button>
            </View>
          ) : (
            <View className="gap-6">
              {/* Checklist Card */}
              <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
                <Text className="mb-4 font-black font-sans text-foreground text-xs uppercase tracking-widest text-center">
                  Wind-Down Checklist
                </Text>
                <View className="gap-3">
                  {SLEEP_TASKS.map((task) => {
                    const isChecked = checkedTasks.has(task.id);
                    const Icon = task.icon;
                    return (
                      <Pressable
                        className={`flex-row items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                          isChecked
                            ? "border-accent bg-accent/5"
                            : "border-border bg-muted/20"
                        }`}
                        key={task.id}
                        onPress={() => toggleTask(task.id)}
                      >
                        <View
                          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                            isChecked
                              ? "border-accent bg-accent"
                              : "border-border bg-background"
                          }`}
                        >
                          {isChecked && <Check color="#ffffff" size={12} />}
                        </View>
                        <Icon
                          color={isChecked ? colors.accent : colors.mutedForeground}
                          size={18}
                        />
                        <Text
                          className={`flex-1 font-bold font-sans text-sm ${
                            isChecked ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {task.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </Screen>

      <ScreenBottomBar>
        {!completed ? (
          <>
            <View className="h-12 flex-[1.2] flex-row items-center justify-center gap-3 rounded-control border-2 border-border bg-background px-3 py-2 mr-2">
              <CheckCircle2 color={colors.success} size={14} />
              <View className="flex-1 gap-1">
                 <View className="flex-row items-center justify-between">
                    <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase">Readiness</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{completedCount}/{SLEEP_TASKS.length}</Text>
                 </View>
                 <View className="h-1 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${progress * 100}%` }}
                    />
                 </View>
              </View>
            </View>
            <Button
              className="h-12 flex-1 shadow-lg shadow-accent/20"
              disabled={completedCount === 0 || completeMutation.isPending}
              onPress={handleComplete}
              variant="primary"
            >
              Log Session
            </Button>
          </>
        ) : (
          <View className="flex-1" />
        )}
        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            vibrate(15);
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
