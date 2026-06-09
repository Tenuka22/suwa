import { Text, View } from "react-native";
import type { SpriteAction } from "@/components/ui/sprite-animation";

interface SpriteHealthBarProps {
  health: number;
  mood: string;
  streakDays: number;
}

function moodToAction(mood: string): SpriteAction {
  if (mood === "sleep") {
    return "alert";
  }
  if (mood === "yawn") {
    return "thinking";
  }
  return "idle";
}

export function SpriteHealthBar({
  health,
  streakDays,
  mood,
}: SpriteHealthBarProps) {
  return (
    <View className="flex-row items-center gap-4 rounded-card border-2 border-border bg-card px-card py-card">
      <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-primary">
        <Text className="text-2xl">
          {mood === "happy"
            ? "😊"
            : mood === "sad"
              ? "😢"
              : mood === "sleep"
                ? "😴"
                : "🤖"}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
          Sprite Status
        </Text>
        <Text className="font-black font-sans text-foreground text-xl capitalize tracking-tight">
          {mood}
        </Text>
        <View className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${health}%` }}
          />
        </View>
      </View>
      <View className="items-end gap-0.5">
        <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
          Streak
        </Text>
        <Text className="font-black font-sans text-2xl text-foreground">
          {streakDays}
        </Text>
        <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
          days
        </Text>
      </View>
    </View>
  );
}
