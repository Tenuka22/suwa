"use client";

import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ScreenBottomBarAction {
  active?: boolean;
  activeClassName?: string;
  className?: string;
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  textClassName?: string;
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
    <View className="absolute right-0 bottom-4 left-0 px-6">
      <View className="flex-row items-center justify-between">
        {hasLeft && (
          <View className="flex-row gap-2 rounded-full border-2 border-border bg-background-elevated/60 backdrop-blur-[0.4px] shadow-md w-auto">
            {leftActions.map((action) => (
              <Pressable
                className={`items-center justify-center gap-0 py-2 size-20 ${action.active ? action.activeClassName ?? "rounded-full bg-primary/70 px-4 backdrop-blur-md" : action.className ?? "size-20"}`}
                key={action.label}
                onPress={action.onPress}
              >
                <View className={`h-8 w-8 items-center justify-center ${action.active ? "text-primary-foreground" : "text-foreground"}`}>
                  {action.icon}
                </View>
                <Text
                  className={action.textClassName ?? `font-medium font-sans text-[10px] ${action.active ? "text-primary-foreground" : "text-foreground"}`}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {hasRight && (
          <Link asChild href={returnAction.href as Href}>
            <Pressable className="size-20 items-center justify-center rounded-full border-2 border-border bg-background-elevated/60 backdrop-blur-[0.4] shadow-md">
              {returnAction.icon}
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
