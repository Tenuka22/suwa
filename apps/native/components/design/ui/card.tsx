"use client";

import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

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

  return (
    <Pressable
      className={`rounded-2xl p-5 ${isBanner ? "flex-row items-center bg-background-subtle" : "flex-1 bg-background-elevated shadow-sm"} ${className ?? ""}`.trim()}
      onPress={onPress}
    >
      <View
        className={`${isBanner ? "flex-1 flex-row items-center gap-4" : "gap-4"}`}
      >
        {icon && (
          <View
            className={`h-12 w-12 items-center justify-center rounded-full ${iconBgColor}`}
          >
            {icon}
          </View>
        )}
        <View className={`${isBanner ? "flex-1" : "gap-0"}`}>
          {title && (
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-foreground text-title">
                {title}
              </Text>
              {!isBanner && (
                <ChevronRight className="text-foreground-muted" size={16} />
              )}
            </View>
          )}
          {description && (
            <Text className="font-sans text-body text-foreground-secondary">
              {description}
            </Text>
          )}
          {children}
        </View>
      </View>
      {isBanner && <ChevronRight className="text-foreground-muted" size={20} />}
    </Pressable>
  );
}
