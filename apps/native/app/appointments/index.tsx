import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Calendar, Clock, User } from "lucide-react-native";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";

const statusColorMap = {
  attended: {
    dark: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-600",
    },
    light: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-600",
    },
  },
  cancelled: {
    dark: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-600",
    },
    light: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-600",
    },
  },
  scheduled: {
    dark: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-600",
    },
    light: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-600",
    },
  },
} as const;

const defaultStatusColor = {
  dark: {
    bg: "bg-muted/30",
    border: "border-border",
    text: "text-muted-foreground",
  },
  light: {
    bg: "bg-muted/20",
    border: "border-border",
    text: "text-muted-foreground",
  },
} as const;

function getStatusColor(status: string, isDark: boolean) {
  const mode = isDark ? "dark" : "light";
  const colors = statusColorMap[status as keyof typeof statusColorMap];
  return colors ? colors[mode] : defaultStatusColor[mode];
}

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#fafafa" : "#09090b";

  const profileQuery = useQuery(orpc.getPatientProfile.queryOptions());

  const sessionsQuery = useQuery(orpc.listPatientSessions.queryOptions());

  const sessions = sessionsQuery.data?.sessions ?? [];
  const hasProfile = profileQuery.data?.isOnboardingComplete ?? false;

  if (profileQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center px-page py-page">
          <ActivityIndicator size="large" />
        </Screen>
      </>
    );
  }

  if (!hasProfile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="gap-6 px-page py-page">
          <View className="gap-3">
            <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
              Appointments
            </Text>
            <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
              Your booked sessions with doctors. Once scheduled, appointments
              cannot be cancelled.
            </Text>
          </View>

          <Card className="gap-3">
            <User color={iconColor} size={24} />
            <Text className="font-bold font-sans text-base text-foreground">
              No patient profile
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-sm">
              Create a patient profile from the booking screen to view your
              appointments.
            </Text>
          </Card>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="gap-3">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            Appointments
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Your booked sessions with doctors. Once scheduled, appointments
            cannot be cancelled.
          </Text>
        </View>

        {sessions.length === 0 ? (
          <Card className="gap-3">
            <Calendar color={iconColor} size={24} />
            <Text className="font-bold font-sans text-base text-foreground">
              No appointments yet
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-sm">
              Book a session with a doctor to see your appointments here.
            </Text>
          </Card>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-4">
              {sessions.map((session) => {
                const startAt = new Date(session.startAt);
                const endAt = new Date(session.endAt);
                const dateLabel = startAt.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                const timeLabel = `${startAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${endAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
                const statusColors = getStatusColor(session.status, isDark);

                return (
                  <Card className="gap-3" key={session.id}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <User color={iconColor} size={16} />
                        <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
                          Session
                        </Text>
                      </View>

                      <View
                        className={`rounded-full border px-3 py-1 ${statusColors.bg} ${statusColors.border}`}
                      >
                        <Text
                          className={`font-bold text-xs ${statusColors.text}`}
                        >
                          {session.status}
                        </Text>
                      </View>
                    </View>

                    <View className="gap-2 rounded-xl border border-border/50 bg-muted/5 p-3">
                      <View className="flex-row items-center gap-2">
                        <Calendar color={iconColor} size={14} />
                        <Text className="font-medium font-sans text-foreground text-sm">
                          {dateLabel}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Clock color={iconColor} size={14} />
                        <Text className="font-medium font-sans text-foreground text-sm">
                          {timeLabel}
                        </Text>
                      </View>
                    </View>

                    <Text className="font-medium font-sans text-muted-foreground text-xs">
                      Doctor ID: {session.doctorId}
                    </Text>
                  </Card>
                );
              })}
            </View>
          </ScrollView>
        )}
      </Screen>
    </>
  );
}
