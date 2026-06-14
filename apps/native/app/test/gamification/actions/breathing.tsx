'use client';

import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useThemeColor } from "@/utils/theme";

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

const DEFAULT_PHASES = {
  inhale: 4,
  hold: 4,
  exhale: 6,
  rest: 2,
};

const PHASES: BreathingPhase[] = ["inhale", "hold", "exhale", "rest"];

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "navigator" in window) {
    const nav = window.navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    nav.vibrate?.(pattern);
  }
}

export default function BreathingExerciseScreen() {
  const colors = useThemeColor();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [running, setRunning] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_PHASES);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fill = useRef(new Animated.Value(0)).current;

  const currentPhase = PHASES[phaseIndex] ?? "inhale";
  const duration = settings[currentPhase] * 1000;

  const phaseLabel = currentPhase.toUpperCase();

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

    if (currentPhase === "hold") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
      vibrate([20, 30, 20]);
    } else if (currentPhase === "inhale") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      vibrate(25);
    } else if (currentPhase === "exhale") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start();
      vibrate(25);
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

  const handleStart = () => {
    setCycles(0);
    setPhaseIndex(0);
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
    setPhaseIndex(0);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: "Breathing" }} />
      <Screen contentClassName="gap-section bg-background px-page py-page">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="gap-4 border-border border-b-2 px-card py-card">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.3em]">
              Wellness Action
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Breathing Exercise
            </Text>
            <Text className="max-w-[28rem] font-normal font-sans text-base text-muted-foreground leading-6">
              A guided breathing loop with stronger feedback, live phase pacing,
              and adjustable rhythm.
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            <View className="items-center gap-4 rounded-card border-2 border-border bg-background px-card py-card">
              <View className="items-center gap-1">
                <Text className="text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  Current Phase
                </Text>
                <Text className="text-center font-black font-sans text-4xl text-foreground tracking-tight">
                  {phaseLabel}
                </Text>
                <Text className="text-center font-normal font-sans text-muted-foreground text-sm">
                  {settings[currentPhase]} seconds
                </Text>
              </View>

              <View className="w-full items-center justify-center py-2">
                <View className="relative h-48 w-48 items-center justify-center rounded-[34px] border-2 border-border bg-muted/30">
                  <View className="absolute inset-4 rounded-[30px] border-2 border-border bg-background" />
                  <View className="absolute inset-8 rounded-[24px] border-2 border-border bg-background" />
                  <Animated.View
                    className="absolute h-24 w-24 rounded-[20px] border-2 border-border"
                    style={{
                      backgroundColor: fill.interpolate({
                        inputRange: [0, 0.15, 1],
                        outputRange: [
                          colors.background,
                          colors.primary,
                          colors.secondary,
                        ],
                      }),
                      transform: [
                        {
                          scale: fill.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 1],
                          }),
                        },
                      ],
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
                    {running ? "Running" : "Paused"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Button
                className="flex-1"
                disabled={running}
                onPress={handleStart}
                variant="primary"
              >
                Start
              </Button>
              <Button
                className="flex-1"
                onPress={handleStop}
                variant="secondary"
              >
                Reset
              </Button>
            </View>

            <View className="gap-3">
              <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.16em]">
                Timing
              </Text>
              {PHASES.map((phase) => (
                <View
                  className="flex-row items-center justify-between rounded-card border-2 border-border bg-muted px-card py-control"
                  key={phase}
                >
                  <Text className="font-bold font-sans text-foreground capitalize">
                    {phase}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Button
                      onPress={() =>
                        setSettings((value) => ({
                          ...value,
                          [phase]: Math.max(1, value[phase] - 1),
                        }))
                      }
                      size="sm"
                      variant="secondary"
                    >
                      -
                    </Button>
                    <Text className="w-8 text-center font-bold font-sans text-foreground">
                      {settings[phase]}s
                    </Text>
                    <Button
                      onPress={() =>
                        setSettings((value) => ({
                          ...value,
                          [phase]: value[phase] + 1,
                        }))
                      }
                      size="sm"
                      variant="secondary"
                    >
                      +
                    </Button>
                  </View>
                </View>
              ))}
            </View>

            <Button
              className="w-full"
              href="/test/gamification/actions"
              variant="secondary"
            >
              Back to Actions ›
            </Button>
          </View>
        </View>
      </Screen>
    </>
  );
}
