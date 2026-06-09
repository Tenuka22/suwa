import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";

const PEBBLE_COUNT = 36;

interface Pebble {
  size: number;
  x: number;
  y: number;
}

export default function MeditationActionScreen() {
  const router = useRouter();
  const { type, action: actionType } = useLocalSearchParams<{
    type: string;
    action: string;
  }>();

  const [minutes, setMinutes] = useState(10);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const statusText = done
    ? "Meditation complete"
    : running
      ? "In progress"
      : "Ready to begin";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  const pebbles = useMemo<Pebble[]>(
    () =>
      Array.from({ length: PEBBLE_COUNT }, () => ({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        size: Math.random() * 6 + 4,
      })),
    []
  );

  const completeMutation = useMutation(
    orpc.completeWellnessAction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSpriteState.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getMoonlightCredits.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getWellnessHistory.key(),
        });
      },
    })
  );

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!running) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return;
    }

    setDone(false);
    Animated.timing(progress, {
      toValue: 1,
      duration: minutes * 60 * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    vibrate([40, 40, 40]);

    timerRef.current = setTimeout(
      () => {
        setRunning(false);
        setDone(true);
        vibrate([80, 60, 80, 60, 120]);
        playToneSequence();

        if (actionType && !rewarded) {
          setRewarded(true);
          completeMutation.mutate({
            actionType: actionType as
              | "meditation_morning"
              | "meditation_evening",
            durationSeconds: minutes * 60,
          });
        }
      },
      minutes * 60 * 1000
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [minutes, progress, running, rewarded]);

  const handleStart = () => {
    setRunning(true);
    setDone(false);
    vibrate([30, 20, 30]);
  };

  const handleStop = () => {
    setRunning(false);
    setDone(false);
    vibrate(20);
  };

  const handleBack = useCallback(() => {
    vibrate(15);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page pb-24">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="border-border border-b-2 px-card py-card">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.3em]">
              {type === "morning" ? "Morning" : "Evening"} Meditation
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Meditation
            </Text>
            <Text className="mt-2 font-normal font-sans text-base text-muted-foreground leading-6">
              Set a timer for mindfulness.
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            <View className="items-center gap-4 rounded-card border-2 border-border bg-background px-card py-card">
              <View className="h-44 w-full items-center justify-center overflow-hidden rounded-[34px] border-2 border-border bg-muted/30">
                <Heart color="#f97316" size={24} />
                {pebbles.map((pebble, i) => {
                  const threshold = (i + 1) / PEBBLE_COUNT;
                  return (
                    <View
                      className="absolute"
                      key={i}
                      style={{
                        left: `${pebble.x}%`,
                        top: `${pebble.y}%`,
                        width: pebble.size,
                        height: pebble.size,
                      }}
                    >
                      <Animated.View
                        className="h-full w-full rounded-full bg-primary"
                        style={{
                          opacity: progress.interpolate({
                            inputRange: [threshold - 0.05, threshold],
                            outputRange: [0, 0.85],
                            extrapolate: "clamp",
                          }),
                        }}
                      />
                    </View>
                  );
                })}
              </View>

              {running && (
                <Text className="font-black font-sans text-3xl text-foreground tracking-tight">
                  {minutes} min
                </Text>
              )}
              <Text className="font-normal font-sans text-muted-foreground text-sm">
                {statusText}
              </Text>
            </View>

            {running && (
              <View className="h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
                <Animated.View
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  }}
                />
              </View>
            )}

            {done && (
              <View className="items-center gap-3 rounded-card border-2 border-border bg-background px-card py-card">
                <Text className="font-black font-sans text-2xl text-primary">
                  ✓ Complete
                </Text>
                <Text className="text-center font-normal font-sans text-muted-foreground text-sm">
                  {rewarded
                    ? `You completed a ${minutes}-minute meditation and earned Moonlight Credits!`
                    : `You completed a ${minutes}-minute meditation.`}
                </Text>
                <Button className="w-full" href="/sprite" variant="secondary">
                  Back to Dashboard
                </Button>
              </View>
            )}

            {completeMutation.isPending && (
              <Text className="text-center font-bold font-sans text-primary text-sm">
                Saving to your wellness record...
              </Text>
            )}
          </View>
        </View>
      </Screen>
      <ScreenBottomBar>
        {running || done ? (
          running ? (
            <View className="flex-1 items-center justify-center rounded-control border-2 border-border bg-background px-3 py-2">
              <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                Duration
              </Text>
              <Text className="font-black font-sans text-foreground text-sm">
                {minutes} min
              </Text>
            </View>
          ) : (
            <View className="flex-1" />
          )
        ) : (
          <View className="flex-1 flex-row gap-1">
            {[5, 10, 15, 20].map((m) => (
              <Pressable
                className={`flex-1 items-center justify-center rounded-control border-2 ${
                  minutes === m
                    ? "border-primary bg-primary"
                    : "border-border bg-background"
                }`}
                key={m}
                onPress={() => setMinutes(m)}
              >
                <Text
                  className={`font-bold font-sans text-xs ${
                    minutes === m ? "text-white" : "text-foreground"
                  }`}
                >
                  {m}m
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {done ? (
          <Button className="h-12" onPress={handleStart} variant="primary">
            Start
          </Button>
        ) : (
          <Button
            className="h-12"
            onPress={running ? handleStop : handleStart}
            variant={running ? "secondary" : "primary"}
          >
            {running ? "Stop" : "Start"}
          </Button>
        )}
        <IconButton icon={ArrowLeft} iconSize={16} onPress={handleBack} />
      </ScreenBottomBar>
    </>
  );
}
