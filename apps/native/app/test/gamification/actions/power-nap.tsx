'use client';

import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useThemeColor } from "@/utils/theme";

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "navigator" in window) {
    const nav = window.navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    nav.vibrate?.(pattern);
  }
}

function playToneSequence() {
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
  const notes = [261.63, 329.63, 392, 523.25];
  let currentTime = context.currentTime + 0.05;

  for (const frequency of notes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.4);
    currentTime += 0.42;
  }
}

export default function PowerNapScreen() {
  const colors = useThemeColor();
  const [minutes, setMinutes] = useState(15);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!running) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return;
    }

    setDone(false);
    Animated.timing(progress, {
      toValue: 1,
      duration: minutes * 60 * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    vibrate([40, 40, 40]);
    timerRef.current = setTimeout(
      () => {
        setRunning(false);
        setDone(true);
        vibrate([80, 60, 80, 60, 120]);
        playToneSequence();
      },
      minutes * 60 * 1000
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [minutes, progress, running]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="border-border border-b-2 px-card py-card">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.3em]">
              Wellness Action
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Power Nap
            </Text>
            <Text className="mt-2 font-normal font-sans text-base text-muted-foreground leading-6">
              Set a short timer, sleep, and wake up to a small melody with
              alarm-style haptics.
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            <View className="items-center gap-4 rounded-card border-2 border-border bg-background px-card py-card">
              <View className="h-44 w-full items-center justify-center rounded-[34px] border-2 border-border bg-muted/30">
                <View className="h-16 w-16 items-center justify-center rounded-[18px] border-2 border-border bg-primary/60">
                  <Text className="font-black font-sans text-primary-foreground text-xl">
                    Z
                  </Text>
                </View>
              </View>

              <View className="items-center gap-1">
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  Timer
                </Text>
                <Text className="font-black font-sans text-3xl text-foreground tracking-tight">
                  {minutes} min
                </Text>
                <Text className="font-normal font-sans text-muted-foreground text-sm">
                  {done
                    ? "Wake up melody played"
                    : running
                      ? "Nap in progress"
                      : "Ready to nap"}
                </Text>
              </View>

              <View className="w-full flex-row items-center justify-between">
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                  Status
                </Text>
                <Text className="font-black font-sans text-2xl text-foreground">
                  {running ? "Sleeping" : done ? "Done" : "Idle"}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Button
                className="flex-1"
                disabled={running}
                onPress={() => setRunning(true)}
                variant="primary"
              >
                Start
              </Button>
              <Button
                className="flex-1"
                onPress={() => {
                  setRunning(false);
                  setDone(false);
                }}
                variant="secondary"
              >
                Stop
              </Button>
            </View>

            <View className="flex-row gap-2">
              <Button
                className="flex-1"
                onPress={() => setMinutes(10)}
                variant="secondary"
              >
                10m
              </Button>
              <Button
                className="flex-1"
                onPress={() => setMinutes(15)}
                variant="secondary"
              >
                15m
              </Button>
              <Button
                className="flex-1"
                onPress={() => setMinutes(20)}
                variant="secondary"
              >
                20m
              </Button>
            </View>

            <View className="h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
              <Animated.View
                className="h-full rounded-full bg-primary"
                style={{
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
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
