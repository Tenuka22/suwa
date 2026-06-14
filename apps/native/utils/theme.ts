'use client';

import { useColorScheme } from "react-native";

const themeColors = {
  light: {
    background: "#f4f4f5",
    foreground: "#000000",
    card: "#ffffff",
    cardForeground: "#000000",
    primary: "#a22a2a",
    primaryForeground: "#ffffff",
    secondary: "#e4e4e7",
    secondaryForeground: "#000000",
    muted: "#f4f4f5",
    mutedForeground: "#71717a",
    accent: "#a22a2a",
    accentForeground: "#ffffff",
    destructive: "#dc2626",
    destructiveForeground: "#ffffff",
    success: "#059669",
    successForeground: "#ffffff",
    warning: "#d97706",
    warningForeground: "#ffffff",
    border: "rgba(0,0,0,0.7)",
    input: "#ffffff",
    ring: "#a22a2a",
  },
  dark: {
    background: "#18181b",
    foreground: "#ffffff",
    card: "#27272a",
    cardForeground: "#ffffff",
    primary: "#ef4444",
    primaryForeground: "#ffffff",
    secondary: "#3f3f46",
    secondaryForeground: "#ffffff",
    muted: "#27272a",
    mutedForeground: "#a1a1aa",
    accent: "#ef4444",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    success: "#10b981",
    successForeground: "#ffffff",
    warning: "#f59e0b",
    warningForeground: "#ffffff",
    border: "#09090b",
    input: "#27272a",
    ring: "#ef4444",
  },
};

export function useThemeColor() {
  const colorScheme = useColorScheme();
  const mode = colorScheme === "dark" ? "dark" : "light";
  return themeColors[mode];
}
