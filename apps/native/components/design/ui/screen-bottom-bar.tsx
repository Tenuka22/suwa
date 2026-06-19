"use client";

import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ScreenBottomBarAction {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}

interface ScreenBottomBarReturnAction {
  href: string;
  icon: ReactNode;
}

interface ScreenBottomBarProps {
  leftActions?: ScreenBottomBarAction[];
  returnAction?: ScreenBottomBarReturnAction;
}

export function ScreenBottomBar({
  leftActions,
  returnAction,
}: ScreenBottomBarProps) {
  const hasLeft = leftActions && leftActions.length > 0;
  const hasRight = !!returnAction;

  return (
    <View className="absolute bottom-4 left-0 right-0 px-6">
      <View className="flex-row items-center justify-between">
        {hasLeft && (
          <View className="flex-row gap-2 rounded-full border-2 border-border bg-background-elevated px-2 shadow-md">
            {leftActions.map((action) => (
              <Pressable
                className={`items-center justify-center gap-0 py-2 ${action.active ? "rounded-2xl bg-primary px-4" : "size-20"}`}
                key={action.label}
                onPress={action.onPress}
              >
                <View className="h-8 w-8 items-center justify-center">
                  {action.icon}
                </View>
                <Text
                  className={`font-medium font-sans text-[10px] ${action.active ? "text-primary-foreground" : "text-foreground"}`}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {hasRight && (
          <Link asChild href={returnAction.href as Href}>
            <Pressable className="size-20 items-center justify-center rounded-full border-2 border-border bg-background-elevated shadow-md">
              {returnAction.icon}
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
