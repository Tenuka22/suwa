import { useQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  CloudSun,
  Moon,
  Sun,
  TreePine,
} from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playSoftChime } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const ACTION_ROUTES: Record<string, string> = {
  breathing_morning:
    "/sprite/actions/breathing?type=morning&action=breathing_morning",
  breathing_evening:
    "/sprite/actions/breathing?type=afternoon&action=breathing_evening",
  breathing_night:
    "/sprite/actions/breathing?type=night&action=breathing_night",
  meditation_morning:
    "/sprite/actions/meditation?type=morning&action=meditation_morning",
  meditation_evening:
    "/sprite/actions/meditation?type=evening&action=meditation_evening",
};

export default function SpriteActionsScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const tasksQuery = useQuery(
    orpc.getTodayTasks.queryOptions({ queryKey: ["getTodayTasks"] })
  );

  const tasks = tasksQuery.data?.tasks ?? [];
  const timeOfDay = tasksQuery.data?.timeOfDay ?? "morning";
  const completedCount = tasks.filter((t) => t.completed).length;

  useEffect(() => {
    if (tasksQuery.isFetched) {
      playSoftChime();
    }
  }, [tasksQuery.isFetched]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="gap-section bg-background px-page py-page"
        scrollClassName="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-section py-page pb-24"
        >
          <View className="items-center gap-2">
            <TreePine color={colors.foreground} size={40} />
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              {timeOfDay === "morning"
                ? "Morning"
                : timeOfDay === "afternoon"
                  ? "Afternoon"
                  : "Night"}{" "}
              Wellness
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Wellness Tree
            </Text>
            <Text className="text-center font-normal font-sans text-base text-muted-foreground leading-6">
              Complete your daily wellness tasks to grow your tree and keep your
              Sprite healthy.
            </Text>
          </View>

          {tasks.length > 0 ? (
            <View className="gap-3">
              {tasks.map((task) => {
                const completed = task.completed;
                const route = ACTION_ROUTES[task.actionType];

                return (
                  <Pressable
                    className={`flex-row items-center gap-4 rounded-card border-2 bg-card px-4 py-4 ${
                      completed
                        ? "border-green-300 opacity-60"
                        : "border-border"
                    }`}
                    key={task.actionType}
                    onPress={() => {
                      vibrate(20);
                      router.push(route as Href);
                    }}
                  >
                    <View
                      className={`rounded-full p-3 ${
                        task.timeSlot === "morning"
                          ? "bg-amber-100"
                          : task.timeSlot === "afternoon"
                            ? "bg-orange-100"
                            : "bg-indigo-100"
                      }`}
                    >
                      {task.timeSlot === "morning" && (
                        <Sun color="#92400e" size={20} />
                      )}
                      {task.timeSlot === "afternoon" && (
                        <CloudSun color="#9a3412" size={20} />
                      )}
                      {task.timeSlot === "night" && (
                        <Moon color="#3730a3" size={20} />
                      )}
                    </View>

                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className={`font-bold text-[10px] uppercase tracking-wider ${
                            task.timeSlot === "morning"
                              ? "text-amber-800"
                              : task.timeSlot === "afternoon"
                                ? "text-orange-800"
                                : "text-indigo-800"
                          }`}
                        >
                          {task.timeSlot}
                        </Text>
                        {completed && (
                          <View className="flex-row items-center gap-1 rounded-full bg-green-200 px-2 py-0.5">
                            <Check color="#166534" size={10} />
                            <Text className="font-bold text-[10px] text-green-800 uppercase tracking-wider">
                              Done
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="font-extrabold font-sans text-foreground text-lg tracking-tight">
                        {task.title}
                      </Text>
                      <Text className="font-normal font-sans text-muted-foreground text-sm leading-5">
                        {task.description}
                      </Text>
                    </View>

                    <View className="h-10 w-10 items-center justify-center">
                      {completed ? (
                        <Check color="#166534" size={18} />
                      ) : (
                        <Text className="font-bold font-sans text-lg text-primary">
                          ›
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View className="items-center gap-2 rounded-card border-2 border-border bg-card px-card py-card">
              <Text className="font-black font-sans text-2xl text-primary">
                Loading...
              </Text>
            </View>
          )}

          {completedCount === tasks.length && tasks.length > 0 && (
            <View className="items-center gap-2 rounded-card border-2 border-green-300 bg-green-50 px-card py-card">
              <TreePine color="#166534" size={32} />
              <Text className="text-center font-black font-sans text-green-800 text-lg">
                Your tree is fully grown today!
              </Text>
              <Text className="text-center font-normal font-sans text-green-700 text-sm">
                All wellness tasks complete. Come back tomorrow to keep your
                tree thriving.
              </Text>
            </View>
          )}
        </ScrollView>
      </Screen>
      <ScreenBottomBar>
        <View className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-background px-3 py-2">
          <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Today's Progress
          </Text>
          <Text className="font-black font-sans text-foreground text-lg">
            {completedCount}/{tasks.length}
          </Text>
        </View>
        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            vibrate(15);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
