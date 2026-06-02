import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Activity, BarChart3 } from "lucide-react-native";
import { ScrollView, Text, View, ActivityIndicator, Pressable } from "react-native";

import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function GuardianPatientStressScreen() {
  const { patientUserId } = useLocalSearchParams<{ patientUserId: string }>();
  const colors = useThemeColor();
  const router = useRouter();

  const stressQuery = useQuery(orpc.getManagedPatientStressMetrics.queryOptions({ input: { patientUserId: patientUserId ?? "" } }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-6 px-page py-page pb-40">
        <View className="gap-3">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            Stress Metrics
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Review your patient's recent stress trends.
          </Text>
        </View>

        {stressQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="gap-4 pb-4">
                    {stressQuery.data?.length === 0 ? (
                        <Card className="gap-3">
                            <BarChart3 color={colors.foreground} size={24} />
                            <Text className="font-bold font-sans text-base text-foreground">
                                No stress data available.
                            </Text>
                        </Card>
                    ) : (
                        stressQuery.data?.map((score, index) => {
                            const color = score > 0.7 ? "text-destructive" : score > 0.4 ? "text-warning" : "text-success";
                            const bg = score > 0.7 ? "bg-destructive/10" : score > 0.4 ? "bg-warning/10" : "bg-success/10";
                            return (
                                <Card key={index} className={`gap-3 ${bg}`}>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
                                            Observation {index + 1}
                                        </Text>
                                        <Text className={`font-black font-sans text-xl ${color}`}>
                                            {(score * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                </Card>
                            )
                        })
                    )}
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
