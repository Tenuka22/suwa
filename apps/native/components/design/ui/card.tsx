"use client";

import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface CardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  onPress?: () => void;
  className?: string;
  children?: ReactNode;
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
      className={`rounded-2xl p-5 ${isBanner ? "bg-background-subtle flex-row items-center" : "bg-background-elevated shadow-sm flex-1"} ${className ?? ""}`.trim()}
      onPress={onPress}
    >
      <View className={`${isBanner ? "flex-row flex-1 items-center gap-4" : "gap-4"}`}>
        {icon && (
          <View className={`h-12 w-12 items-center justify-center rounded-full ${iconBgColor}`}>
            {icon}
          </View>
        )}
        <View className={`${isBanner ? "flex-1" : "gap-1"}`}>
          {title && (
            <View className="flex-row items-center justify-between">
              <Text className="font-sans font-bold text-title text-foreground">
                {title}
              </Text>
              {!isBanner && <ChevronRight size={16} className="text-foreground-muted" />}
            </View>
          )}
          {description && (
            <Text className="font-sans text-foreground-secondary text-body">
              {description}
            </Text>
          )}
          {children}
        </View>
      </View>
      {isBanner && <ChevronRight size={20} className="text-foreground-muted" />}
    </Pressable>
  );
}
