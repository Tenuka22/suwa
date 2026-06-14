'use client';

import { Stack } from "expo-router";

import { HomeLanding } from "@/components/home/home-landing";
import { Screen } from "@/components/ui/screen";

export default function LandingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen
        contentClassName="flex-1 gap-section px-page py-page pb-24"
        scrollClassName="flex-1 bg-background"
      >
        <HomeLanding signedIn={false} />
      </Screen>
    </>
  );
}
