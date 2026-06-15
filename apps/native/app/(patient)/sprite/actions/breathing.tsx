"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Wind, Zap, CheckCircle2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playTone, playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

const DEFAULT_PHASES = { inhale: 4, hold: 4, exhale: 6, rest: 2 };
const PHASES: BreathingPhase[] = ["inhale", "hold", "exhale", "rest"];

export default function BreathingActionScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { type, action: actionType } = useLocalSearchParams<{
    type: string;
    action: string;
  }>();

  const tasksQuery = useQuery(
    orpc.getTodayTasks.queryOptions({ queryKey: ["getTodayTasks"] })
  );

  const currentTask = tasksQuery.data?.tasks.find(
    (t) => t.actionType === actionType
  );
  const requiredCycles = currentTask?.requiredCycles ?? 4;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const circleScale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  const currentPhase = PHASES[phaseIndex] ?? "inhale";
  const duration = DEFAULT_PHASES[currentPhase] * 1000;
  const progress = Math.min(cycles / requiredCycles, 1);

  const completeMutation = useMutation(
    orpc.completeWellnessAction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getSpriteState.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getMoonlightCredits.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getWellnessHistory.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getTodayTasks.key() });
        setCompleted(true);
        setRunning(false);
        playToneSequence();
      },
    })
  );

  const handleComplete = useCallback(() => {
    if (!actionType) return;
    setRewarded(true);
    completeMutation.mutate({
      actionType: actionType as any,
      durationSeconds: cycles * 16,
    });
  }, [actionType, completeMutation, cycles]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!running) {
      Animated.parallel([
        Animated.spring(circleScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true })
      ]).start();
      return;
    }

    let toValue = 1;
    let animOpacity = 0.3;

    if (currentPhase === "inhale") {
      toValue = 1.6;
      animOpacity = 0.8;
      vibrate(25);
      playTone(220, 0.1);
    } else if (currentPhase === "hold") {
      toValue = 1.6;
      animOpacity = 1;
      vibrate([20, 30, 20]);
    } else if (currentPhase === "exhale") {
      toValue = 1;
      animOpacity = 0.5;
      vibrate(25);
      playTone(180, 0.15);
    } else {
      toValue = 1;
      animOpacity = 0.3;
    }

    Animated.parallel([
      Animated.timing(circleScale, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: animOpacity,
        duration,
        useNativeDriver: true,
      })
    ]).start();

    timerRef.current = setTimeout(() => {
      setPhaseIndex((current) => {
        const next = (current + 1) % PHASES.length;
        if (next === 0) setCycles((v) => v + 1);
        return next;
      });
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentPhase, duration, running]);

  useEffect(() => {
    if (cycles >= requiredCycles && running) {
      setRunning(false);
      vibrate([100, 50, 100]);
    }
  }, [cycles, requiredCycles, running]);

  const handleStart = () => {
    setCycles(0);
    setPhaseIndex(0);
    setRunning(true);
    setCompleted(false);
    vibrate([30, 20, 30]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <View className="flex-1 items-center justify-between py-12 px-page">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="flex-row items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
               <Wind color={colors.primary} size={14} />
               <Text className="font-bold font-sans text-primary text-[10px] uppercase tracking-widest">
                 {type} Breathing
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              {currentTask?.title ?? "Breath Rhythm"}
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              {currentTask?.description ?? "Center yourself with guided breathing."}
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="flex-1 items-center justify-center relative w-full">
            {/* Interactive Ambient Waves */}
            <Animated.View
              style={{
                transform: [{ scale: circleScale.interpolate({ inputRange: [1, 1.6], outputRange: [1, 2.2] }) }],
                opacity: opacity.interpolate({ inputRange: [0.3, 1], outputRange: [0, 0.15] }),
                borderColor: colors.primary
              }}
              className="absolute h-64 w-64 rounded-full border-[1px]"
            />
            <Animated.View
              style={{
                transform: [{ scale: circleScale.interpolate({ inputRange: [1, 1.6], outputRange: [1, 1.8] }) }],
                opacity: opacity.interpolate({ inputRange: [0.3, 1], outputRange: [0, 0.2] }),
                borderColor: colors.primary
              }}
              className="absolute h-72 w-72 rounded-full border-2"
            />

            {/* Static Guide Rings */}
            <View className="absolute h-80 w-80 rounded-full border-2 border-border/10" />

            {/* The Main Breathing Circle with dynamic shadow */}
            <Animated.View
              style={{
                transform: [{ scale: circleScale }],
                opacity,
                backgroundColor: circleScale.interpolate({
                  inputRange: [1, 1.6],
                  outputRange: [colors.primary, colors.accent]
                }),
                shadowRadius: circleScale.interpolate({
                  inputRange: [1, 1.6],
                  outputRange: [10, 40]
                }),
                shadowOpacity: circleScale.interpolate({
                  inputRange: [1, 1.6],
                  outputRange: [0.2, 0.6]
                })
              }}
              className="h-40 w-40 rounded-full items-center justify-center shadow-primary"
            >
              <Wind color="white" size={40} />
            </Animated.View>

            {/* Instruction Text */}
            <View className="absolute bottom-[-80] items-center gap-1">
              <Animated.Text
                style={{
                  opacity: running ? 1 : 0.5,
                  transform: [{ translateY: running ? 0 : 5 }]
                }}
                className="font-black font-sans text-primary text-4xl uppercase tracking-widest"
              >
                {running ? currentPhase : "Ready"}
              </Animated.Text>
              {running && (
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase">
                  {DEFAULT_PHASES[currentPhase]} seconds remaining
                </Text>
              )}
            </View>
          </View>

          {/* Completion Reward Card */}
          <View className="w-full gap-4 mt-8">
            {(completed || cycles >= requiredCycles) && (
              <View className="items-center gap-4 bg-success/10 border-2 border-success/30 rounded-card p-6">
                 <View className="h-12 w-12 items-center justify-center rounded-full bg-success/20">
                    <Zap color={colors.success} size={24} />
                 </View>
                 <View className="items-center">
                    <Text className="font-black font-sans text-success text-xl">Session Complete!</Text>
                    <Text className="font-bold font-sans text-success/80 text-xs text-center">
                      You've maintained your streak and earned +10 Moonlight Credits.
                    </Text>
                 </View>
                 {!completed ? (
                   <Button className="w-full" disabled={completeMutation.isPending} onPress={handleComplete} variant="primary">
                     Claim Reward
                   </Button>
                 ) : (
                   <Button className="w-full" href="/sprite" variant="secondary">
                     Back to Mission Hub
                   </Button>
                 )}
              </View>
            )}
          </View>
        </View>
      </Screen>

      <ScreenBottomBar>
        {!completed ? (
          <>
            <View className="h-12 flex-[1.2] flex-row items-center justify-center gap-3 rounded-control border-2 border-border bg-background px-3 py-2 mr-2">
              <CheckCircle2 color={colors.success} size={14} />
              <View className="flex-1 gap-1">
                 <View className="flex-row items-center justify-between">
                    <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase">Breath Progress</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{Math.min(cycles, requiredCycles)}/{requiredCycles}</Text>
                 </View>
                 <View className="h-1 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress * 100}%` }}
                    />
                 </View>
              </View>
            </View>
            {running ? (
              <Button className="h-12 flex-1" onPress={() => setRunning(false)} variant="secondary">
                Pause
              </Button>
            ) : cycles < requiredCycles ? (
              <Button className="h-12 flex-1 shadow-lg shadow-primary/20" onPress={handleStart} variant="primary">
                {cycles > 0 ? "Resume" : "Start"}
              </Button>
            ) : null}
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
