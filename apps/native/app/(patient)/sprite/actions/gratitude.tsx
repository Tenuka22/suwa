"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart, Sparkles, CheckCircle2, Zap } from "lucide-react-native";
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

const GRATITUDE_OPTIONS = {
  morning: [
    "A good night's sleep",
    "My morning coffee/tea",
    "Time with family",
    "A new day ahead",
    "My health",
    "Sunshine",
    "A comfortable home",
    "My friends",
    "My pets",
    "Good food",
    "My job/work",
    "Music I enjoy",
    "Custom...",
  ],
  evening: [
    "A productive day",
    "Time spent with loved ones",
    "A delicious meal",
    "Accomplished goals",
    "A relaxing moment",
    "Learning something new",
    "An act of kindness received",
    "A good conversation",
    "Time outdoors",
    "My comfort zone",
    "A challenge overcome",
    "Peaceful moments",
    "Custom...",
  ],
};

export default function GratitudeActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { type, action: actionType } = useLocalSearchParams<{
    type: string;
    action: string;
  }>();

  const isMorning = type === "morning";
  const options = isMorning
    ? GRATITUDE_OPTIONS.morning
    : GRATITUDE_OPTIONS.evening;
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customEntries, setCustomEntries] = useState<string[]>(["", "", ""]);
  const [completed, setCompleted] = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
    if (!actionType) return;

    const allEntries = [...selectedOptions.filter((o) => o !== "Custom...")];
    for (const entry of customEntries) {
      if (entry.trim().length > 0) {
        allEntries.push(entry.trim());
      }
    }

    if (allEntries.length < 1) return;

    vibrate(30);
    completeMutation.mutate({
      actionType: actionType as any,
      metadata: JSON.stringify({ entries: allEntries }),
    });
  }, [actionType, selectedOptions, customEntries, completeMutation]);

  const toggleOption = (option: string) => {
    vibrate(20);
    setSelectedOptions((prev) => {
      if (prev.includes(option)) {
        return prev.filter((o) => o !== option);
      }
      return [...prev, option];
    });
  };

  const updateCustomEntry = (index: number, value: string) => {
    const newEntries = [...customEntries];
    newEntries[index] = value;
    setCustomEntries(newEntries);
  };

  const hasCustomSelected = selectedOptions.includes("Custom...");
  const filledCount =
    selectedOptions.filter((o) => o !== "Custom...").length +
    customEntries.filter((e) => e.trim().length > 0 && hasCustomSelected)
      .length;
  const canComplete = filledCount >= 1;

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
            <View className="flex-row items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5">
               <Heart color={colors.destructive} size={14} />
               <Text className="font-bold font-sans text-destructive text-[10px] uppercase tracking-widest">
                 {isMorning ? "Morning" : "Evening"} Gratitude
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Heart Space
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              What small joy brought light to your day?
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="items-center justify-center py-4 relative">
             <View className="absolute h-48 w-48 rounded-full bg-destructive/5 blur-3xl" />
             <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <View className="h-32 w-32 items-center justify-center rounded-full bg-destructive/10 border-4 border-destructive/20 shadow-2xl shadow-destructive/20">
                   <Heart color={colors.destructive} size={48} fill={colors.destructive} opacity={0.8} />
                </View>
             </Animated.View>
             
             {/* Sparkle effects based on filledCount */}
             {filledCount > 0 && (
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
                 <Text className="font-black font-sans text-success text-xl">Gratitude Recorded!</Text>
                 <Text className="font-bold font-sans text-success/80 text-xs text-center">
                   A grateful heart is a healthy heart. You earned +10 Credits.
                 </Text>
              </View>
              <Button className="w-full mt-2" href="/sprite" variant="secondary">
                Back to Mission Hub
              </Button>
            </View>
          ) : (
            <View className="gap-6">
              <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
                <Text className="mb-4 font-black font-sans text-foreground text-xs uppercase tracking-widest text-center">
                  Reflections
                </Text>
                <View className="flex-row flex-wrap justify-center gap-2">
                  {options.map((option) => {
                    const isSelected = selectedOptions.includes(option);
                    return (
                      <Pressable
                        className={`rounded-full border-2 px-4 py-2 ${
                          isSelected
                            ? "border-destructive bg-destructive/10"
                            : "border-border bg-muted/30"
                        }`}
                        key={option}
                        onPress={() => toggleOption(option)}
                      >
                        <Text
                          className={`font-bold font-sans text-xs ${
                            isSelected ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {hasCustomSelected && (
                <View className="gap-3 rounded-card border-2 border-destructive/20 bg-destructive/5 p-5">
                  <Text className="font-black font-sans text-destructive text-[10px] uppercase tracking-widest">
                    Your Words
                  </Text>
                  {customEntries.map((entry, index) => (
                    <TextInput
                      className="rounded-xl border-2 border-border bg-background px-4 py-3 font-medium font-sans text-sm text-foreground"
                      key={index}
                      multiline
                      onChangeText={(value) => updateCustomEntry(index, value)}
                      placeholder={`Reflection ${index + 1}...`}
                      placeholderTextColor={colors.mutedForeground}
                      value={entry}
                    />
                  ))}
                </View>
              )}
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
                    <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase">Focus Progress</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{filledCount}/3</Text>
                 </View>
                 <View className="h-1 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-destructive"
                      style={{ width: `${Math.min(100, (filledCount / 3) * 100)}%` }}
                    />
                 </View>
              </View>
            </View>
            <Button
              className="h-12 flex-1 shadow-lg shadow-destructive/20"
              disabled={!canComplete || completeMutation.isPending}
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
