import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

type SpriteAction = "idle" | "happy" | "thinking" | "alert";
const ACTIONS: SpriteAction[] = ["idle", "happy", "thinking", "alert"];

const C = {
  skin: "#62B6CB",
  eye: "#1B2A41",
  bandage: "#FFE3D8",
  bandagePad: "#FFFFFF",
  shadow: "#CBD5E1",
  bg: "#F8FAFC",
  text: "#334155",
};

const sineIO = Easing.inOut(Easing.sin);
const springOut = Easing.out(Easing.back(1.6));

interface AnimRefs {
  eyeScaleY: Animated.Value;
  eyeScaleX: Animated.Value;
  pupilX: Animated.Value;
  pupilY: Animated.Value;
  tilt: Animated.Value;
  jolt: Animated.Value;
};

const resetAnims = (refs: AnimRefs) => {
  for (const ref of Object.values(refs)) {
    ref.stopAnimation();
  }
  refs.eyeScaleY.setValue(1);
  refs.eyeScaleX.setValue(1);
  refs.pupilX.setValue(0);
  refs.pupilY.setValue(0);
  refs.tilt.setValue(0);
  refs.jolt.setValue(0);
};

const animateIdle = (refs: AnimRefs) => {
  const blink = () => {
    Animated.sequence([
      Animated.timing(refs.eyeScaleY, { toValue: 0.1, duration: 60, useNativeDriver: true }),
      Animated.timing(refs.eyeScaleY, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const timer = setInterval(() => {
    if (Math.random() > 0.4) blink();
  }, 3000);

  return () => clearInterval(timer);
};

const animateHappy = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.eyeScaleY, { toValue: 0.3, duration: 300, easing: springOut, useNativeDriver: true }),
    Animated.timing(refs.eyeScaleX, { toValue: 1.2, duration: 300, easing: springOut, useNativeDriver: true }),
    Animated.sequence([
      Animated.timing(refs.jolt, { toValue: -15, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(refs.jolt, { toValue: 0, duration: 300, easing: Easing.bounce, useNativeDriver: true }),
    ]),
  ]).start();

  return undefined;
};

const animateThinking = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.pupilX, { toValue: 8, duration: 400, easing: sineIO, useNativeDriver: true }),
    Animated.timing(refs.pupilY, { toValue: -6, duration: 400, easing: sineIO, useNativeDriver: true }),
    Animated.timing(refs.tilt, { toValue: 8, duration: 500, easing: springOut, useNativeDriver: true }),
    Animated.timing(refs.eyeScaleY, { toValue: 0.8, duration: 400, useNativeDriver: true }),
  ]).start();

  return undefined;
};

const animateAlert = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.eyeScaleY, { toValue: 1.4, duration: 150, easing: springOut, useNativeDriver: true }),
    Animated.timing(refs.eyeScaleX, { toValue: 1.4, duration: 150, easing: springOut, useNativeDriver: true }),
    Animated.sequence([
      Animated.timing(refs.jolt, { toValue: -8, duration: 100, useNativeDriver: true }),
      Animated.timing(refs.jolt, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]),
  ]).start();

  return undefined;
};

interface SpriteMascotProps {
  action?: SpriteAction;
  size?: "sm" | "md" | "lg";
}

