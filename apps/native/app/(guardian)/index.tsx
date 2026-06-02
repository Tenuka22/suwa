import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Users, Heart, ArrowRight, UserCheck } from "lucide-react-native";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RootBottomBar } from "@/components/ui/root-bottom-bar";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function GuardianDashboard() {
  const colors = useThemeColor();
  const router = useRouter();
  const { user } = useUser();

  const managedPatients = useQuery(orpc.getManagedPatients.queryOptions());
  const pendingRequests = useQuery(orpc.getPendingRequests.queryOptions());

  const hasManaged = managedPatients.data && managedPatients.data.length > 0;
  const hasPending = pendingRequests.data && pendingRequests.data.length > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="flex-1 justify-between gap-section bg-background px-page py-page pb-24">
        <View className="gap-2">
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
            Guardian Dashboard
          </Text>
          <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
            Welcome, {user?.firstName ?? "Guardian"}
          </Text>
          <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
            Monitor and support your linked patients.
          </Text>
        </View>

        {(managedPatients.isLoading || pendingRequests.isLoading) ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-section pb-24">
              {/* Pending Requests Section */}
              {hasPending && (
                <View className="gap-4">
                  <View className="flex-row items-center gap-2">
                    <UserCheck color={colors.primary} size={20} />
                    <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                      Pending Invites ({pendingRequests.data?.length})
                    </Text>
                  </View>
                  <View className="gap-3">
                    <Button 
                      variant="secondary" 
                      className="justify-between"
                      onPress={() => router.push("/(onboarding)/onboarding")}
                    >
                      <Text>Review pending invitations</Text>
                      <ArrowRight color={colors.foreground} size={16} />
                    </Button>
                  </View>
                </View>
              )}

              {/* Managed Patients Section */}
              <View className="gap-4">
                <View className="flex-row items-center gap-2">
                  <Users color={colors.primary} size={20} />
                  <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                    Your Patients
                  </Text>
                </View>

                {!hasManaged ? (
                  <Card className="items-center gap-3 py-8">
                    <Heart color={colors.mutedForeground} size={32} />
                    <Text className="font-bold font-sans text-foreground text-center">
                      No patients linked yet
                    </Text>
                    <Text className="text-center font-normal font-sans text-muted-foreground text-sm">
                      When a patient invites you using your email or phone, their request will appear here.
                    </Text>
                  </Card>
                ) : (
                  <View className="gap-4">
                    {managedPatients.data?.map((patient) => (
                      <Card key={patient.userId} className="p-4 gap-3">
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                              {patient.alias}
                            </Text>
                            <Text className="font-normal font-sans text-muted-foreground text-xs">
                              Linked since {new Date(patient.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Heart color={colors.primary} size={20} />
                          </View>
                        </View>
                        
                        <View className="flex-row gap-2 mt-2">
                          <Button 
                            className="flex-1" 
                            variant="secondary"
                            onPress={() => {
                                router.push(`/(guardian)/patient/${patient.userId}/activities`);
                            }}
                          >
                            View Activities
                          </Button>
                          <Button 
                            className="flex-1" 
                            variant="secondary"
                            onPress={() => {
                                router.push(`/(guardian)/patient/${patient.userId}/stress-management`);
                            }}
                          >
                            View Stress
                          </Button>
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </View>

              {/* Quick Actions */}
              <View className="gap-4 mt-4">
                <Text className="font-black font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                  Guardian Tools
                </Text>
                <Button 
                  variant="secondary" 
                  className="justify-start"
                  onPress={() => router.push("/(guardian)/activities")}
                >
                  <Text className="text-foreground font-bold">View Patient Activities</Text>
                </Button>
                <Button 
                  variant="secondary" 
                  className="justify-start"
                  onPress={() => router.push("/(guardian)/track-management")}
                >
                  <Text className="text-foreground font-bold">Track Management</Text>
                </Button>

                <Text className="font-black font-sans text-foreground text-sm uppercase tracking-[0.2em] mt-4">
                  Account
                </Text>
                <Button 
                  variant="secondary" 
                  className="justify-start px-0"
                  onPress={() => router.push("/(guardian)/profile")}
                >
                  <Text className="text-foreground font-bold">Edit Guardian Profile</Text>
                </Button>
              </View>
            </View>
          </ScrollView>
        )}
      </Screen>

      <View className="absolute right-page bottom-page left-page">
        <RootBottomBar />
      </View>
    </>
  );
}
