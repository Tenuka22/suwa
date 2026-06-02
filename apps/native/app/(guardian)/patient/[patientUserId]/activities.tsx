import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Activity, Calendar } from "lucide-react-native";
import { ScrollView, Text, View, ActivityIndicator, Pressable } from "react-native";

import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function GuardianPatientActivitiesScreen() {
  const { patientUserId } = useLocalSearchParams<{ patientUserId: string }>();
  const colors = useThemeColor();
  const router = useRouter();

  const wellnessQuery = useQuery(orpc.getManagedPatientWellness.queryOptions({ input: { patientUserId: patientUserId ?? "" } }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-6 px-page py-page pb-40">
        <View className="gap-3">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            Patient Activities
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Review your patient's recent wellness activities.
          </Text>
        </View>

        {wellnessQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="gap-4 pb-4">
                    {wellnessQuery.data?.map((action) => (
                        <Card key={action.id} className="gap-3">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-2">
                                    <Activity color={colors.foreground} size={16} />
                                    <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
                                        {action.actionType.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>

                            <View className="gap-2 rounded-xl border border-border/50 bg-muted/5 p-3">
                                <View className="flex-row items-center gap-2">
                                    <Calendar color={colors.foreground} size={14} />
                                    <Text className="font-medium font-sans text-foreground text-sm">
                                        {new Date(action.completedAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text className="font-medium font-sans text-foreground text-sm">
                                    Duration: {action.durationSeconds} seconds
                                </Text>
                                <Text className="font-medium font-sans text-primary text-sm">
                                    Credits Earned: {action.creditsEarned}
                                </Text>
                            </View>
                        </Card>
                    ))}
                </View>
            </ScrollView>
        )}
      </Screen>
      <ScreenBottomBar>
        <View className="flex-1" />
        <Pressable
          className="aspect-square items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.foreground} size={18} strokeWidth={2.5} />
        </Pressable>
      </ScreenBottomBar>
    </>
  );
}
