"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Droplet, Sparkles, CheckCircle2, Zap } from "lucide-react-native";
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

const GLASS_GOAL = 8;

export default function HydrationActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [glasses, setGlasses] = useState(0);
  const [completed, setCompleted] = useState(false);

  const dropScale = useRef(new Animated.Value(1)).current;
  const waterLevel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dropScale, { toValue: 1.1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(dropScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(waterLevel, {
      toValue: glasses / GLASS_GOAL,
      duration: 500,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: false,
    }).start();
  }, [glasses]);

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

  const handleComplete = useCallback(() => {
    vibrate(30);
    completeMutation.mutate({
      actionType: "hydration",
      metadata: JSON.stringify({ glasses }),
    });
  }, [glasses, completeMutation]);

  const addGlass = () => {
    if (glasses < GLASS_GOAL) {
      vibrate(20);
      setGlasses((g) => g + 1);
    }
  };

  const removeGlass = () => {
    if (glasses > 0) {
      vibrate(15);
      setGlasses((g) => g - 1);
    }
  };

  const progress = glasses / GLASS_GOAL;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <View className="flex-1 items-center justify-between py-12 px-page">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="flex-row items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
               <Droplet color={colors.primary} size={14} />
               <Text className="font-bold font-sans text-primary text-[10px] uppercase tracking-widest">
                 Vitality Check
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Hydration
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Keep your Sprite hydrated for maximum energy.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="flex-1 items-center justify-center relative w-full">
            <View className="absolute h-64 w-64 rounded-full border-2 border-primary/20 opacity-30" />
            
            <Animated.View style={{ transform: [{ scale: dropScale }] }}>
               <View className="h-40 w-40 items-center justify-center rounded-full bg-primary/10 border-4 border-primary/20 shadow-2xl shadow-primary/20 overflow-hidden">
                  <Animated.View 
                    style={{ 
                      height: waterLevel.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                      backgroundColor: colors.primary,
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      opacity: 0.6
                    }}
                  />
                  <Droplet color={glasses > 0 ? "white" : colors.primary} size={48} fill={glasses > 0 ? "white" : "transparent"} opacity={0.8} />
               </View>
            </Animated.View>

            <View className="absolute bottom-[-60] items-center gap-1">
              <Text className="font-black font-sans text-primary text-5xl tracking-tight">
                {glasses}<Text className="text-2xl text-muted-foreground">/{GLASS_GOAL}</Text>
              </Text>
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-widest">
                Glasses Today
              </Text>
            </View>
          </View>

          {/* Controls Area */}
          <View className="w-full gap-6 mt-16">
            {!completed ? (
              <View className="flex-row gap-4">
                 <Pressable 
                   onPress={removeGlass}
                   className="flex-1 h-16 items-center justify-center rounded-2xl border-2 border-border bg-card shadow-sm"
                 >
                   <Text className="font-black font-sans text-foreground text-2xl">−</Text>
                 </Pressable>
                 <Pressable 
                   onPress={addGlass}
                   className="flex-[2] h-16 items-center justify-center rounded-2xl border-2 border-primary bg-primary/5 shadow-sm"
                 >
                   <Text className="font-black font-sans text-primary text-lg">+ Add Glass</Text>
                 </Pressable>
              </View>
            ) : (
              <View className="items-center gap-4 bg-success/10 border-2 border-success/30 rounded-card p-6">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-success/20">
                   <Zap color={colors.success} size={24} />
                </View>
                <View className="items-center">
                   <Text className="font-black font-sans text-success text-xl">Well Hydrated!</Text>
                   <Text className="font-bold font-sans text-success/80 text-xs text-center">
                     Your Sprite is feeling refreshed. You earned +10 Moonlight Credits.
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
        {!completed ? (
          <>
            <View className="h-12 flex-[1.2] flex-row items-center justify-center gap-3 rounded-control border-2 border-border bg-background px-3 py-2 mr-2">
              <CheckCircle2 color={colors.success} size={14} />
              <View className="flex-1 gap-1">
                 <View className="flex-row items-center justify-between">
                    <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase">Goal Progress</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{Math.round(progress * 100)}%</Text>
                 </View>
                 <View className="h-1 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress * 100}%` }}
                    />
                 </View>
              </View>
            </View>
            <Button
              className="h-12 flex-1 shadow-lg shadow-primary/20"
              disabled={glasses === 0 || completeMutation.isPending}
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
