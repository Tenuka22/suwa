import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Check, CloudSun, Moon, Sun, TreePine } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
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
  const tasksQuery = useQuery(
    orpc.getTodayTasks.queryOptions({ queryKey: ["getTodayTasks"] })
  );

  const tasks = tasksQuery.data?.tasks ?? [];
  const timeOfDay = tasksQuery.data?.timeOfDay ?? "morning";
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="gap-section bg-background px-page py-page"
        scrollClassName="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-section py-page"
        >
          {/* Header with tree */}
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

          {/* Overall Progress */}
          {tasksQuery.data && (
            <View className="rounded-card border-2 border-border bg-card px-card py-card">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold font-sans text-foreground text-sm">
                  Today's Progress
                </Text>
                <Text className="font-black font-sans text-foreground text-xl">
                  {completedCount}/{tasks.length}
                </Text>
              </View>
              <View className="mt-2 h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${
                      tasks.length > 0
                        ? (completedCount / tasks.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </View>
            </View>
          )}

          {/* Tree Branches */}
          {tasks.length > 0 ? (
            <View className="gap-1">
              {tasks.map((task, index) => {
                const completed = task.completed;
                const isFirst = index === 0;
                const isLast = index === tasks.length - 1;

                return (
                  <View key={task.actionType}>
                    {/* Branch connector */}
                    <View className="flex-row items-center pl-2">
                      <View
                        className={`w-0.5 ${isFirst ? "h-4" : "h-4"} ${isLast ? "flex-1" : "h-8"} bg-foreground/20`}
                      />
                    </View>

                    {/* Task card as tree branch */}
                    <View
                      className={`flex-row items-center gap-3 rounded-card border-2 bg-card px-card py-3 ${
                        completed
                          ? "border-green-300 opacity-60"
                          : "border-border"
                      }`}
                    >
                      {/* Branch indicator */}
                      <View className="items-center">
                        <View className="h-0.5 w-4 bg-foreground/20" />
                        <View className="h-8 w-0.5 bg-foreground/20" />
                      </View>

                      {/* Task content */}
                      <View className="flex-1 gap-1.5">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`rounded-full px-2 py-0.5 ${
                              task.timeSlot === "morning"
                                ? "bg-amber-200"
                                : task.timeSlot === "afternoon"
                                  ? "bg-orange-200"
                                  : "bg-indigo-200"
                            }`}
                          >
                            <View className="flex-row items-center gap-1">
                              {task.timeSlot === "morning" && (
                                <Sun color="#92400e" size={12} />
                              )}
                              {task.timeSlot === "afternoon" && (
                                <CloudSun color="#9a3412" size={12} />
                              )}
                              {task.timeSlot === "night" && (
                                <Moon color="#3730a3" size={12} />
                              )}
                              <Text
                                className={`font-bold text-[10px] uppercase tracking-wider ${
                                  task.timeSlot === "morning"
                                    ? "text-amber-900"
                                    : task.timeSlot === "afternoon"
                                      ? "text-orange-900"
                                      : "text-indigo-900"
                                }`}
                              >
                                {task.timeSlot}
                              </Text>
                            </View>
                          </View>
                          {completed && (
                            <View className="flex-row items-center gap-1 rounded-full bg-green-200 px-2 py-0.5">
                              <Check color="#166534" size={10} />
                              <Text className="font-bold text-[10px] text-green-800 uppercase tracking-wider">
                                Done
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="font-extrabold font-sans text-foreground text-xl tracking-tight">
                          {task.title}
                        </Text>
                        <Text className="font-normal font-sans text-muted-foreground text-sm leading-5">
                          {task.description}
                        </Text>
                        {!completed && (
                          <View className="flex-row items-center gap-2">
                            <View className="h-2 flex-1 overflow-hidden rounded-full border border-border bg-muted">
                              <View
                                className="h-full rounded-full bg-primary"
                                style={{ width: "0%" }}
                              />
                            </View>
                            <Text className="font-bold font-sans text-foreground text-xs">
                              {task.requiredCycles} cycle
                              {task.requiredCycles > 1 ? "s" : ""}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action button */}
                      {!completed && (
                        <Button
                          className="min-w-[90px]"
                          href={ACTION_ROUTES[task.actionType]}
                          variant="primary"
                        >
                          Start
                        </Button>
                      )}
                      {completed && (
                        <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-green-300 bg-green-100">
                          <Check color="#166534" size={18} />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Root of the tree */}
              <View className="flex-row items-center pl-2">
                <View className="h-8 w-0.5 bg-foreground/20" />
              </View>
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

          <Button className="w-full" href="/sprite" variant="secondary">
            Back to Sprite Dashboard ›
          </Button>
        </ScrollView>
      </Screen>
    </>
  );
}
