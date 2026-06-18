"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Stethoscope,
  Filter,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Card } from "@/components/design/ui/card";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { orpc } from "@/utils/orpc";

export default function DoctorsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [page, setPage] = useState(1);
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

  function toggleChip(value: string) {
    setSelectedChips((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
    setPage(1);
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
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} className="text-primary" />
          </Pressable>
          <View>
            <Text className="font-serif text-hero text-primary leading-tight">
              Clinicians
            </Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
              Private Care
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="Search by name or specialty..."
          inputContainerClassName="rounded-full border-0 shadow-sm bg-background-elevated"
          className="bg-transparent"
          leftIcon={<Search size={20} className="text-foreground-placeholder" />}
          onChangeText={(text) => {
            setSearch(text);
            setPage(1);
          }}
          value={search}
        />

        {/* Filters */}
        <View className="flex-row gap-sm overflow-hidden">
          <FilterItem 
            active={selectedChips.includes("license")} 
            label="License" 
            onPress={() => toggleChip("license")} 
          />
          <FilterItem 
            active={selectedChips.includes("video")} 
            label="Video" 
            onPress={() => toggleChip("video")} 
          />
          <FilterItem 
            active={selectedChips.includes("english")} 
            label="English" 
            onPress={() => toggleChip("english")} 
          />
        </View>

        {/* Results Info */}
        <View className="flex-row items-center justify-between border-b border-border pb-xxs">
          <Text className="font-sans text-micro text-foreground-muted uppercase tracking-widest">
            {doctorsQuery.isPending
              ? "Loading..."
              : `${totalDoctors} clinicians found`}
          </Text>
          <Text className="font-sans text-micro text-foreground-muted uppercase tracking-widest">
            Page {page}
          </Text>
        </View>

        {/* Doctor List */}
        <View className="gap-lg">
          {doctorsQuery.isPending ? (
            <View className="py-huge items-center">
              <ActivityIndicator color="#2d3e35" />
            </View>
          ) : doctors.length === 0 ? (
            <View className="py-huge items-center gap-md">
              <Text className="font-serif text-title text-foreground-muted">No clinicians found</Text>
              <Pressable onPress={() => { setSearch(""); setSelectedChips([]); setPage(1); }}>
                <Text className="font-sans text-body text-accent font-bold">Clear Filters</Text>
              </Pressable>
            </View>
          ) : (
            doctors.map((doc) => (
              <Card
                key={doc.profile.userId}
                title={doc.profile.displayName ?? "Clinician"}
                description={doc.profile.headline ?? "Licensed medical practitioner"}
                icon={<Stethoscope size={24} className="text-tint-green-foreground" />}
                iconBgColor="bg-tint-green"
                onPress={() => router.push(`/doctors/${doc.profile.userId}`)}
              />
            ))
          )}
        </View>

        {/* Pagination */}
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
      </Screen>
    </View>
  );
}

function FilterItem({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
