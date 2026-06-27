"use client";

import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface CardProps {
  children?: ReactNode;
  className?: string;
  description?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  onPress?: () => void;
  title?: string;
  variant?: "default" | "banner";
}

export function Card({
  title,
  description,
  icon,
  iconBgColor = "bg-background-subtle",
  onPress,
  className,
  children,
  variant = "default",
}: CardProps) {
  const isBanner = variant === "banner";
  const pressedProgress = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressedProgress.value * 0.08,
    transform: [{ scale: 1 - pressedProgress.value * 0.012 }],
  }));

  return (
    <Animated.View className="flex-1" style={pressStyle}>
      <Pressable
        accessibilityRole={onPress ? "button" : undefined}
        className={`rounded-3xl border border-border/60 p-5 ${isBanner ? "flex-row items-center bg-background-subtle" : "flex-1 bg-background-elevated shadow-sm"} ${className ?? ""}`.trim()}
        onPress={onPress}
        onPressIn={() => {
          pressedProgress.value = withTiming(1, {
            duration: 90,
            easing: Easing.out(Easing.quad),
            reduceMotion: ReduceMotion.System,
          });
        }}
        onPressOut={() => {
          pressedProgress.value = withSpring(0, {
            damping: 19,
            mass: 0.5,
            overshootClamping: true,
            reduceMotion: ReduceMotion.System,
            stiffness: 240,
          });
        }}
      >
        <View
          className={`${isBanner ? "flex-1 flex-row items-center gap-4" : "gap-4"}`}
        >
          {icon && (
            <View
              className={`h-12 w-12 items-center justify-center overflow-hidden rounded-2xl ${iconBgColor}`}
            >
              {icon}
            </View>
          )}
          <View className={`${isBanner ? "flex-1" : "gap-1"}`}>
            {title && (
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 font-poppins-medium text-foreground text-subtitle leading-snug">
                  {title}
                </Text>
                {!isBanner && (
                  <ChevronRight className="text-foreground-muted" size={16} />
                )}
              </View>
            )}
            {description && (
              <Text className="font-sans text-caption text-foreground-secondary leading-relaxed">
                {description}
              </Text>
            )}
            {children}
          </View>
        </View>
        {isBanner && (
          <ChevronRight className="text-foreground-muted" size={20} />
        )}
      </Pressable>
    </Animated.View>
  );
}
