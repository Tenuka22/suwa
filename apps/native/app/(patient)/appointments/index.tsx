"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function AppointmentCard({
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
    portrait: { id: string } | null;
    plan: { name: string; durationMinutes: number } | null;
  };
  onPress: () => void;
}) {
  const statusStyle = sessionStatusConfig[session.status] ?? {
    label: session.status,
    bg: "bg-muted/20",
    text: "text-foreground-muted",
  };
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(
    session.portrait?.id ?? null
  );
  const startDate = new Date(session.startAt);
  const endDate = new Date(session.endAt);

  return (
    <Pressable
      className="overflow-hidden rounded-3xl border border-border bg-background-elevated shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row gap-lg p-lg">
        <View
          className={`h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border/50 ${portraitPreviewUrl ? "bg-background-subtle" : "bg-tint-purple"}`}
        >
          {portraitPreviewUrl ? (
            <Image
              className="h-full w-full"
              resizeMode="cover"
              source={{ uri: portraitPreviewUrl }}
            />
          ) : (
            <Stethoscope className="text-tint-purple-foreground" size={24} />
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="flex-1 font-serif text-title text-foreground"
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
              className="font-sans text-caption text-foreground-muted"
              numberOfLines={1}
            >
              {session.doctor.headline}
            </Text>
          ) : null}

          <View className="mt-1 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Calendar className="text-foreground-muted" size={14} />
              <Text className="font-sans text-micro text-foreground-muted">
                {formatDate(startDate)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock className="text-foreground-muted" size={14} />
              <Text className="font-sans text-micro text-foreground-muted">
                {formatTime(startDate)} - {formatTime(endDate)}
              </Text>
            </View>
          </View>

          {session.plan ? (
            <View className="mt-1 flex-row items-center gap-1.5">
              <Sparkles className="text-accent" size={13} />
              <Text className="font-sans text-micro text-accent">
                {session.plan.name}
                {session.plan.durationMinutes
                  ? ` · ${formatDuration(session.plan.durationMinutes)}`
                  : ""}
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
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingChips, setPendingChips] = useState<string[]>([]);
  const perPage = 5;

  const sessionsQuery = useQuery(orpc.listPatientSessions.queryOptions());

  const sessions = sessionsQuery.data?.sessions ?? [];

  const combinedFilter = selectedChips.length > 0 ? selectedChips : ["all"];

  const filteredSessions = useMemo(() => {
    if (combinedFilter.includes("all")) {
      return sessions;
    }
    return sessions.filter((s) => combinedFilter.includes(s.status));
  }, [sessions, combinedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / perPage));
  const paginatedSessions = filteredSessions.slice(
    (page - 1) * perPage,
    page * perPage
  );
  const hasMore = page < totalPages;

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
    setPage(1);
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
    setPage(1);
    setFilterOpen(false);
  }

  function clearAllFilters() {
    setSelectedChips([]);
    setPendingChips([]);
    setPage(1);
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
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

          {/* Results Info */}
          <View className="flex-row items-center justify-between border-border border-b pb-xxs">
            <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
              {sessionsQuery.isPending
                ? "Loading..."
                : `${filteredSessions.length} appointment${filteredSessions.length === 1 ? "" : "s"}`}
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
                onPress={openFilters}
              >
                <SlidersHorizontal className="text-foreground" size={16} />
              </Pressable>
              <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
                Page {page}
              </Text>
            </View>
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

          {/* Sessions */}
          <View className="gap-lg">
            {paginatedSessions.length === 0 ? (
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
            ) : (
              paginatedSessions.map((session) => (
                <AppointmentCard
                  key={session.id}
                  session={session}
                  onPress={() => router.push(`/appointments/${session.id}`)}
                />
              ))
            )}
          </View>

          {/* Pagination */}
          {totalPages > 1 && (
            <View className="mt-md flex-row items-center justify-center gap-huge">
              <Pressable
                className={`h-12 w-12 items-center justify-center rounded-full border border-border ${page === 1 ? "opacity-30" : "bg-background-elevated shadow-sm"}`}
                disabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="text-primary" size={24} />
              </Pressable>
              <Pressable
                className={`h-12 w-12 items-center justify-center rounded-full border border-border ${hasMore ? "bg-background-elevated shadow-sm" : "opacity-30"}`}
                disabled={!hasMore}
                onPress={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="text-primary" size={24} />
              </Pressable>
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
