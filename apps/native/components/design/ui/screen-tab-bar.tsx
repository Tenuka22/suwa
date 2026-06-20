"use client";

import { selectionAsync } from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
} from "react-native-reanimated";
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
        className="absolute right-0 bottom-0 left-0 border-border/70 border-t bg-background-elevated/95 px-lg pt-sm shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <View className="flex-row items-center justify-around">
          {tabs.map((tab) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.active }}
              className="min-w-16 items-center justify-center gap-1 px-3 py-1"
              disabled={tab.active}
              hitSlop={8}
              key={tab.label}
              onPress={async () => {
                tab.onPress?.();
                await selectionAsync();
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <View className="relative h-8 w-12 items-center justify-center rounded-full">
                {tab.active ? (
                  <Animated.View
                    className="absolute inset-0 rounded-full bg-primary-subtle"
                    entering={FadeIn.duration(220)
                      .easing(Easing.bezier(0.22, 1, 0.36, 1))
                      .reduceMotion(ReduceMotion.System)}
                  />
                ) : null}
                <View className="z-10">{tab.icon}</View>
              </View>
              <Text
                className={`font-poppins-medium text-[10px] ${tab.active ? "text-primary" : "text-foreground-muted"}`}
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
