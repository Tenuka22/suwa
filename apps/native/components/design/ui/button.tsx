"use client";

import * as Haptics from "expo-haptics";
import { type Href, Link } from "expo-router";
import { type ReactNode, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg";

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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const sizeStyles = {
    sm: "px-4 py-2",
    default: "px-6 py-4",
    lg: "px-8 py-5",
  };

  const variantStyles = {
    primary: "border-primary bg-primary",
    secondary: "border-secondary bg-secondary",
    outline: "border-border bg-background-elevated",
    ghost: "border-transparent bg-transparent",
  };

  const textStyles = isPrimary ? "text-primary-foreground" : "text-foreground";

  const handlePress = () => {
    if (disabled) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const content = (
    <View
      className={`flex-row items-center gap-2 ${justify === "between" ? "w-full justify-between" : "justify-center"}`}
    >
      {icon && iconPlacement === "left" ? icon : null}
      <Text
        className={`font-medium font-sans ${size === "sm" ? "text-caption" : "text-body"} ${textStyles}`}
      >
        {children}
      </Text>
      {icon && iconPlacement === "right" ? icon : null}
    </View>
  );

  const button = (
    <Pressable
      className={`flex-row items-center rounded-full border-2 ${sizeStyles[size]} ${variantStyles[variant]} ${disabled ? "opacity-60" : ""} ${className ?? ""}`.trim()}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={() => animateScale(0.96)}
      onPressOut={() => animateScale(1)}
      style={{ transform: [{ scale: scaleAnim }] }}
    >
      {content}
    </Pressable>
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
