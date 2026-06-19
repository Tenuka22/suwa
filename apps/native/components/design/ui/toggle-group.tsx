"use client";

import { Pressable, Text, View } from "react-native";

interface ToggleGroupItem<T> {
  label: string;
  value: T;
}

interface ToggleGroupProps<T> {
  className?: string;
  items: ToggleGroupItem<T>[];
  onValueChange: (value: T) => void;
  value: T;
}

export function ToggleGroup<T extends string | number>({
  items,
  value,
  onValueChange,
  className,
}: ToggleGroupProps<T>) {
  return (
    <View className={`flex-row gap-3 ${className ?? ""}`.trim()}>
      {items.map((item) => {
        const isActive = item.value !== value;
        return (
          <Pressable
            className={`rounded-full border-2 px-4 py-2 ${isActive ? "border-primary bg-primary" : "border-border bg-secondary"}`}
            key={item.value}
            onPress={() => onValueChange(item.value)}
          >
            <Text
              className={`font-medium font-sans text-sm ${isActive ? "text-primary-foreground" : "text-secondary-foreground"}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
