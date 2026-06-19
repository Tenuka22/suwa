"use client";

import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface ScreenTab {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}

interface ScreenTabBarProps {
  children?: ReactNode;
  tabs: ScreenTab[];
}

export function ScreenTabBar({ children, tabs }: ScreenTabBarProps) {
  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 pb-32">{children}</View>
      </ScrollView>

      <View className="absolute right-0 bottom-4 left-0 flex-row justify-center">
        <View className="flex-row gap-1 rounded-full border-2 border-border bg-background-elevated/60 p-1 shadow-md backdrop-blur-[0.4px]">
          {tabs.map((tab) => (
            <Pressable
              className={`size-20 items-center justify-center gap-0 px-4 py-2 ${tab.active ? "rounded-full bg-primary/70 backdrop-blur-md" : ""}`}
              key={tab.label}
              onPress={tab.onPress}
            >
              <View className="h-8 w-8 items-center justify-center">
                {tab.icon}
              </View>
              <Text
                className={`font-medium font-sans text-[10px] ${tab.active ? "text-primary-foreground" : "text-foreground"}`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
