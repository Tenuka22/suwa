"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Sparkles, CheckCircle2, Zap, Users } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function SocialCheckinActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [who, setWho] = useState("");
  const [completed, setCompleted] = useState(false);

  const usersScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(usersScale, { toValue: 1.1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(usersScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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

  const handleComplete = useCallback(() => {
    if (who.trim().length < 2) return;
    vibrate(30);
    completeMutation.mutate({
      actionType: "social_checkin",
      metadata: JSON.stringify({ who: who.trim() }),
    });
  }, [who, completeMutation]);

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
               <Users color={colors.destructive} size={14} />
               <Text className="font-bold font-sans text-destructive text-[10px] uppercase tracking-widest">
                 Social Bonds
               </Text>
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Reach Out
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Connection is a fundamental human need.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="items-center justify-center py-4 relative">
             <View className="absolute h-48 w-48 rounded-full bg-destructive/5 blur-3xl" />
             <Animated.View style={{ transform: [{ scale: usersScale }] }}>
                <View className="h-32 w-32 items-center justify-center rounded-full bg-destructive/10 border-4 border-destructive/20 shadow-2xl shadow-destructive/20">
                   <Users color={colors.destructive} size={48} opacity={0.8} />
                </View>
             </Animated.View>
             
             {who.length >= 2 && (
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
                 <Text className="font-black font-sans text-success text-xl">Connected!</Text>
                 <Text className="font-bold font-sans text-success/80 text-xs text-center">
                   Your social health is thriving. You earned +10 Credits.
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
                  Who did you connect with?
                </Text>
                <TextInput
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-4 font-medium font-sans text-sm text-foreground"
                  onChangeText={setWho}
                  placeholder="Friend, family, colleague..."
                  placeholderTextColor={colors.mutedForeground}
                  value={who}
                />
              </View>

              {/* Progress Card */}
              <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
                 <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <CheckCircle2 color={colors.success} size={16} />
                      <Text className="font-black font-sans text-foreground text-sm uppercase">Social Check</Text>
                    </View>
                 </View>
                 <View className="h-2 overflow-hidden rounded-full bg-muted border border-border/50">
                    <View
                      className="h-full rounded-full bg-destructive"
                      style={{ width: `${who.trim().length >= 2 ? 100 : 0}%` }}
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
            className="h-12 flex-1 shadow-lg shadow-destructive/20"
            disabled={who.trim().length < 2 || completeMutation.isPending}
            onPress={handleComplete}
            variant="primary"
          >
            Log Connection
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