export default function SpriteMascotScreen() {
  const [currentAction, setCurrentAction] = useState<SpriteAction>("idle");

  return (
    <View className="flex-1 gap-4 bg-background px-4 py-15">
      <View className="items-center gap-3">
        <Text className="font-bold font-sans text-xs uppercase tracking-[0.25em] text-[#334155]">
          Status
        </Text>
        <View className="flex-row flex-wrap justify-center gap-2">
          {ACTIONS.map((item) => (
            <Pressable key={item} onPress={() => setCurrentAction(item)} style={{ opacity: 1 }}>
              <View className={`rounded-card border-2 px-4 py-2 ${currentAction === item ? "border-primary bg-primary" : "border-border bg-background"}`}>
                <Text className={`font-bold font-sans text-[13px] uppercase ${currentAction === item ? "text-white" : "text-primary"}`}>
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

export function SpriteMascot({ action = "idle", size = "md" }: SpriteMascotProps) {
  const [currentAction, setCurrentAction] = useState<SpriteAction>(action);
  const float = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const shadowPulse = useRef(new Animated.Value(0)).current;
  const animRefs: AnimRefs = useRef({
    eyeScaleY: new Animated.Value(1),
    eyeScaleX: new Animated.Value(1),
    pupilX: new Animated.Value(0),
    pupilY: new Animated.Value(0),
    tilt: new Animated.Value(0),
    jolt: new Animated.Value(0),
  }).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(float, { toValue: -12, duration: 1500, easing: sineIO, useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 0.7, duration: 1500, easing: sineIO, useNativeDriver: true }),
          Animated.timing(shadowPulse, { toValue: 1, duration: 1500, easing: sineIO, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(float, { toValue: 0, duration: 1500, easing: sineIO, useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 1, duration: 1500, easing: sineIO, useNativeDriver: true }),
          Animated.timing(shadowPulse, { toValue: 0, duration: 1500, easing: sineIO, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float, shadowPulse, shadowScale]);

  useEffect(() => {
    resetAnims(animRefs);

    let cleanup = () => {};
    switch (currentAction) {
      case "idle":
        cleanup = animateIdle(animRefs);
        break;
      case "happy":
        cleanup = animateHappy(animRefs);
        break;
      case "thinking":
        cleanup = animateThinking(animRefs);
        break;
      case "alert":
        cleanup = animateAlert(animRefs);
        break;
    }

    return cleanup;
  }, [animRefs, currentAction]);

  const headRot = animRefs.tilt.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-10deg", "10deg"],
  });

  useEffect(() => {
    setCurrentAction(action);
  }, [action]);

  const scaleClass = size === "sm" ? "scale-75" : size === "lg" ? "scale-110" : "scale-100";

  return (
    <View className="flex-1 w-full items-center justify-center">
      <View className="w-full items-center justify-center gap-8">
        <Animated.View className={`z-10 items-center ${size === "sm" ? "scale-75" : size === "lg" ? "scale-110" : "scale-100"}`} style={{ transform: [{ translateY: float }, { translateY: animRefs.jolt }] }}>
          <Animated.View className="relative h-[180px] w-[180px] items-center justify-center rounded-[34px] bg-[#62B6CB] shadow-lg" style={{ shadowColor: C.skin, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10, elevation: 8, transform: [{ rotate: headRot }] }}>
            <View className="absolute right-[30px] top-[26px] h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#22c55e]">
              <View className="absolute h-[18px] w-[5px] rounded-full bg-white" />
              <View className="absolute h-[5px] w-[18px] rounded-full bg-white" />
            </View>

            <View className="mt-[16px] flex-row gap-10">
              <Animated.View className="h-[52px] w-[52px] rounded bg-[#1B2A41]" style={{ transform: [{ scaleY: animRefs.eyeScaleY }, { scaleX: animRefs.eyeScaleX }, { translateX: animRefs.pupilX }, { translateY: animRefs.pupilY }] }} />
              <Animated.View className="h-[52px] w-[52px] rounded bg-[#1B2A41]" style={{ transform: [{ scaleY: animRefs.eyeScaleY }, { scaleX: animRefs.eyeScaleX }, { translateX: animRefs.pupilX }, { translateY: animRefs.pupilY }] }} />
            </View>
          </Animated.View>

          <View className="mt-3 h-[42px] w-[42px] rounded-[10px] bg-[#62B6CB]" />
        </Animated.View>
        <Animated.View
          className="h-3 rounded-full bg-[#CBD5E1]"
          style={{
            opacity: 0.8,
            width: shadowScale.interpolate({ inputRange: [0, 1], outputRange: [56, 84] }),
            transform: [
              { scaleX: shadowScale.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.05] }) },
              { scaleY: shadowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) },
            ],
          }}
        />
      </View>
    </View>
  );
}
