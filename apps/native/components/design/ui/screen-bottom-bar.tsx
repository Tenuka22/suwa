"use client";

import { selectionAsync } from "expo-haptics";
import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();
  const hasLeft = leftActions && leftActions.length > 0;
  const hasRight = !!returnAction;

  return (
    <View
      className="absolute right-0 bottom-0 left-0 border-border/70 border-t bg-background-elevated/20 px-lg pt-sm shadow-lg backdrop-blur-[1px]"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row items-center justify-between">
        {hasLeft && (
          <View className="flex-row gap-1 rounded-2xl bg-background-subtle p-1">
            {leftActions.map((action) => (
              <Pressable
                className={`min-h-14 min-w-14 items-center justify-center gap-0.5 rounded-xl px-3 py-1 ${action.active ? (action.activeClassName ?? "bg-primary") : (action.className ?? "")}`}
                hitSlop={6}
                key={action.label}
                onPress={async () => {
                  action.onPress?.();
                  await selectionAsync();
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <View
                  className={`h-7 w-7 items-center justify-center ${action.active ? "text-primary-foreground" : "text-foreground"}`}
                >
                  {action.icon}
                </View>
                <Text
                  className={
                    action.textClassName ??
                    `font-medium font-sans text-[10px] ${action.active ? "text-primary-foreground" : "text-foreground"}`
                  }
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {hasRight && (
          <Link asChild href={returnAction.href as Href} replace>
            <Pressable
              className="h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background-elevated"
              hitSlop={6}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              {returnAction.icon}
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
