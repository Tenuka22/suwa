"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Sparkles, Zap, Timer, CheckCircle2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function MeditationActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { type, action: actionType } = useLocalSearchParams<{
    type: string;
    action: string;
  }>();

  const [minutes, setMinutes] = useState(10);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  const completeMutation = useMutation(
    orpc.completeWellnessAction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getSpriteState.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getMoonlightCredits.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getWellnessHistory.key() });
        playToneSequence();
      },
    })
  );

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!running) {
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      pulseScale.stopAnimation();
      return;
    }

    setDone(false);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.2, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // Progress animation
    Animated.timing(progress, {
      toValue: 1,
      duration: minutes * 60 * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      setRunning(false);
      setDone(true);
      vibrate([80, 60, 80, 60, 120]);

      if (actionType && !rewarded) {
        setRewarded(true);
        completeMutation.mutate({
          actionType: actionType as any,
          durationSeconds: minutes * 60,
        });
      }
    }, minutes * 60 * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [minutes, progress, running, rewarded]);

  const handleStart = () => {
    setRunning(true);
    setDone(false);
    vibrate([30, 20, 30]);
  };

  const handleStop = () => {
    setRunning(false);
    setDone(false);
    vibrate(20);
  };

  const handleBack = useCallback(() => {
    vibrate(15);
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <View className="flex-1 items-center justify-between py-12 px-page">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="flex-row items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5">
               <Sparkles color={colors.accent} size={14} />
               <Text className="font-bold font-sans text-accent text-[10px] uppercase tracking-widest">
                 Mindfulness Session
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              {type === "morning" ? "Dawn" : "Evening"} Calm
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Find your center in the stillness.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="flex-1 items-center justify-center relative w-full">
            {/* Ambient Aura Rings */}
            <Animated.View
              style={{
                transform: [{ scale: pulseScale.interpolate({ inputRange: [1, 1.2], outputRange: [1, 1.5] }) }],
                opacity: pulseScale.interpolate({ inputRange: [1, 1.2], outputRange: [0.3, 0.1] }),
                borderColor: colors.accent
              }}
              className="absolute h-64 w-64 rounded-full border-[1px]"
            />
            <Animated.View
              style={{
                transform: [{ scale: pulseScale.interpolate({ inputRange: [1, 1.2], outputRange: [1, 1.3] }) }],
                opacity: pulseScale.interpolate({ inputRange: [1, 1.2], outputRange: [0.5, 0.2] }),
                borderColor: colors.accent
              }}
              className="absolute h-72 w-72 rounded-full border-2"
            />

            {/* The Main Energy Ball with interactive properties */}
            <Animated.View
              style={{
                transform: [{ scale: pulseScale }],
                backgroundColor: pulseScale.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [colors.accent, colors.primary]
                }),
                shadowRadius: pulseScale.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [20, 50]
                }),
                shadowOpacity: pulseScale.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.4, 0.8]
                })
              }}
              className="h-32 w-32 rounded-full items-center justify-center shadow-accent"
            >
              <Sparkles color="white" size={32} />
            </Animated.View>

            {/* Sub-text Guidance */}
            <View className="absolute bottom-[-80] items-center gap-1">
              <Animated.Text
                style={{
                  opacity: running ? 1 : done ? 0.8 : 0.5,
                  transform: [{ scale: pulseScale.interpolate({ inputRange: [1, 1.2], outputRange: [1, 1.05] }) }]
                }}
                className="font-black font-sans text-accent text-3xl uppercase tracking-widest"
              >
                {running ? "Breathe" : done ? "Restored" : "Peace"}
              </Animated.Text>
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase">
                {running ? "Deep Mindfulness" : `${minutes} minute timer`}
              </Text>
            </View>
          </View>

          {/* Completion Card */}
          <View className="w-full gap-4 mt-8">
            {done && (
              <View className="items-center gap-4 bg-success/10 border-2 border-success/30 rounded-card p-6">
                 <View className="h-12 w-12 items-center justify-center rounded-full bg-success/20">
                    <Zap color={colors.success} size={24} />
                 </View>
                 <View className="items-center">
                    <Text className="font-black font-sans text-success text-xl">Mindfulness Achieved!</Text>
                    <Text className="font-bold font-sans text-success/80 text-xs text-center">
                      Your Sprite feels centered. You earned +10 Moonlight Credits.
                    </Text>
                 </View>
                 <Button className="w-full mt-2" href="/sprite" variant="secondary">
                   Back to Mission Hub
                 </Button>
              </View>
            )}
          </View>
        </View>
      </Screen>

      <ScreenBottomBar>
        {running ? (
          <>
            <View className="h-12 flex-[1.2] flex-row items-center justify-center gap-3 rounded-control border-2 border-border bg-background px-3 py-2 mr-2">
              <Timer color={colors.accent} size={14} />
              <View className="flex-1 gap-1">
                 <View className="flex-row items-center justify-between">
                    <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase">Mindfulness</Text>
                    <Text className="font-black font-sans text-accent text-[10px]">{minutes}m</Text>
                 </View>
                 <View className="h-1 overflow-hidden rounded-full bg-muted">
                    <Animated.View
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      }}
                    />
                 </View>
              </View>
            </View>
            <Button className="h-12 flex-1" onPress={handleStop} variant="secondary">
              End Early
            </Button>
          </>
        ) : !done ? (
          <>
            <View className="flex-[1.2] flex-row gap-1 mr-2">
              {[5, 10, 15, 20].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { vibrate(10); setMinutes(m); }}
                  className={`flex-1 h-12 items-center justify-center rounded-xl border-2 ${
                    minutes === m ? "border-accent bg-accent/5" : "border-border bg-muted/50"
                  }`}
                >
                  <Text className={`font-black font-sans text-[10px] ${minutes === m ? "text-accent" : "text-muted-foreground"}`}>
                    {m}m
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button className="h-12 flex-1 shadow-lg shadow-accent/20" onPress={handleStart} variant="primary">
              Begin
            </Button>
          </>
        ) : (
          <View className="flex-1" />
        )}
        <IconButton icon={ArrowLeft} iconSize={16} onPress={handleBack} />
      </ScreenBottomBar>
    </>
  );
}
