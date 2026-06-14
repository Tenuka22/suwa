'use client';

import { Text, View } from "react-native";

interface MoonlightCreditsDisplayProps {
  balance: number;
  consistencyScore: number;
  totalEarned: number;
}

export function MoonlightCreditsDisplay({
  balance,
  totalEarned,
  consistencyScore,
}: MoonlightCreditsDisplayProps) {
  return (
    <View className="flex-row items-center gap-4 rounded-card border-2 border-border bg-card px-card py-card">
      <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-amber-400">
        <Text className="font-black font-sans text-black text-lg">☽</Text>
      </View>
      <View className="flex-1">
        <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
          Moonlight Credits
        </Text>
        <Text className="font-black font-sans text-3xl text-foreground tracking-tight">
          {balance}
        </Text>
      </View>
      <View className="items-end gap-1">
        <View>
          <Text className="text-right font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
            Total Earned
          </Text>
          <Text className="text-right font-extrabold font-sans text-foreground text-lg">
            {totalEarned}
          </Text>
        </View>
        <View>
          <Text className="text-right font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
            Consistency
          </Text>
          <Text className="text-right font-extrabold font-sans text-foreground text-lg">
            {consistencyScore}
          </Text>
        </View>
      </View>
    </View>
  );
}
