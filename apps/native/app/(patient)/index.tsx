'use client';

import { Stack } from "expo-router";
import { View } from "react-native";

import { HomeLanding } from "@/components/home/home-landing";
import { RootBottomBar } from "@/components/ui/root-bottom-bar";
import { Screen } from "@/components/ui/screen";

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen
        contentClassName="flex-1 gap-section px-page py-page pb-24"
        scrollClassName="flex-1 bg-background"
      >
        <HomeLanding signedIn />
      </Screen>

      <View className="absolute right-page bottom-page left-page">
        <RootBottomBar />
      </View>
    </>
  );
}
