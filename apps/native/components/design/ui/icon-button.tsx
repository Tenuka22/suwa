"use client";

import { Pressable } from "react-native";

interface IconButtonProps {
  className?: string;
  disabled?: boolean;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconSize?: number;
  onPress: () => void;
}

export function IconButton({
  icon: Icon,
  iconSize = 24,
  onPress,
  className,
  disabled,
}: IconButtonProps) {
  return (
    <Pressable
      className={`h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background ${disabled ? "opacity-50" : ""} ${className ?? ""}`.trim()}
      disabled={disabled}
      onPress={() => {
        if (!disabled) {
          onPress();
        }
      }}
    >
      <Icon size={iconSize} />
    </Pressable>
  );
}
