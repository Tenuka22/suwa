"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Sparkles, CheckCircle2, Zap, Apple } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const NUTRITION_OPTIONS = [
  { id: "water", label: "Pure Water", icon: "💧" },
  { id: "greens", label: "Leafy Greens", icon: "🥬" },
  { id: "protein", label: "Lean Protein", icon: "🥩" },
  { id: "fruit", label: "Fresh Fruit", icon: "🍎" },
  { id: "grains", label: "Whole Grains", icon: "🍞" },
  { id: "healthy_fats", label: "Healthy Fats", icon: "🥑" },
];

export default function NutritionActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);

  const appleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(appleScale, { toValue: 1.1, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(appleScale, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
      },
    })
  );

  const toggleOption = (id: string) => {
    vibrate(10);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleComplete = useCallback(() => {
    if (selected.size === 0) return;
    vibrate(30);
    completeMutation.mutate({
      actionType: "nutrition",
      metadata: JSON.stringify({ items: Array.from(selected) }),
    });
  }, [selected, completeMutation]);

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
            <View className="flex-row items-center gap-2 rounded-full bg-warning/10 px-4 py-1.5">
               <Apple color={colors.warning} size={14} />
               <Text className="font-bold font-sans text-warning text-[10px] uppercase tracking-widest">
                 Vital Fuel
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Nutrition Log
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Fuel your Sprite with wholesome choices.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="items-center justify-center py-4 relative">
             <View className="absolute h-48 w-48 rounded-full bg-warning/5 blur-3xl" />
             <Animated.View style={{ transform: [{ scale: appleScale }] }}>
                <View className="h-32 w-32 items-center justify-center rounded-full bg-warning/10 border-4 border-warning/20 shadow-2xl shadow-warning/20">
                   <Apple color={colors.warning} size={48} opacity={0.8} />
                </View>
             </Animated.View>
             
             {selected.size > 0 && (
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
                 <Text className="font-black font-sans text-success text-xl">Nourished!</Text>
                 <Text className="font-bold font-sans text-success/80 text-xs text-center">
                   Good fuel leads to great energy. You earned +10 Credits.
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
                  What did you eat?
                </Text>
                <View className="flex-row flex-wrap gap-3 justify-center">
                  {NUTRITION_OPTIONS.map((opt) => {
                    const isSelected = selected.has(opt.id);
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => toggleOption(opt.id)}
                        className={`items-center justify-center rounded-2xl border-2 p-4 w-[28%] ${
                          isSelected ? "border-warning bg-warning/5" : "border-border bg-muted/20"
                        }`}
                      >
                         <Text className="text-2xl mb-1">{opt.icon}</Text>
                         <Text className={`font-bold font-sans text-[8px] uppercase text-center ${isSelected ? "text-warning" : "text-muted-foreground"}`}>
                           {opt.label}
                         </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {/* Progress Card */}
              <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
                 <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <CheckCircle2 color={colors.success} size={16} />
                      <Text className="font-black font-sans text-foreground text-sm uppercase">Selection</Text>
                    </View>
                    <Text className="font-black font-sans text-warning text-sm">{selected.size} items</Text>
                 </View>
                 <View className="h-2 overflow-hidden rounded-full bg-muted border border-border/50">
                    <View
                      className="h-full rounded-full bg-warning"
                      style={{ width: `${Math.min(100, (selected.size / 3) * 100)}%` }}
                    />
                 </View>
              </View>
            </View>
          )}
        </ScrollView>
      </Screen>

      <ScreenBottomBar>
        {!completed ? (
          <Button
            className="h-12 flex-1 shadow-lg shadow-warning/20"
            disabled={selected.size === 0 || completeMutation.isPending}
            onPress={handleComplete}
            variant="primary"
          >
            Log Nutrition
          </Button>
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
