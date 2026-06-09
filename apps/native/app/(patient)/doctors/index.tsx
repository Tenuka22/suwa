import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  BriefcaseMedical,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Search,
  Stethoscope,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DoctorCard } from "@/components/ui/doctor-card";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function DoctorsScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const combinedSearch = [search, ...selectedChips].filter(Boolean).join(" ");

  const doctorsQuery = useQuery({
    queryKey: ["doctors", page, combinedSearch],
    queryFn: () =>
      orpc.listDoctors.call({ page, pageSize, search: combinedSearch }),
  });

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
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-section px-page py-page pb-40">
        <View className="gap-2 border-border border-b pb-6">
          <View className="flex-row items-center gap-3">
            <View className="rounded-card bg-primary p-card">
              <Stethoscope
                color={colors.primaryForeground}
                size={24}
                strokeWidth={2.5}
              />
            </View>
            <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
              Doctors
            </Text>
          </View>
          <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.15em]">
            Licensed care, private by design.
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label="Search Directory"
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            placeholder="Search name, specialty, language..."
            value={search}
          />
        </View>

        <View className="flex-row items-center justify-between border-border border-b pb-2">
          <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
            {doctorsQuery.isPending
              ? "Loading..."
              : `${totalDoctors} clinician${totalDoctors === 1 ? "" : "s"} found`}
          </Text>
          <Text className="font-sans text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
            Page {page}
          </Text>
        </View>

        <View className="mt-2 gap-4">
          {doctorsQuery.isPending && (
            <Card className="items-center gap-4 p-8">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
                Finding clinicians...
              </Text>
            </Card>
          )}

          {!doctorsQuery.isPending && doctors.length === 0 && (
            <Card className="items-center gap-3 p-8">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Search
                  color={colors.mutedForeground}
                  size={24}
                  strokeWidth={2}
                />
              </View>
              <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
                No Clinicians Found
              </Text>
              <Text className="max-w-[260px] text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
                Try refining your search terms or clearing active filters.
              </Text>
              <Button
                onPress={() => {
                  setSearch("");
                  setSelectedChips([]);
                  setPage(1);
                }}
                size="sm"
                variant="secondary"
              >
                Clear Filters
              </Button>
            </Card>
          )}

          {!doctorsQuery.isPending &&
            doctors.length > 0 &&
            doctors.map(({ profile, portrait, availableSlotCount }) => (
              <DoctorCard
                availableSlotCount={availableSlotCount}
                key={profile.userId}
                onPress={() => {}}
                portrait={portrait}
                profile={profile}
              />
            ))}
        </View>
      </Screen>
      <ScreenBottomBar>
        <View className="flex-row gap-2">
          <IconButton
            disabled={page === 1}
            icon={ChevronLeft}
            iconSize={18}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          />
          <IconButton
            disabled={!hasMore}
            icon={ChevronRight}
            iconSize={18}
            onPress={() => setPage((current) => current + 1)}
          />
        </View>

        {[
          { icon: Stethoscope, label: "License", value: "license" },
          { icon: BriefcaseMedical, label: "Video", value: "video" },
          { icon: MapPin, label: "In person", value: "in_person" },
          { icon: GraduationCap, label: "English", value: "english" },
        ].map(({ icon: Icon, label, value }) => {
          const isActive = selectedChips.includes(value);
          return (
            <Pressable
              accessibilityLabel={label}
              className={`h-12 flex-1 items-center justify-center self-stretch rounded-control border-2 border-border ${isActive ? "bg-orange-500" : "bg-background"}`}
              key={value}
              onPress={() => toggleChip(value)}
            >
              <Icon color={isActive ? "#ffffff" : "#f97316"} size={14} />
              <Text
                className={`hidden text-center font-bold font-sans text-[10px] uppercase tracking-[0.12em] sm:flex ${isActive ? "text-white" : "text-orange-500"}`}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}

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
