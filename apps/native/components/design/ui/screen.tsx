"use client";

import { View } from "react-native";

interface ScreenProps {
  children: any;
  className?: string;
  contentClassName?: string;
  scrollClassName?: string;
}

export function Screen({ children, className, contentClassName }: ScreenProps) {
  return (
    <View className={`flex-1 ${className ?? ""}`.trim()}>
      <View className={`flex-1 ${contentClassName ?? ""}`.trim()}>
        {children}
      </View>
    </View>
  );
}
