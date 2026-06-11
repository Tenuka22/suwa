import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";

type SpriteAction =
  | "idle"
  | "happy"
  | "thinking"
  | "alert"
  | "sleepy"
  | "excited";

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
  eyeScaleX: Animated.Value;
  eyeScaleY: Animated.Value;
  indicator: Animated.Value;
  indicatorY: Animated.Value;
  jolt: Animated.Value;
  pupilX: Animated.Value;
  pupilY: Animated.Value;
  tilt: Animated.Value;
}

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
  refs.indicator.setValue(0);
  refs.indicatorY.setValue(0);
};

const fidgetSequence = (
  refs: AnimRefs,
  fidget: () => Animated.CompositeAnimation,
  minDelay: number,
  maxDelay: number,
  chance = 0.5
) => {
  let timeout: ReturnType<typeof setTimeout>;

  const schedule = () => {
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    timeout = setTimeout(() => {
      if (Math.random() < chance) {
        fidget().start();
      }
      schedule();
    }, delay);
  };

  schedule();
  return () => clearTimeout(timeout);
};

const animateIdle = (refs: AnimRefs) => {
  const blink = () => {
    Animated.sequence([
      Animated.timing(refs.eyeScaleY, {
        toValue: 0.1,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(refs.eyeScaleY, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const blinkTimer = setInterval(() => {
    if (Math.random() > 0.4) {
      blink();
    }
  }, 3000);

  const fidgetCleanup = fidgetSequence(
    refs,
    () =>
      Animated.sequence([
        Animated.timing(refs.pupilX, {
          toValue: Math.random() > 0.5 ? 6 : -6,
          duration: 200,
          easing: sineIO,
          useNativeDriver: true,
        }),
        Animated.timing(refs.pupilX, {
          toValue: 0,
          duration: 200,
          easing: sineIO,
          useNativeDriver: true,
        }),
      ]),
    3500,
    7000,
    0.6
  );

  return () => {
    clearInterval(blinkTimer);
    fidgetCleanup();
  };
};

const animateHappy = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.eyeScaleY, {
      toValue: 0.3,
      duration: 300,
      easing: springOut,
      useNativeDriver: true,
    }),
    Animated.timing(refs.eyeScaleX, {
      toValue: 1.2,
      duration: 300,
      easing: springOut,
      useNativeDriver: true,
    }),
    Animated.sequence([
      Animated.timing(refs.jolt, {
        toValue: -15,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(refs.jolt, {
        toValue: 0,
        duration: 300,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]),
  ]).start();

  const fidgetCleanup = fidgetSequence(
    refs,
    () =>
      Animated.sequence([
        Animated.timing(refs.tilt, {
          toValue: -5,
          duration: 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(refs.tilt, {
          toValue: 5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(refs.tilt, {
          toValue: -5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(refs.tilt, {
          toValue: 5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(refs.tilt, {
          toValue: -5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(refs.tilt, {
          toValue: 0,
          duration: 80,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]),
    3500,
    8000,
    0.55
  );

  return fidgetCleanup;
};

const animateThinking = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.pupilX, {
      toValue: 8,
      duration: 400,
      easing: sineIO,
      useNativeDriver: true,
    }),
    Animated.timing(refs.pupilY, {
      toValue: -6,
      duration: 400,
      easing: sineIO,
      useNativeDriver: true,
    }),
    Animated.timing(refs.tilt, {
      toValue: 8,
      duration: 500,
      easing: springOut,
      useNativeDriver: true,
    }),
    Animated.timing(refs.eyeScaleY, {
      toValue: 0.8,
      duration: 400,
      useNativeDriver: true,
    }),
  ]).start();

  const fidgetCleanup = fidgetSequence(
    refs,
    () =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(refs.pupilX, {
            toValue: -4,
            duration: 120,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(refs.pupilY, {
            toValue: 4,
            duration: 120,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicator, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicatorY, {
            toValue: -15,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(refs.pupilX, {
            toValue: 8,
            duration: 120,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(refs.pupilY, {
            toValue: -6,
            duration: 120,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicator, {
            toValue: 0,
            duration: 300,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ]),
      ]),
    3000,
    6000,
    0.65
  );

  return fidgetCleanup;
};

const animateAlert = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.eyeScaleY, {
      toValue: 1.4,
      duration: 150,
      easing: springOut,
      useNativeDriver: true,
    }),
    Animated.timing(refs.eyeScaleX, {
      toValue: 1.4,
      duration: 150,
      easing: springOut,
      useNativeDriver: true,
    }),
    Animated.sequence([
      Animated.timing(refs.jolt, {
        toValue: -8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(refs.jolt, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]),
  ]).start();

  const fidgetCleanup = fidgetSequence(
    refs,
    () =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(refs.pupilX, {
            toValue: Math.random() > 0.5 ? 10 : -10,
            duration: 80,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicator, {
            toValue: 1,
            duration: 60,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(refs.pupilX, {
            toValue: 0,
            duration: 400,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicator, {
            toValue: 0,
            duration: 250,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ]),
      ]),
    2000,
    4500,
    0.7
  );

  return fidgetCleanup;
};

const animateSleepy = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.eyeScaleY, {
      toValue: 0.5,
      duration: 800,
      easing: sineIO,
      useNativeDriver: true,
    }),
    Animated.timing(refs.eyeScaleX, {
      toValue: 0.9,
      duration: 800,
      easing: sineIO,
      useNativeDriver: true,
    }),
    Animated.timing(refs.tilt, {
      toValue: 12,
      duration: 1000,
      easing: sineIO,
      useNativeDriver: true,
    }),
    Animated.timing(refs.pupilY, {
      toValue: 4,
      duration: 800,
      easing: sineIO,
      useNativeDriver: true,
    }),
  ]).start();

  const fidgetCleanup = fidgetSequence(
    refs,
    () =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(refs.jolt, {
            toValue: -8,
            duration: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(refs.tilt, {
            toValue: -4,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(refs.eyeScaleY, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicator, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicatorY, {
            toValue: -10,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(refs.jolt, {
            toValue: 0,
            duration: 400,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(refs.tilt, {
            toValue: 12,
            duration: 400,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(refs.eyeScaleY, {
            toValue: 0.5,
            duration: 400,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicator, {
            toValue: 0,
            duration: 500,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(refs.indicatorY, {
            toValue: -20,
            duration: 500,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ]),
      ]),
    5000,
    10_000,
    0.5
  );

  return fidgetCleanup;
};

const animateExcited = (refs: AnimRefs) => {
  Animated.parallel([
    Animated.timing(refs.eyeScaleY, {
      toValue: 1.5,
      duration: 200,
      easing: springOut,
      useNativeDriver: true,
    }),
    Animated.timing(refs.eyeScaleX, {
      toValue: 1.3,
      duration: 200,
      easing: springOut,
      useNativeDriver: true,
    }),
    Animated.sequence([
      Animated.timing(refs.jolt, {
        toValue: -12,
        duration: 120,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(refs.jolt, {
        toValue: 0,
        duration: 200,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]),
    Animated.sequence([
      Animated.timing(refs.pupilX, {
        toValue: -3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(refs.pupilX, {
        toValue: 3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(refs.pupilX, {
        toValue: -3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(refs.pupilX, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]),
  ]).start();

  const bounceFidget = () =>
    Animated.sequence([
      Animated.parallel([
        Animated.timing(refs.jolt, {
          toValue: -10,
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(refs.eyeScaleY, {
          toValue: 1.6,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(refs.jolt, {
          toValue: 0,
          duration: 200,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(refs.eyeScaleY, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]);

  const fidgetCleanup = fidgetSequence(
    refs,
    () => bounceFidget(),
    2500,
    6000,
    0.6
  );

  return fidgetCleanup;
};

interface SpriteMascotProps {
  action?: SpriteAction;
  size?: "sm" | "md" | "lg";
}

export function SpriteMascot({
  action = "idle",
  size = "md",
}: SpriteMascotProps) {
  const [currentAction, setCurrentAction] = useState<SpriteAction>(action);
  const float = useRef(new Animated.Value(0)).current;
  const tap = useRef(new Animated.Value(0)).current;
  const tapSquishY = useRef(new Animated.Value(1)).current;
  const tapSquishX = useRef(new Animated.Value(1)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const shadowPulse = useRef(new Animated.Value(0)).current;
  const animRefs: AnimRefs = useRef({
    eyeScaleY: new Animated.Value(1),
    eyeScaleX: new Animated.Value(1),
    pupilX: new Animated.Value(0),
    pupilY: new Animated.Value(0),
    tilt: new Animated.Value(0),
    jolt: new Animated.Value(0),
    indicator: new Animated.Value(0),
    indicatorY: new Animated.Value(0),
  }).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(float, {
            toValue: -12,
            duration: 1500,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.7,
            duration: 1500,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(shadowPulse, {
            toValue: 1,
            duration: 1500,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(float, {
            toValue: 0,
            duration: 1500,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 1,
            duration: 1500,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(shadowPulse, {
            toValue: 0,
            duration: 1500,
            easing: sineIO,
            useNativeDriver: true,
          }),
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
      case "sleepy":
        cleanup = animateSleepy(animRefs);
        break;
      case "excited":
        cleanup = animateExcited(animRefs);
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

  return (
    <View className="w-full flex-1 items-center justify-center">
      <View className="w-full items-center justify-center gap-8">
        <Pressable
          onPressIn={() => {
            Animated.sequence([
              Animated.parallel([
                Animated.timing(tap, {
                  toValue: 1,
                  duration: 80,
                  useNativeDriver: true,
                }),
                Animated.timing(tapSquishY, {
                  toValue: 0.3,
                  duration: 80,
                  useNativeDriver: true,
                }),
                Animated.timing(tapSquishX, {
                  toValue: 1.3,
                  duration: 80,
                  useNativeDriver: true,
                }),
              ]),
              Animated.parallel([
                Animated.timing(tap, {
                  toValue: 0,
                  duration: 120,
                  useNativeDriver: true,
                }),
                Animated.timing(tapSquishY, {
                  toValue: 1,
                  duration: 120,
                  useNativeDriver: true,
                }),
                Animated.timing(tapSquishX, {
                  toValue: 1,
                  duration: 120,
                  useNativeDriver: true,
                }),
              ]),
            ]).start();
          }}
        >
          <Animated.View
            className={`z-10 items-center ${size === "sm" ? "scale-75" : size === "lg" ? "scale-110" : "scale-100"}`}
            style={{
              transform: [
                { translateY: float },
                { translateY: animRefs.jolt },
                {
                  translateY: tap.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2],
                  }),
                },
              ],
            }}
          >
            <Animated.View
              className="relative h-[180px] w-[180px] items-center justify-center rounded-[34px] bg-[#62B6CB] shadow-lg"
              style={{
                shadowColor: C.skin,
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 10,
                elevation: 8,
                transform: [{ rotate: headRot }],
              }}
            >
              <Animated.Text
                aria-label={
                  currentAction === "sleepy"
                    ? "sleeping"
                    : currentAction === "alert"
                      ? "alert"
                      : "thinking"
                }
                className="absolute -top-12 right-0 font-black text-4xl"
                role="img"
                style={{
                  opacity: animRefs.indicator,
                  transform: [{ translateY: animRefs.indicatorY }],
                  color:
                    currentAction === "alert"
                      ? "#ef4444"
                      : currentAction === "thinking"
                        ? "#f59e0b"
                        : "#8b5cf6",
                }}
              >
                {currentAction === "sleepy"
                  ? "Zzz"
                  : currentAction === "alert"
                    ? "!"
                    : "?"}
              </Animated.Text>
              <View className="absolute top-[26px] right-[30px] h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#22c55e]">
                <View className="absolute h-[18px] w-[5px] rounded-full bg-white" />
                <View className="absolute h-[5px] w-[18px] rounded-full bg-white" />
              </View>

              <View className="mt-[16px] flex-row gap-10">
                <Animated.View
                  className="h-[52px] w-[52px] rounded bg-[#1B2A41]"
                  style={{
                    transform: [
                      {
                        scaleY: Animated.multiply(
                          animRefs.eyeScaleY,
                          tapSquishY
                        ),
                      },
                      {
                        scaleX: Animated.multiply(
                          animRefs.eyeScaleX,
                          tapSquishX
                        ),
                      },
                      { translateX: animRefs.pupilX },
                      { translateY: animRefs.pupilY },
                    ],
                  }}
                />
                <Animated.View
                  className="h-[52px] w-[52px] rounded bg-[#1B2A41]"
                  style={{
                    transform: [
                      {
                        scaleY: Animated.multiply(
                          animRefs.eyeScaleY,
                          tapSquishY
                        ),
                      },
                      {
                        scaleX: Animated.multiply(
                          animRefs.eyeScaleX,
                          tapSquishX
                        ),
                      },
                      { translateX: animRefs.pupilX },
                      { translateY: animRefs.pupilY },
                    ],
                  }}
                />
              </View>
            </Animated.View>

            <View className="mt-3 h-[42px] w-[42px] rounded-[10px] bg-[#62B6CB]" />
          </Animated.View>
        </Pressable>
        <Animated.View
          className="h-3 rounded-full bg-[#CBD5E1]"
          style={{
            opacity: 0.8,
            width: shadowScale.interpolate({
              inputRange: [0, 1],
              outputRange: [56, 84],
            }),
            transform: [
              {
                scaleX: shadowScale.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.05],
                }),
              },
              {
                scaleY: shadowPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.7],
                }),
              },
            ],
          }}
        />
      </View>
    </View>
  );
}
