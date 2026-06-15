"use client";

import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoonlightCreditsDisplay } from "@/components/ui/moonlight-credits-display";
import { Screen } from "@/components/ui/screen";
import { SpriteHealthBar } from "@/components/ui/sprite-health-bar";

export default function GamificationTestScreen() {
  return (
    <Screen contentClassName="gap-section px-page py-page bg-background">
      <View className="mb-2 gap-2">
        <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
          Test Lab
        </Text>
        <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
          Gamification
        </Text>
        <Text className="mt-1 font-normal font-sans text-base text-muted-foreground leading-6">
          Test the gamify logic — Sprite health, wellness actions, and Moonlight
          Credits.
        </Text>
      </View>

      <SpriteHealthBar health={88} mood="happy" streakDays={5} />

      <MoonlightCreditsDisplay
        balance={120}
        consistencyScore={72}
        totalEarned={240}
      />

      <Card className="gap-4">
        <View className="gap-1">
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
            Routes
          </Text>
          <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
            Sprite & Wellness
          </Text>
          <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-6">
            Full gamification flow: consistency rewards, sprite health tracking,
            Moonlight Credits.
          </Text>
        </View>

        <Button className="w-full" href="/sprite" variant="primary">
          Open Sprite Dashboard ›
        </Button>

        <Button
          className="w-full"
          href="/test/gamification/sprite"
          variant="secondary"
        >
          Open Sprite Animation Lab ›
        </Button>

        <Button
          className="w-full"
          href="/test/gamification/actions"
          variant="secondary"
        >
          Open Wellness Actions (Legacy) ›
        </Button>

        <Button className="w-full" href="/test" variant="secondary">
          Back to Test Home ›
        </Button>
      </Card>

      <Card className="gap-4">
        <View className="gap-1">
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
            New Actions
          </Text>
          <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
            Trackable Wellness
          </Text>
          <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-6">
            Time-based, trackable actions for a healthier lifestyle.
          </Text>
        </View>

        <Button
          className="w-full"
          href="/sprite/actions/gratitude?type=morning&action=gratitude_morning"
          variant="secondary"
        >
          Gratitude Journal ›
        </Button>

        <Button
          className="w-full"
          href="/sprite/actions/hydration"
          variant="secondary"
        >
          Hydration Tracker ›
        </Button>

        <Button
          className="w-full"
          href="/sprite/actions/walking"
          variant="secondary"
        >
          Walking Tracker ›
        </Button>

        <Button
          className="w-full"
          href="/sprite/actions/sleep-prep"
          variant="secondary"
        >
          Sleep Preparation ›
        </Button>
      </Card>
    </Screen>
  );
}
