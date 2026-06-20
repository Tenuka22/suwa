"use client";

import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        animationMatchesGesture: true,
        contentStyle: { backgroundColor: "#fbf7f0" },
        fullScreenGestureEnabled: Platform.OS === "ios",
        gestureDirection: "horizontal",
        gestureEnabled: true,
        headerShown: false,
      }}
    />
  );
}
