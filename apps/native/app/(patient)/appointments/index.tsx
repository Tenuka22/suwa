import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Stethoscope,
  User,
  Video,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const SMALL_BREAKPOINT = 680;

export default function AppointmentsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const metadataRole = user?.publicMetadata?.role;
  const userRole: "patient" | "doctor" | "admin" =
    metadataRole === "admin"
      ? "admin"
      : metadataRole === "doctor"
        ? "doctor"
        : "patient";
  const colors = useThemeColor();
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_BREAKPOINT;
  const { bookingSuccess } = useLocalSearchParams<{
    bookingSuccess?: string;
  }>();
  const [showSuccessBanner, setShowSuccessBanner] = useState(
    bookingSuccess === "true"
  );
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const profileQuery = useQuery(orpc.getPatientProfile.queryOptions());

  const sessionsQuery = useQuery(orpc.listPatientSessions.queryOptions());

  const sessions = sessionsQuery.data?.sessions ?? [];
  const hasProfile = profileQuery.data?.isOnboardingComplete ?? false;

  const filteredSessions = useMemo(() => {
    if (selectedFilter === "all") {
      return sessions;
    }
    return sessions.filter((s) => s.status === selectedFilter);
  }, [sessions, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / perPage));
  const paginatedSessions = filteredSessions.slice(
    (page - 1) * perPage,
    page * perPage
  );
  const hasMore = page < totalPages;
  const hasPrev = page > 1;

  const toggleFilter = useCallback((value: string) => {
    setSelectedFilter(value);
    setPage(1);
  }, []);

  const handleJoinSession = useCallback(
    (id: string) => {
      router.push(`/appointments/${id}`);
    },
    [router]
  );

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

      <Screen contentClassName="gap-6 px-page py-page pb-40">
        <View className="gap-3">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            Appointments
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Your booked sessions with doctors.
          </Text>
        </View>

        {showSuccessBanner ? (
          <Animated.View
            className="flex-row items-start gap-3 rounded-xl border-2 border-success bg-success/10 px-4 py-3"
            entering={FadeInDown.duration(400)}
            exiting={FadeOutUp.duration(200)}
            layout={LinearTransition}
          >
            <View className="mt-0.5 rounded-full bg-success p-1">
              <Check color="#ffffff" size={14} />
            </View>
            <View className="flex-1">
              <Text className="font-bold font-sans text-sm text-success-foreground">
                Request sent
              </Text>
              <Text className="font-sans text-success-foreground/80 text-xs">
                Your booking request has been sent. The doctor will review it.
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
          </Animated.View>
        ) : null}

        {filteredSessions.length === 0 ? (
          <View className="gap-4">
            <Card className="gap-3">
              <Calendar color={colors.foreground} size={24} />
              <Text className="font-bold font-sans text-base text-foreground">
                {sessions.length === 0
                  ? "No appointments yet"
                  : "No matching appointments"}
              </Text>
              <Text className="font-medium font-sans text-muted-foreground text-sm">
                {sessions.length === 0
                  ? "Book a session with a doctor to see your appointments here."
                  : "Try changing your filter to see more appointments."}
              </Text>
            </Card>
            {sessions.length === 0 && (
              <Button
                className="w-full"
                href="/doctors"
                icon={<Stethoscope color="#ffffff" size={16} />}
                variant="primary"
              >
                Go to Doctors
              </Button>
            )}
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-4">
              {paginatedSessions.map((session, index) => {
                const startAt = new Date(session.startAt);
                const endAt = new Date(session.endAt);
                const dateLabel = startAt.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                const timeLabel = `${startAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${endAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

                return (
                  <Animated.View
                    entering={FadeInDown.duration(300).delay(index * 100)}
                    key={session.id}
                  >
                    <Card className="gap-3">
                      <View className="flex-row items-center justify-between">
                        <Pressable
                          className="flex-1 flex-row items-center gap-2"
                          onPress={() =>
                            router.push(`/doctors/${session.doctorId}`)
                          }
                        >
                          <User color={colors.foreground} size={16} />
                          <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide underline decoration-dotted underline-offset-2">
                            {session.doctor?.displayName ?? "Session"}
                          </Text>
                        </Pressable>
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
                      </View>
                    ) : null}

                    <SessionJoinButton
                      endAt={session.endAt}
                      onJoin={handleJoinSession}
                      role={userRole}
                      sessionId={session.id}
                      startAt={session.startAt}
                      status={session.status}
                    />
                  </Card>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </Screen>
      <ScreenBottomBar>
        <View className="flex-row gap-2">
          <IconButton
            disabled={!hasPrev}
            icon={ChevronLeft}
            iconSize={18}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
            strokeWidth={2.5}
          />
          <IconButton
            disabled={!hasMore}
            icon={ChevronRight}
            iconSize={18}
            onPress={() => setPage((current) => current + 1)}
            strokeWidth={2.5}
          />
        </View>

        <View className="flex-1 flex-row gap-1.5">
          {[
            { icon: List, label: "All", value: "all" },
            { icon: Clock, label: "Requested", value: "requested" },
            { icon: Check, label: "Approved", value: "approved" },
            { icon: Calendar, label: "Attended", value: "attended" },
          ].map(({ icon: Icon, label, value }) => {
            const isActive = selectedFilter === value;
            return (
              <Pressable
                accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}
                className={`flex-1 items-center h-12 justify-center self-stretch rounded-control border-2 ${isActive ? "border-orange-500 bg-orange-500" : "border-border bg-background"}`}
                key={value}
                onPress={() => toggleFilter(value)}
                style={({ pressed }) => [
                  {
                    opacity: pressed && !isActive ? 0.7 : 1,
                    transform: pressed && !isActive ? [{ scale: 0.96 }] : [{ scale: 1 }],
                  },
                ]}
              >
                <Icon color={isActive ? "#ffffff" : "#f97316"} size={16} />
                {!isSmall && (
                  <Text
                    className="text-center font-bold font-sans text-[10px] uppercase tracking-[0.12em]"
                    numberOfLines={1}
                    style={{ color: isActive ? "#ffffff" : "#f97316" }}
                  >
                    {label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <IconButton
          icon={ArrowLeft}
          iconSize={18}
          onPress={() => {
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

function SessionJoinButton({
  endAt,
  onJoin,
  role,
  sessionId,
  startAt,
  status,
}: {
  endAt: string;
  onJoin: (id: string) => void;
  role: "patient" | "doctor" | "admin";
  sessionId: string;
  startAt: string;
  status: string;
}) {
  const colors = useThemeColor();
  const timing = useSessionTiming(startAt, endAt, role);

  if (status === "approved" && timing.canJoin) {
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
