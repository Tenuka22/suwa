'use client';

import { Stack } from "expo-router";
import { View } from "react-native";

import { GuardianLanding } from "@/components/home/guardian-landing";
import { RootBottomBar } from "@/components/ui/root-bottom-bar";
import { Screen } from "@/components/ui/screen";

export default function GuardianDashboard() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen
        contentClassName="flex-1 gap-section px-page py-page pb-24"
        scrollClassName="flex-1 bg-background"
      >
        <GuardianLanding />
      </Screen>

      <View className="absolute right-page bottom-page left-page">
        <RootBottomBar />
      </View>
    </>
  );
}
