import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

const DEFAULT_PHASES = { inhale: 4, hold: 4, exhale: 6, rest: 2 };
const PHASES: BreathingPhase[] = ["inhale", "hold", "exhale", "rest"];

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "navigator" in window) {
    const nav = window.navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    nav.vibrate?.(pattern);
  }
}

function playTone(frequency: number, duration: number) {
  if (typeof window === "undefined") {
    return;
  }
  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    context.currentTime + duration
  );
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration + 0.05);
}

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
  const fill = useRef(new Animated.Value(0)).current;

  const currentPhase = PHASES[phaseIndex] ?? "inhale";
  const duration = DEFAULT_PHASES[currentPhase] * 1000;
  const phaseLabel = currentPhase.toUpperCase();
  const progress = Math.min(cycles / requiredCycles, 1);

  const completeMutation = useMutation(
    orpc.completeWellnessAction.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSpriteState.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getMoonlightCredits.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getWellnessHistory.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getTodayTasks.key(),
        });
        setCompleted(true);
        setRunning(false);
      },
    })
  );

  const handleComplete = useCallback(() => {
    if (!actionType) {
      return;
    }
    setRewarded(true);
    completeMutation.mutate({
      actionType: actionType as
        | "breathing_morning"
        | "breathing_evening"
        | "breathing_night",
      durationSeconds: cycles * 16,
    });
  }, [actionType, completeMutation, cycles]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!running) {
      Animated.timing(fill, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return;
    }

    const startValue =
      currentPhase === "inhale"
        ? 0
        : currentPhase === "hold"
          ? 1
          : currentPhase === "exhale"
            ? 1
            : 0.15;
    const endValue =
      currentPhase === "inhale"
        ? 1
        : currentPhase === "hold"
          ? 1
          : currentPhase === "exhale"
            ? 0
            : 0;

    fill.setValue(startValue);

    if (currentPhase === "inhale") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      vibrate(25);
      playTone(220, 0.1);
    } else if (currentPhase === "hold") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
      vibrate([20, 30, 20]);
      playTone(330, 0.08);
    } else if (currentPhase === "exhale") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start();
      vibrate(25);
      playTone(180, 0.15);
    } else {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    timerRef.current = setTimeout(() => {
      setPhaseIndex((current) => {
        const next = (current + 1) % PHASES.length;
        if (next === 0) {
          setCycles((value) => value + 1);
        }
        return next;
      });
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentPhase, duration, fill, running]);

  useEffect(() => {
    if (!running) {
      return;
    }
    vibrate([20, 30, 20]);
  }, [currentPhase, running]);

  useEffect(() => {
    if (cycles >= requiredCycles && running) {
      setRunning(false);
    }
  }, [cycles, requiredCycles, running]);

  const handleStart = () => {
    setCycles(0);
    setPhaseIndex(0);
    setRunning(true);
    setCompleted(false);
    vibrate([30, 20, 30]);
  };

  const handleStop = () => {
    setRunning(false);
    setPhaseIndex(0);
    vibrate(20);
  };

  const isComplete = cycles >= requiredCycles;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page pb-24">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="gap-4 border-border border-b-2 px-card py-card">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.3em]">
              {type === "morning"
                ? "Morning"
                : type === "afternoon"
                  ? "Afternoon"
                  : "Night"}{" "}
              Breathing
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              {currentTask?.title ?? "Breath Rhythm"}
            </Text>
            <Text className="max-w-[28rem] font-normal font-sans text-base text-muted-foreground leading-6">
              {currentTask?.description ??
                "Complete a breathing session to earn Moonlight Credits."}
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            
            <View className="rounded-card border-2 border-border bg-background px-card py-card">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                  Progress
                </Text>
                <Text className="font-black font-sans text-foreground text-lg">
                  {Math.min(cycles, requiredCycles)}/{requiredCycles} cycles
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
              <Text className="mt-1 text-right font-normal font-sans text-muted-foreground text-xs">
                {isComplete
                  ? "All cycles complete!"
                  : `${requiredCycles - cycles} cycle${requiredCycles - cycles > 1 ? "s" : ""} to go`}
              </Text>
            </View>

            
            <View className="items-center gap-4 rounded-card border-2 border-border bg-background px-card py-card">
              <View className="items-center gap-1">
                <Text className="text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  {running ? "Current Phase" : "Ready"}
                </Text>
                <Text className="text-center font-black font-sans text-4xl text-foreground tracking-tight">
                  {running ? phaseLabel : "Breathe"}
                </Text>
                <Text className="text-center font-normal font-sans text-muted-foreground text-sm">
                  {running
                    ? `${DEFAULT_PHASES[currentPhase]} seconds`
                    : "Press Start to begin"}
                </Text>
              </View>

              <View className="w-full items-center justify-center py-4">
                <View className="h-56 w-56 items-center justify-center overflow-hidden rounded-[16px] border-2 border-border bg-muted/30 shadow-lg">
                  <Animated.View
                    className="rounded-[24px] border-2 border-border"
                    style={{
                      width: fill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [48, 224],
                      }),
                      height: fill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [48, 224],
                      }),
                      backgroundColor:
                        currentPhase === "hold"
                          ? colors.secondary
                          : colors.primary,
                    }}
                  />
                </View>
              </View>

              <View className="w-full flex-row items-center justify-between">
                <View>
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Cycles
                  </Text>
                  <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                    {cycles}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Status
                  </Text>
                  <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                    {completed
                      ? "Done ✓"
                      : isComplete
                        ? "Ready ✓"
                        : running
                          ? "Running"
                          : "Ready"}
                  </Text>
                </View>
              </View>
            </View>

            {completed || isComplete ? (
              <View className="items-center gap-3 rounded-card border-2 border-green-300 bg-green-50 px-card py-card">
                <Text className="font-black font-sans text-2xl text-green-800">
                  ✓ {completed ? "Session Complete" : "All Cycles Done"}
                </Text>
                <Text className="text-center font-normal font-sans text-green-700 text-sm">
                  {completed
                    ? rewarded
                      ? `You earned Moonlight Credits for completing ${cycles} breathing cycles!`
                      : `You completed ${cycles} breathing cycles.`
                    : "Great work! Complete the session to earn credits."}
                </Text>
                {!completed && (
                  <Button
                    className="w-full"
                    disabled={completeMutation.isPending}
                    onPress={handleComplete}
                    variant="primary"
                  >
                    Complete & Earn Credits
                  </Button>
                )}
                {completed && rewarded ? (
                  <Button className="w-full" href="/sprite" variant="primary">
                    Back to Dashboard
                  </Button>
                ) : completed ? (
                  <Button className="w-full" href="/sprite" variant="primary">
                    Back to Dashboard
                  </Button>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </Screen>
      <ScreenBottomBar>
        <View className="flex-1 items-center justify-center rounded-control border-2 border-border bg-background px-3 py-2">
          <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
            Progress
          </Text>
          <Text className="font-black font-sans text-foreground text-sm">
            {Math.min(cycles, requiredCycles)}/{requiredCycles} cycles
          </Text>
        </View>
        {running ? (
          <Button className="h-12" onPress={handleStop} variant="secondary">
            Stop
          </Button>
        ) : (
          <Button className="h-12" onPress={handleStart} variant="primary">
            Start
          </Button>
        )}
        <Pressable
          className="aspect-square items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
          onPress={() => {
            vibrate(15);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        >
          <ArrowLeft color="#ffffff" size={16} />
        </Pressable>
      </ScreenBottomBar>
    </>
  );
}
