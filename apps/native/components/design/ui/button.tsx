"use client";

import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { type Href, Link } from "expo-router";
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

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const RELEASE_SPRING = {
  damping: 18,
  mass: 0.45,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
  stiffness: 260,
} as const;

interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon?: ReactNode;
  iconPlacement?: "left" | "right";
  justify?: "center" | "between";
  onPress?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  children,
  className,
  disabled,
  href,
  icon,
  iconPlacement = "right",
  justify = "center",
  onPress,
  size = "default",
  variant = "primary",
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const pressedProgress = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressedProgress.value * 0.1,
    transform: [{ scale: 1 - pressedProgress.value * 0.018 }],
  }));

  const sizeStyles = {
    sm: "px-4 py-2.5",
    default: "px-6 py-4",
    lg: "px-7 py-[18px]",
  };

  const variantStyles = {
    primary: "border-primary bg-primary",
    secondary: "border-secondary bg-secondary",
    outline: "border-border bg-background-elevated/90",
    ghost: "border-transparent bg-transparent",
  };

  const textStyles = isPrimary ? "text-primary-foreground" : "text-foreground";

  const handlePress = async () => {
    if (disabled) {
      return;
    }
    onPress?.();
    await impactAsync(ImpactFeedbackStyle.Light);
  };

  const content = (
    <View
      className={`flex-row items-center gap-2 ${justify === "between" ? "w-full justify-between" : "justify-center"}`}
    >
      {icon && iconPlacement === "left" ? icon : null}
      <Text
        className={`font-poppins-medium ${size === "sm" ? "text-caption" : "text-body"} ${textStyles}`}
      >
        {children}
      </Text>
      {icon && iconPlacement === "right" ? icon : null}
    </View>
  );

  const button = (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      className={`flex-row items-center rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${isPrimary ? "shadow-md" : ""} ${disabled ? "opacity-60" : ""} ${className ?? ""}`.trim()}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={() => {
        pressedProgress.value = withTiming(1, {
          duration: 90,
          easing: Easing.out(Easing.quad),
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        pressedProgress.value = withSpring(0, RELEASE_SPRING);
      }}
      style={pressStyle}
    >
      {content}
    </AnimatedPressable>
  );

  if (href) {
    return (
      <Link asChild href={href as Href}>
        {button}
      </Link>
    );
  }

  return button;
}
