"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import {
  Calendar,
  ChevronLeft,
  Clock,
  ListRestart,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import { Screen } from "@/components/design/ui/screen";

import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { orpc } from "@/utils/orpc";

const sessionStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  requested: {
    label: "Requested",
    bg: "bg-amber-500/15",
    text: "text-amber-600",
  },
  rescheduled: {
    label: "Rescheduled",
    bg: "bg-blue-500/15",
    text: "text-blue-600",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600",
  },
  attended: {
    label: "Attended",
    bg: "bg-primary/15",
    text: "text-primary",
  },
  timing_balance_failure: {
    label: "Failed",
    bg: "bg-red-500/15",
    text: "text-red-600",
  },
};

const STATUS_OPTIONS = Object.entries(sessionStatusConfig).map(
  ([value, config]) => ({ value, label: config.label })
);

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getRelativeTime(date: Date): { label: string; urgent: boolean } {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 0) return { label: "Past", urgent: false };
  if (diffMins < 60) return { label: `in ${diffMins}m`, urgent: diffMins < 15 };
  if (diffHours < 24) return { label: `in ${diffHours}h`, urgent: diffHours < 2 };
  if (diffDays === 1) return { label: "Tomorrow", urgent: false };
  if (diffDays < 7) return { label: `in ${diffDays} days`, urgent: false };
  return { label: formatDate(date), urgent: false };
}

