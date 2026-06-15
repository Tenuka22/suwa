"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Sparkles, CheckCircle2, Zap, PenLine } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function JournalingActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [entry, setEntry] = useState("");
  const [completed, setCompleted] = useState(false);

  const penScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(penScale, { toValue: 1.1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(penScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
    if (entry.trim().length < 10) return;
    vibrate(30);
    completeMutation.mutate({
      actionType: "journaling",
      metadata: JSON.stringify({ entry: entry.trim() }),
    });
  }, [entry, completeMutation]);

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
            <View className="flex-row items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
               <PenLine color={colors.primary} size={14} />
               <Text className="font-bold font-sans text-primary text-[10px] uppercase tracking-widest">
                 Mindful Writing
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Daily Reflection
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Release your thoughts and clear your mind.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="items-center justify-center py-4 relative">
             <View className="absolute h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
             <Animated.View style={{ transform: [{ scale: penScale }] }}>
                <View className="h-32 w-32 items-center justify-center rounded-full bg-primary/10 border-4 border-primary/20 shadow-2xl shadow-primary/20">
                   <PenLine color={colors.primary} size={48} opacity={0.8} />
                </View>
             </Animated.View>
             
             {entry.length >= 10 && (
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
                 <Text className="font-black font-sans text-success text-xl">Thoughts Released!</Text>
                 <Text className="font-bold font-sans text-success/80 text-xs text-center">
                   Journaling strengthens your resilience. You earned +10 Credits.
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
                  What's on your mind?
                </Text>
                <TextInput
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-4 font-medium font-sans text-sm text-foreground min-h-[150px]"
                  multiline
                  numberOfLines={6}
                  onChangeText={setEntry}
                  placeholder="Today was..."
                  placeholderTextColor={colors.mutedForeground}
                  textAlignVertical="top"
                  value={entry}
                />
                <Text className="mt-2 text-right font-bold font-sans text-muted-foreground text-[10px] uppercase">
                  {entry.length} characters (min 10)
                </Text>
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
                    <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase">Completion</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{Math.min(100, Math.round((entry.length / 10) * 100))}%</Text>
                 </View>
                 <View className="h-1 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (entry.length / 10) * 100)}%` }}
                    />
                 </View>
              </View>
            </View>
            <Button
              className="h-12 flex-1 shadow-lg shadow-primary/20"
              disabled={entry.trim().length < 10 || completeMutation.isPending}
              onPress={handleComplete}
              variant="primary"
            >
              Save Session
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
