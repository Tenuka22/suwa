'use client';

import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface SectionHeaderProps {
  description?: string;
  subtitle: string;
  title: string;
}

export function SectionHeader({
  subtitle,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <Animated.View className="gap-2 px-1" entering={FadeInDown.duration(600)}>
      <View className="flex-row items-center gap-3">
        <View className="h-[3px] w-6 bg-primary" />
        <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
          {title}
        </Text>
      </View>
      <Text className="font-black font-sans text-3xl text-foreground leading-none tracking-tighter">
        {subtitle}
      </Text>
      {description && (
        <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-relaxed">
          {description}
        </Text>
      )}
    </Animated.View>
  );
}
