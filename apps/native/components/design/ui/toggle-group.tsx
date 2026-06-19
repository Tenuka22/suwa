"use client";

import { Pressable, Text, View } from "react-native";

interface ToggleGroupItem<T> {
  label: string;
  value: T;
}

interface ToggleGroupProps<T> {
  items: ToggleGroupItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
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
            key={item.value}
            className={`rounded-full border-2 px-4 py-2 ${isActive ? "border-primary bg-primary" : "border-border bg-secondary"}`}
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
