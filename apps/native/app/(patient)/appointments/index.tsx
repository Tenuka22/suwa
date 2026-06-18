"use client";

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

import { Card } from "@/components/design/ui/card";
import { Screen } from "@/components/design/ui/screen";
import { orpc } from "@/utils/orpc";

export default function AppointmentsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const profileQuery = useQuery(orpc.getPatientProfile.queryOptions());
  const sessionsQuery = useQuery(orpc.listPatientSessions.queryOptions());

  const sessions = sessionsQuery.data?.sessions ?? [];
  const hasProfile = profileQuery.data?.isOnboardingComplete ?? false;

  const filteredSessions = useMemo(() => {
    if (selectedFilter === "all") return sessions;
    return sessions.filter((s) => s.status === selectedFilter);
  }, [sessions, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / perPage));
  const paginatedSessions = filteredSessions.slice((page - 1) * perPage, page * perPage);
  const hasMore = page < totalPages;

  if (profileQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#2d3e35" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="flex-1 gap-xl pb-32 pt-lg px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center gap-md mt-sm">
          <Pressable
            onPress={() => router.replace("/(patient)")}
            className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} className="text-primary" />
          </Pressable>
          <View>
            <Text className="font-serif text-hero text-primary leading-tight">Appointments</Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">History</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-sm py-xxs overflow-hidden">
          <FilterTab active={selectedFilter === "all"} label="All" onPress={() => setSelectedFilter("all")} />
          <FilterTab active={selectedFilter === "requested"} label="Requested" onPress={() => setSelectedFilter("requested")} />
          <FilterTab active={selectedFilter === "approved"} label="Approved" onPress={() => setSelectedFilter("approved")} />
          <FilterTab active={selectedFilter === "attended"} label="Attended" onPress={() => setSelectedFilter("attended")} />
        </ScrollView>

        {/* Sessions */}
        <View className="gap-lg">
          {paginatedSessions.length === 0 ? (
            <View className="py-huge items-center gap-md">
              <Text className="font-serif text-title text-foreground-muted">No appointments</Text>
              <Pressable onPress={() => router.push("/doctors")}>
                <Text className="font-sans text-body text-accent font-bold">Find a Doctor</Text>
              </Pressable>
            </View>
          ) : (
            paginatedSessions.map((session) => (
              <Card
                key={session.id}
                title={`Dr. ${session.doctorId.slice(0, 8)}`}
                description={`${new Date(session.startAt).toLocaleDateString()} at ${new Date(session.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                icon={<Calendar size={24} className="text-tint-purple-foreground" />}
                iconBgColor="bg-tint-purple"
                onPress={() => router.push(`/appointments/${session.id}`)}
              />
            ))
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View className="flex-row justify-center items-center gap-huge mt-md">
            <Pressable 
              disabled={page === 1} 
              onPress={() => setPage(p => Math.max(1, p - 1))}
              className={`h-12 w-12 rounded-full items-center justify-center border border-border ${page === 1 ? 'opacity-30' : 'bg-background-elevated shadow-sm'}`}
            >
              <ChevronLeft size={24} className="text-primary" />
            </Pressable>
            <Pressable 
              disabled={!hasMore} 
              onPress={() => setPage(p => p + 1)}
              className={`h-12 w-12 rounded-full items-center justify-center border border-border ${!hasMore ? 'opacity-30' : 'bg-background-elevated shadow-sm'}`}
            >
              <ChevronRight size={24} className="text-primary" />
            </Pressable>
          </View>
        )}
      </Screen>
    </View>
  );
}

function FilterTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-lg py-sm rounded-full border ${active ? "bg-primary border-primary" : "bg-background-elevated border-border"}`}
    >
      <Text className={`font-sans text-caption font-semibold ${active ? "text-primary-foreground" : "text-foreground-secondary"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
