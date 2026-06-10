import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SpriteMascot } from "@/components/ui/sprite-mascot";

type SpriteAction =
  | "idle"
  | "happy"
  | "thinking"
  | "alert"
  | "sleepy"
  | "excited";

const ACTIONS: SpriteAction[] = [
  "idle",
  "happy",
  "thinking",
  "alert",
  "sleepy",
  "excited",
];

export default function SpriteMascotScreen() {
  const [currentAction, setCurrentAction] = useState<SpriteAction>("idle");

  return (
    <View className="flex-1 gap-4 bg-background px-4 py-15">
      <View className="items-center gap-3">
        <Text className="font-bold font-sans text-[#334155] text-xs uppercase tracking-[0.25em]">
          Status
        </Text>
        <View className="flex-row flex-wrap justify-center gap-2">
          {ACTIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCurrentAction(item)}
              style={{ opacity: 1 }}
            >
              <View
                className={`rounded-card border-2 px-4 py-2 ${currentAction === item ? "border-primary bg-primary" : "border-border bg-background"}`}
              >
                <Text
                  className={`font-bold font-sans text-[13px] uppercase ${currentAction === item ? "text-white" : "text-primary"}`}
                >
                  {item}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <SpriteMascot action={currentAction} size="lg" />
      </View>
    </View>
  );
}

export { SpriteMascot } from "@/components/ui/sprite-mascot";
