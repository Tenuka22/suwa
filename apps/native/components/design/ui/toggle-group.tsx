"use client";

import { selectionAsync } from "expo-haptics";
import { useEffect, useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const CONTROL_PADDING = 4;
const INDICATOR_SPRING = {
  damping: 22,
  mass: 0.7,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
  stiffness: 260,
} as const;

interface ToggleGroupItem<T> {
  label: string;
  value: T;
}

interface ToggleGroupProps<T> {
  className?: string;
  items: readonly ToggleGroupItem<T>[];
  numColumns?: number;
  onValueChange: (value: T) => void;
  value: T;
}

export function ToggleGroup<T extends string | number>({
  items,
  value,
  onValueChange,
  className,
  numColumns,
}: ToggleGroupProps<T>) {
  const [controlWidth, setControlWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value)
  );
  const animatedIndex = useSharedValue(activeIndex);
  const isMultiRow = !!numColumns;
  const segmentWidth =
    items.length > 0 && !isMultiRow
      ? Math.max(0, (controlWidth - CONTROL_PADDING * 2) / items.length)
      : 0;

  useEffect(() => {
    animatedIndex.value = withSpring(activeIndex, INDICATOR_SPRING);
  }, [activeIndex, animatedIndex]);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: animatedIndex.value * segmentWidth }],
      width: segmentWidth,
    }),
    [segmentWidth]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setControlWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      className={`relative ${isMultiRow ? "flex-row flex-wrap" : "flex-row"} rounded-2xl border border-border/70 bg-background-subtle p-1 ${className ?? ""}`.trim()}
      onLayout={isMultiRow ? undefined : handleLayout}
    >
      {!isMultiRow && segmentWidth > 0 ? (
        <Animated.View
          className="absolute top-1 bottom-1 left-1 rounded-xl bg-background-elevated shadow-sm"
          pointerEvents="none"
          style={indicatorStyle}
        />
      ) : null}
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`z-10 min-h-12 ${isMultiRow ? "" : "flex-1"} items-center justify-center rounded-xl px-4 py-3 ${isActive && isMultiRow ? "bg-background-elevated shadow-sm" : ""}`}
            key={item.value}
            onPress={async () => {
              if (isActive) {
                return;
              }
              onValueChange(item.value);
              await selectionAsync();
            }}
            style={isMultiRow ? { width: `${100 / numColumns!}%` } : undefined}
          >
            <Text
              className={`font-poppins-medium text-sm ${isActive ? "text-primary" : "text-foreground-muted"}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
