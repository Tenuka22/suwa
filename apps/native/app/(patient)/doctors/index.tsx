"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  ListRestart,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Stethoscope,
  User,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/design/ui/card";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { ScreenTabBar } from "@/components/design/ui/screen-tab-bar";
import {
  consultationModeLabels,
  focusAreaLabels,
  languageLabels,
  specialtyLabels,
} from "@/utils/doctor-profile";
import { orpc } from "@/utils/orpc";

const SPECIALTY_OPTIONS = Object.entries(specialtyLabels).map(
  ([value, label]) => ({ value, label })
);
const LANGUAGE_OPTIONS = Object.entries(languageLabels).map(
  ([value, label]) => ({ value, label })
);
const MODE_OPTIONS = Object.entries(consultationModeLabels).map(
  ([value, label]) => ({ value, label })
);
const FOCUS_OPTIONS = Object.entries(focusAreaLabels).map(([value, label]) => ({
  value,
  label,
}));

interface FilterSection {
  key: string;
  options: { value: string; label: string }[];
  title: string;
}

const FILTER_SECTIONS: FilterSection[] = [
  { key: "specialty", title: "Specialty", options: SPECIALTY_OPTIONS },
  { key: "language", title: "Language", options: LANGUAGE_OPTIONS },
  { key: "mode", title: "Consultation", options: MODE_OPTIONS },
  { key: "focus", title: "Focus Area", options: FOCUS_OPTIONS },
];

const chipLabel = (value: string) =>
  specialtyLabels[value] ??
  languageLabels[value] ??
  consultationModeLabels[value] ??
  focusAreaLabels[value] ??
  value;

export default function DoctorsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingChips, setPendingChips] = useState<string[]>([]);
  const pageSize = 6;

  const combinedSearch = [search, ...selectedChips].filter(Boolean).join(" ");

  const doctorsQuery = useQuery(
    orpc.listDoctors.queryOptions({
      input: { page, pageSize, search: combinedSearch },
    })
  );

  const doctors = doctorsQuery.data?.doctors ?? [];
  const hasMore = doctorsQuery.data?.hasMore ?? false;
  const totalDoctors = doctorsQuery.data?.total ?? 0;
  const _activeFilterCount = selectedChips.length;

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
    setSearch("");
    setPage(1);
  }

  function renderDoctorList() {
    if (doctorsQuery.isPending) {
      return (
        <View className="items-center py-huge">
          <ActivityIndicator color="#2d3e35" />
        </View>
      );
    }

    if (doctors.length === 0) {
      return (
        <View className="items-center gap-md py-huge">
          <Text className="font-serif text-foreground-muted text-title">
            No clinicians found
          </Text>
          <Text className="text-center font-sans text-foreground-muted text-sm">
            Try adjusting your search or filters
          </Text>
          <Pressable onPress={clearAllFilters}>
            <Text className="font-bold font-sans text-accent text-body">
              Clear all filters
            </Text>
          </Pressable>
        </View>
      );
    }

    return doctors.map((doc) => (
      <Card
        description={doc.profile.headline ?? "Licensed medical practitioner"}
        icon={<Stethoscope className="text-tint-green-foreground" size={24} />}
        iconBgColor="bg-tint-green"
        key={doc.profile.userId}
        onPress={() => router.push(`/doctors/${doc.profile.userId}`)}
        title={doc.profile.displayName ?? "Clinician"}
      />
    ));
  }

  return (
    <ScreenTabBar
      tabs={[
        {
          icon: <Home className="text-foreground" size={20} />,
          label: "Home",
          onPress: () => router.push("/(patient)"),
        },
        {
          active: true,
          icon: <MessageCircle className="text-primary-foreground" size={20} />,
          label: "Doctors",
          onPress: () => router.push("/(patient)/doctors"),
        },
        {
          icon: <BookOpen className="text-foreground" size={20} />,
          label: "Health",
          onPress: () => router.push("/(patient)/health-hub"),
        },
        {
          icon: <User className="text-foreground" size={20} />,
          label: "Profile",
          onPress: () => router.push("/(patient)/profile"),
        },
      ]}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />

        <Screen
          contentClassName="flex-1 gap-xl pt-12 px-lg bg-background"
          scrollClassName="flex-1 bg-background"
        >
          {/* Header */}
          <View>
            <Text className="font-serif text-hero text-primary leading-tight">
              Clinicians
            </Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
              Private Care
            </Text>
          </View>

          {/* Search Bar */}
          <Input
            className="bg-transparent"
            inputContainerClassName="rounded-full border-0 shadow-sm bg-background-elevated"
            leftIcon={
              <Search className="text-foreground-placeholder" size={20} />
            }
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            placeholder="Search by name or specialty..."
            value={search}
          />

          {/* Results Info */}
          <View className="flex-row items-center justify-between border-border border-b pb-xxs">
            <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
              {doctorsQuery.isPending
                ? "Loading..."
                : `${totalDoctors} clinician${totalDoctors === 1 ? "" : "s"} found`}
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
                    {chipLabel(chip)}
                  </Text>
                  <X className="text-primary" size={14} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Doctor List */}
          <View className="gap-lg">{renderDoctorList()}</View>

          {/* Pagination */}
          {doctors.length > 0 && (
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

        {/* Filter Modal */}
        <Modal
          animationType="slide"
          onRequestClose={() => setFilterOpen(false)}
          statusBarTranslucent
          transparent
          visible={filterOpen}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="max-h-[80%] rounded-t-3xl border-2 border-border bg-background/80 pb-8 backdrop-blur-[2px]">
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

                  {FILTER_SECTIONS.map((section) => (
                    <View className="gap-3" key={section.key}>
                      <Text className="font-sans font-semibold text-foreground text-subtitle">
                        {section.title}
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {section.options.map((opt) => {
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
                  ))}

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
    </ScreenTabBar>
  );
}
