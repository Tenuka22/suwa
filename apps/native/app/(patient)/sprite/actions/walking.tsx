"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Footprints, Sparkles, CheckCircle2, Zap } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const STEP_GOAL_MIN = 5000;

export default function WalkingActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [steps, setSteps] = useState("");
  const [completed, setCompleted] = useState(false);

  const stepCount = Number.parseInt(steps, 10) || 0;
  const progress = Math.min(stepCount / STEP_GOAL_MIN, 1);
  const hasReachedGoal = stepCount >= STEP_GOAL_MIN;

  const footScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(footScale, { toValue: 1.1, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(footScale, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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

  const handleComplete = useCallback(() => {
    if (stepCount <= 0) return;
    vibrate(30);
    completeMutation.mutate({
      actionType: "walking",
      metadata: JSON.stringify({ steps: stepCount }),
    });
  }, [stepCount, completeMutation]);

  const quickAdd = (amount: number) => {
    vibrate(20);
    const current = Number.parseInt(steps, 10) || 0;
    setSteps(String(current + amount));
  };

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
            <View className="flex-row items-center gap-2 rounded-full bg-success/10 px-4 py-1.5">
               <Footprints color={colors.success} size={14} />
               <Text className="font-bold font-sans text-success text-[10px] uppercase tracking-widest">
                 Active Sprite
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Daily Movement
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Keep your steps up to grow your Sprite's stamina.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="items-center justify-center py-4 relative">
             <View className="absolute h-48 w-48 rounded-full bg-success/5 blur-3xl" />
             <Animated.View style={{ transform: [{ scale: footScale }] }}>
                <View className="h-32 w-32 items-center justify-center rounded-full bg-success/10 border-4 border-success/20 shadow-2xl shadow-success/20">
                   <Footprints color={colors.success} size={48} opacity={0.8} />
                </View>
             </Animated.View>
             
             {stepCount > 0 && (
               <View className="absolute top-0 right-1/4">
                  <Sparkles color={colors.warning} size={20} />
               </View>
             )}
          </View>

          {completed ? (
            <View className="items-center gap-4 bg-success/10 border-2 border-success/30 rounded-card p-6">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-success/20">
                 <Zap color={colors.success} size={24} />
              </View>
              <View className="items-center">
                 <Text className="font-black font-sans text-success text-xl">Steps Logged!</Text>
                 <Text className="font-bold font-sans text-success/80 text-xs text-center">
                   Movement is life. You earned +10 Moonlight Credits.
                 </Text>
              </View>
              <Button className="w-full mt-2" href="/sprite" variant="secondary">
                Back to Mission Hub
              </Button>
            </View>
          ) : (
            <View className="gap-6">
              {/* Input Card */}
              <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm items-center">
                <Text className="mb-4 font-black font-sans text-foreground text-xs uppercase tracking-widest">
                  Enter Steps
                </Text>
                <TextInput
                  className="w-full text-center font-black font-sans text-5xl text-foreground"
                  keyboardType="numeric"
                  onChangeText={setSteps}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={steps}
                />
              </View>

              {/* Quick Add Buttons */}
              <View className="flex-row flex-wrap gap-2">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <Pressable
                    key={amount}
                    onPress={() => quickAdd(amount)}
                    className="flex-1 min-w-[70px] h-12 items-center justify-center rounded-xl border-2 border-border bg-muted/30"
                  >
                    <Text className="font-bold font-sans text-foreground text-xs">+{amount >= 1000 ? `${amount / 1000}k` : amount}</Text>
                  </Pressable>
                ))}
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
                    <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase">Goal Progress</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{Math.round(progress * 100)}%</Text>
                 </View>
                 <View className="h-1 overflow-hidden rounded-full bg-muted">
                    <View
                      className={`h-full rounded-full ${hasReachedGoal ? "bg-success" : "bg-success/60"}`}
                      style={{ width: `${progress * 100}%` }}
                    />
                 </View>
              </View>
            </View>
            <Button
              className="h-12 flex-1 shadow-lg shadow-success/20"
              disabled={stepCount <= 0 || completeMutation.isPending}
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
