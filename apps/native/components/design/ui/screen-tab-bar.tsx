"use client";

import { selectionAsync } from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pb-28">{children}</View>
      </ScrollView>

      <View
        className="absolute right-0 bottom-0 left-0 px-lg pt-sm"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <View className="flex-row items-center justify-center">
          <View className="flex-row gap-1 rounded-2xl bg-background-subtle p-1">
            {tabs.map((tab) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: tab.active }}
                className={`min-h-14 min-w-14 items-center justify-center gap-0.5 rounded-xl px-3 py-1 ${tab.active ? "bg-primary/40" : ""}`}
                disabled={tab.active}
                hitSlop={8}
                key={tab.label}
                onPress={async () => {
                  tab.onPress?.();
                  await selectionAsync();
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
              >
                <View className="h-7 w-7 items-center justify-center">{tab.icon}</View>
                <Text
                  className={`font-medium font-sans text-[10px] ${tab.active ? "text-foreground" : "text-foreground/60"}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
