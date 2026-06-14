'use client';

import { Stack } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";

export default function GamificationActionsScreen() {
  return (
    <>
      <Stack.Screen
        options={{ headerShown: false, title: "Wellness Actions" }}
      />
      <Screen contentClassName="gap-section bg-background px-page py-page">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="gap-4 border-border border-b-2 px-card py-card">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.3em]">
              Gamification Lab
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Wellness Actions
            </Text>
            <Text className="max-w-[28rem] font-normal font-sans text-base text-muted-foreground leading-6">
              A small set of interactive recovery tools with clearer progress,
              stronger feedback, and better visual hierarchy.
            </Text>
          </View>

          <View className="gap-3 px-card py-card">
            <View className="flex-row items-center gap-3 rounded-card border-2 border-border bg-background px-card py-card">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-primary">
                <Text className="font-black font-sans text-lg text-primary-foreground">
                  B
                </Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
                  Breathing
                </Text>
                <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
                  Breath Rhythm
                </Text>
                <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
                  Tune inhale, hold, exhale, and rest with a looped guided
                  timer.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 rounded-card border-2 border-border bg-muted px-card py-card">
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                  Support
                </Text>
                <Text className="mt-2 font-extrabold font-sans text-base text-foreground">
                  Gentle pacing
                </Text>
              </View>
              <View className="flex-1 rounded-card border-2 border-border bg-muted px-card py-card">
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                  Feedback
                </Text>
                <Text className="mt-2 font-extrabold font-sans text-base text-foreground">
                  Haptics + timing
                </Text>
              </View>
            </View>

            <View className="gap-2">
              <Button
                className="w-full"
                href="/test/gamification/actions/breathing"
                variant="primary"
              >
                Open Breathing Exercise ›
              </Button>
              <Button
                className="w-full"
                href="/test/gamification/actions/power-nap"
                variant="secondary"
              >
                Open Power Nap ›
              </Button>
            </View>

            <Button
              className="w-full"
              href="/test/gamification"
              variant="secondary"
            >
              Back to Gamification ›
            </Button>
          </View>
        </View>
      </Screen>
    </>
  );
}
