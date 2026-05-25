import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Calendar, Check, Clock, User, Video, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { VideoRoom } from "@/components/ui/video-room";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const statusColorMap: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  attended: {
    bg: "bg-success/20",
    border: "border-success/30",
    text: "text-success",
  },
  cancelled: {
    bg: "bg-destructive/15",
    border: "border-destructive/30",
    text: "text-destructive",
  },
  scheduled: {
    bg: "bg-warning/20",
    border: "border-warning/30",
    text: "text-warning",
  },
};

const defaultStatusColor = {
  bg: "bg-muted/20",
  border: "border-border",
  text: "text-muted-foreground",
};

function getStatusColor(status: string) {
  return statusColorMap[status] ?? defaultStatusColor;
}

function StatusBadge({ status }: { status: string }) {
  const sc = getStatusColor(status);
  return (
    <View className={`rounded-full border px-3 py-1 ${sc.bg} ${sc.border}`}>
      <Text className={`font-bold text-xs ${sc.text}`}>{status}</Text>
    </View>
  );
}

export default function AppointmentsScreen() {
  const { user } = useUser();
  const metadataRole = user?.publicMetadata?.role;
  const userRole: "patient" | "doctor" | "admin" = metadataRole === "admin" ? "admin" : metadataRole === "doctor" ? "doctor" : "patient";
  const colors = useThemeColor();
  const { bookingSuccess } = useLocalSearchParams<{
    bookingSuccess?: string;
  }>();
  const [showSuccessBanner, setShowSuccessBanner] = useState(
    bookingSuccess === "true"
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const profileQuery = useQuery(orpc.getPatientProfile.queryOptions());

  const sessionsQuery = useQuery(orpc.listPatientSessions.queryOptions());

  const sessions = sessionsQuery.data?.sessions ?? [];
  const hasProfile = profileQuery.data?.isOnboardingComplete ?? false;

  const handleCloseVideoRoom = useCallback(() => {
    setActiveSessionId(null);
  }, []);

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
            <User color={colors.foreground} size={24} />
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
            Your booked sessions with doctors.
          </Text>
        </View>

        {showSuccessBanner ? (
          <View className="flex-row items-start gap-3 rounded-xl border-2 border-success bg-success/10 px-4 py-3">
            <View className="mt-0.5 rounded-full bg-success p-1">
              <Check color="#ffffff" size={14} />
            </View>
            <View className="flex-1">
              <Text className="font-bold font-sans text-sm text-success-foreground">
                Booking confirmed
              </Text>
              <Text className="font-sans text-success-foreground/80 text-xs">
                Your session has been booked successfully.
              </Text>
            </View>
            <View className="flex-row items-center justify-center self-center">
              <Button
                icon={<X color={colors.foreground} size={16} />}
                onPress={() => setShowSuccessBanner(false)}
                size="sm"
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

        {sessions.length === 0 ? (
          <Card className="gap-3">
            <Calendar color={colors.foreground} size={24} />
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

                const isActiveInVideo = activeSessionId === session.id;

                return (
                  <Card className="gap-3" key={session.id}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <User color={colors.foreground} size={16} />
                        <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
                          {session.doctor?.displayName ?? "Session"}
                        </Text>
                      </View>
                      <StatusBadge status={session.status} />
                    </View>

                    <View className="gap-2 rounded-xl border border-border/50 bg-muted/5 p-3">
                      <View className="flex-row items-center gap-2">
                        <Calendar color={colors.foreground} size={14} />
                        <Text className="font-medium font-sans text-foreground text-sm">
                          {dateLabel}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Clock color={colors.foreground} size={14} />
                        <Text className="font-medium font-sans text-foreground text-sm">
                          {timeLabel}
                        </Text>
                      </View>
                    </View>

                    {session.plan ? (
                      <View className="flex-row items-center justify-between rounded-xl border border-border/50 bg-card px-3 py-2">
                        <Text className="font-bold font-sans text-foreground text-xs uppercase">
                          {session.plan.name}
                        </Text>
                        <Text className="font-black font-sans text-primary text-xs">
                          ${(session.plan.price / 100).toFixed(2)}
                        </Text>
                      </View>
                    ) : null}

                    {session.status === "scheduled" ? (
                      <>
                        <SessionJoinButton
                          endAt={session.endAt}
                          onJoin={setActiveSessionId}
                          role={userRole}
                          sessionId={session.id}
                          startAt={session.startAt}
                        />
                        {isActiveInVideo ? (
                          <VideoRoom
                            endAt={session.endAt}
                            onClose={handleCloseVideoRoom}
                            role={userRole}
                            sessionId={session.id}
                            startAt={session.startAt}
                          />
                        ) : null}
                      </>
                    ) : null}
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

function SessionJoinButton({
  endAt,
  onJoin,
  role,
  sessionId,
  startAt,
}: {
  endAt: string;
  onJoin: (id: string) => void;
  role: "patient" | "doctor" | "admin";
  sessionId: string;
  startAt: string;
}) {
  const colors = useThemeColor();
  const timing = useSessionTiming(startAt, endAt, role);

  if (timing.canJoin) {
    return (
      <Button
        className="w-full"
        icon={<Video color={colors.primaryForeground} size={16} />}
        onPress={() => onJoin(sessionId)}
        variant="primary"
      >
        Join Session
      </Button>
    );
  }

  if (timing.timeStatus === "before" && timing.joinWindowOpenAt) {
    const diff = timing.joinWindowOpenAt.getTime() - Date.now();
    const minutes = Math.max(0, Math.ceil(diff / 60_000));

    if (minutes < 60) {
      return (
        <Text className="text-center font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
          Join opens in {minutes} minutes
        </Text>
      );
    }
  }

  return null;
}