function NextAppointmentCard({
  session,
  onPress,
}: {
  session: {
    id: string;
    doctorId: string;
    startAt: string;
    endAt: string;
    status: string;
    doctor: { displayName: string | null; headline: string | null } | null;
    portrait: { fileKey: string | null; thumbnailKey: string | null } | null;
    plan: { name: string; durationMinutes: number } | null;
  };
  onPress: () => void;
}) {
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(session.portrait ?? null);
  const startDate = new Date(session.startAt);
  const endDate = new Date(session.endAt);
  const { label: relativeTime, urgent } = getRelativeTime(startDate);

  return (
    <Pressable
      className={`overflow-hidden rounded-3xl border bg-background-elevated shadow-md ${urgent ? "border-accent" : "border-border"}`}
      onPress={onPress}
    >
      <View className={`absolute inset-0 ${urgent ? "bg-accent/5" : "bg-primary/5"}`} />
      <View className="relative p-lg">
        <View className="mb-md flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${urgent ? "bg-accent animate-pulse" : "bg-primary"}`} />
            <Text className="font-sans text-micro text-foreground-muted uppercase tracking-widest">
              Next Appointment
            </Text>
          </View>
          <Text className={`font-sans text-micro font-semibold ${urgent ? "text-accent" : "text-primary"}`}>
            {relativeTime}
          </Text>
        </View>

        <View className="flex-row gap-lg">
          <View className={`h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border/50 ${portraitPreviewUrl ? "bg-background-subtle" : "bg-tint-purple"}`}>
            {portraitPreviewUrl ? (
              <Image
                className="h-full w-full"
                resizeMode="cover"
                source={{ uri: portraitPreviewUrl }}
              />
            ) : (
              <Stethoscope className="text-tint-purple-foreground" size={20} />
            )}
          </View>

          <View className="flex-1 gap-1">
            <Text
              className="font-serif text-title text-foreground"
              numberOfLines={1}
            >
              {session.doctor?.displayName ?? "Clinician"}
            </Text>
            {session.doctor?.headline ? (
              <Text
                className="font-sans text-caption text-foreground-muted"
                numberOfLines={1}
              >
                {session.doctor.headline}
              </Text>
            ) : null}
            <View className="mt-1 flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Calendar className="text-foreground-muted" size={13} />
                <Text className="font-sans text-micro text-foreground-muted">
                  {formatDate(startDate)}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock className="text-foreground-muted" size={12} />
              <Text className="font-sans text-micro text-foreground-muted">
                From {formatTime(startDate)} to {formatTime(endDate)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function AppointmentCard({
  session,
  onPress,
  disabled = false,
}: {
  session: {
    id: string;
    doctorId: string;
    startAt: string;
    endAt: string;
    status: string;
    doctor: { displayName: string | null; headline: string | null } | null;
    portrait: { fileKey: string | null; thumbnailKey: string | null } | null;
    plan: { name: string; durationMinutes: number } | null;
  };
  onPress: () => void;
  disabled?: boolean;
}) {
  const statusStyle = sessionStatusConfig[session.status] ?? {
    label: session.status,
    bg: "bg-muted/20",
    text: "text-foreground-muted",
  };
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(session.portrait ?? null);
  const startDate = new Date(session.startAt);
  const endDate = new Date(session.endAt);

  return (
    <Pressable
      className={`overflow-hidden rounded-3xl border bg-background-elevated shadow-sm ${disabled ? "border-border/50 opacity-60" : "border-border"}`}
      onPress={disabled ? undefined : onPress}
    >
      <View className="flex-row gap-lg p-lg">
        <View
          className={`h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border/50 ${portraitPreviewUrl ? "bg-background-subtle" : "bg-tint-purple"}`}
        >
          {portraitPreviewUrl ? (
            <Image
              className="h-full w-full"
              resizeMode="cover"
              source={{ uri: portraitPreviewUrl }}
            />
          ) : (
            <Stethoscope className="text-tint-purple-foreground" size={20} />
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="flex-1 font-serif text-subtitle text-foreground"
              numberOfLines={1}
            >
              {session.doctor?.displayName ?? "Clinician"}
            </Text>
            <View
              className={`rounded-full px-2.5 py-0.5 ${statusStyle.bg}`}
            >
              <Text
                className={`font-sans text-micro font-semibold ${statusStyle.text}`}
              >
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {session.doctor?.headline ? (
            <Text
              className="font-sans text-micro text-foreground-muted"
              numberOfLines={1}
            >
              {session.doctor.headline}
            </Text>
          ) : null}

          <View className="mt-1 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Calendar className="text-foreground-muted" size={12} />
              <Text className="font-sans text-micro text-foreground-muted">
                {formatDate(startDate)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock className="text-foreground-muted" size={12} />
              <Text className="font-sans text-micro text-foreground-muted">
                {formatTime(startDate)}
              </Text>
            </View>
          </View>

          {session.plan ? (
            <View className="mt-1 flex-row items-center gap-1.5">
              <Sparkles className="text-accent" size={12} />
              <Text className="font-sans text-micro text-accent">
                {session.plan.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingChips, setPendingChips] = useState<string[]>([]);

  const sessionsQuery = useQuery(orpc.listPatientSessions.queryOptions());

  const sessions = sessionsQuery.data?.sessions ?? [];

  const combinedFilter = selectedChips.length > 0 ? selectedChips : ["all"];

  const filteredSessions = useMemo(() => {
    if (combinedFilter.includes("all")) {
      return sessions;
    }
    return sessions.filter((s) => combinedFilter.includes(s.status));
  }, [sessions, combinedFilter]);

  const { upcoming, past, nextSession } = useMemo(() => {
    const now = new Date();
    const up: typeof sessions = [];
    const pa: typeof sessions = [];
    for (const s of filteredSessions) {
      if (new Date(s.startAt) >= now) {
        up.push(s);
      } else {
        pa.push(s);
      }
    }
    up.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    pa.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    return { upcoming: up, past: pa, nextSession: up[0] ?? null };
  }, [filteredSessions]);

  if (sessionsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#2d3e35" size="large" />
      </View>
    );
  }

  function toggleChip(value: string) {
    setSelectedChips((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  }

  function openFilters() {
    setPendingChips([...selectedChips]);
    setFilterOpen(true);
  }

  function togglePending(value: string) {
    setPendingChips((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  }

  function applyFilters() {
    setSelectedChips(pendingChips);
    setFilterOpen(false);
  }

  function clearAllFilters() {
    setSelectedChips([]);
    setPendingChips([]);
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false, title: getScreenTitle("native:patient:appointments:index") }} />
      <Screen
        contentClassName="flex-1 gap-xl pt-12 px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="mt-sm">
          <Text className="font-serif text-hero text-primary leading-tight">
            Appointments
          </Text>
          <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
            History
          </Text>
        </View>

          {/* Filter Row */}
          <View className="flex-row items-center justify-between border-border border-b pb-xxs">
            <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
              {sessionsQuery.isPending
                ? "Loading..."
                : `${filteredSessions.length} appointment${filteredSessions.length === 1 ? "" : "s"}`}
            </Text>
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
              onPress={openFilters}
            >
              <SlidersHorizontal className="text-foreground" size={16} />
            </Pressable>
          </View>

          {/* Active Filter Chips */}
          {selectedChips.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {selectedChips.map((chip) => (
                <Pressable
                  className="flex-row items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1.5"
                  key={chip}
                  onPress={() => toggleChip(chip)}
                >
                  <Text className="font-sans text-caption text-primary">
                    {sessionStatusConfig[chip]?.label ?? chip}
                  </Text>
                  <X className="text-primary" size={14} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Next Appointment */}
          {nextSession && (
            <NextAppointmentCard
              session={nextSession}
              onPress={() => router.push(`/appointments/${nextSession.id}`)}
            />
          )}

          {/* Upcoming */}
          {upcoming.length > 1 && (
            <View className="gap-3">
              <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
                Upcoming
              </Text>
              <View className="gap-md">
                {upcoming.slice(1).map((session) => (
                  <AppointmentCard
                    key={session.id}
                    session={session}
                    onPress={() => router.push(`/appointments/${session.id}`)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Past */}
          {past.length > 0 && (
            <View className="gap-3">
              <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
                Past
              </Text>
              <View className="gap-md">
                {past.map((session) => (
                  <AppointmentCard
                    key={session.id}
                    session={session}
                    onPress={() => router.push(`/appointments/${session.id}`)}
                    disabled
                  />
                ))}
              </View>
            </View>
          )}

          {/* Empty state */}
          {filteredSessions.length === 0 && (
            <View className="items-center gap-md py-huge">
              <Text className="font-serif text-foreground-muted text-title">
                No appointments
              </Text>
              <Text className="text-center font-sans text-foreground-muted text-sm">
                Try adjusting your filters
              </Text>
              {selectedChips.length > 0 && (
                <Pressable onPress={clearAllFilters}>
                  <Text className="font-bold font-sans text-accent text-body">
                    Clear filters
                  </Text>
                </Pressable>
              )}
            </View>
          )}
      </Screen>

      <ScreenBottomBar
        returnAction={{
          href: "/(patient)",
          icon: <ChevronLeft className="text-foreground" size={24} />,
        }}
      />

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
        statusBarTranslucent
        transparent
        visible={filterOpen}
      >
          <View className="flex-1 justify-end bg-black/50">
            <View className="max-h-[80%] rounded-t-3xl border-2 border-border bg-background pb-8">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between border-border border-b px-6 py-4">
                <Text className="font-serif text-foreground text-title">
                  Filters
                </Text>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
                  onPress={() => setFilterOpen(false)}
                >
                  <X className="text-foreground-muted" size={18} />
                </Pressable>
              </View>

              <ScrollView
                className="px-6 pt-4"
                showsVerticalScrollIndicator={false}
              >
                <View className="gap-6">
                  {/* Clear All */}
                  {pendingChips.length > 0 && (
                    <Pressable
                      className="flex-row items-center gap-2"
                      onPress={() => setPendingChips([])}
                    >
                      <ListRestart className="text-accent" size={16} />
                      <Text className="font-sans font-semibold text-accent text-body">
                        Clear all filters
                      </Text>
                    </Pressable>
                  )}

                  <View className="gap-3">
                    <Text className="font-sans font-semibold text-foreground text-subtitle">
                      Status
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {STATUS_OPTIONS.map((opt) => {
                        const active = pendingChips.includes(opt.value);
                        return (
                          <Pressable
                            className={`rounded-full border px-4 py-2 ${active ? "border-primary bg-primary" : "border-border bg-background-elevated"}`}
                            key={opt.value}
                            onPress={() => togglePending(opt.value)}
                          >
                            <Text
                              className={`font-sans text-caption ${active ? "text-primary-foreground" : "text-foreground-secondary"}`}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View className="h-4" />
                </View>
              </ScrollView>

              {/* Apply Button */}
              <View className="border-border border-t px-6 pt-4">
                <Pressable
                  className="items-center rounded-full bg-primary py-3.5"
                  onPress={applyFilters}
                >
                  <Text className="font-bold font-sans text-body text-primary-foreground">
                    Show Results
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
      </Modal>
    </View>
  );
}
