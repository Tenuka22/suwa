import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  BriefcaseMedical,
  ChevronLeft,
  ChevronRight,
  Circle,
  GraduationCap,
  MapPin,
  Search,
  Stethoscope,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
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
          <Field
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
                onPress={() => {
                }}
                portrait={portrait}
                profile={profile}
              />
            ))}
        </View>
      </Screen>
      <ScreenBottomBar>
        <View className="flex-row gap-2">
          <Pressable
            className="aspect-square items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
            disabled={page === 1}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft
              color={page > 1 ? colors.foreground : colors.mutedForeground}
              size={18}
              strokeWidth={2.5}
            />
          </Pressable>
          <Pressable
            className="aspect-square items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
            disabled={!hasMore}
            onPress={() => setPage((current) => current + 1)}
          >
            <ChevronRight
              color={hasMore ? colors.foreground : colors.mutedForeground}
              size={18}
              strokeWidth={2.5}
            />
          </Pressable>
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

        <Pressable
          className="aspect-square items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        >
          <ArrowLeft color={colors.foreground} size={18} strokeWidth={2.5} />
        </Pressable>
      </ScreenBottomBar>
    </>
  );
}


interface DoctorCardProps {
  availableSlotCount: number;
  onPress: () => void;
  portrait: { id: string | null } | null;
  profile: {
    userId: string;
    displayName?: string | null;
    location?: string | null;
    headline?: string | null;
    bio?: string | null;
    specialties?: string[];
    consultationModes?: string[];
    languages?: string[];
    focusAreas?: string[];
    licenseNumber?: string | null;
    experienceStartYear?: number | null;
  };
}

function DoctorCard({
  profile,
  portrait,
  availableSlotCount,
  onPress,
}: DoctorCardProps) {
  const colors = useThemeColor();
  const previewUrl = useDoctorMaterialPreviewUrl(portrait?.id ?? null);

  const experienceYears = useMemo(() => {
    if (!profile.experienceStartYear) {
      return null;
    }
    return Math.max(0, new Date().getFullYear() - profile.experienceStartYear);
  }, [profile.experienceStartYear]);

  return (
    <Card
      className="gap-section"
      href={`/doctors/${profile.userId}`}
      onPress={onPress}
    >
      
      <View className="flex-row items-start gap-4">
        
        <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-muted">
          {previewUrl ? (
            <Image
              className="h-full w-full"
              source={{ uri: previewUrl }}
              style={{ resizeMode: "cover" }}
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-secondary">
              <Stethoscope
                color={colors.mutedForeground}
                size={28}
                strokeWidth={2}
              />
            </View>
          )}
        </View>

        
        <View className="flex-1 justify-center gap-1">
          <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
            {profile.displayName ?? "Clinician"}
          </Text>
          {profile.headline && (
            <Text className="font-medium font-sans text-muted-foreground text-sm leading-snug">
              {profile.headline}
            </Text>
          )}
          {profile.location && (
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <MapPin
                color={colors.mutedForeground}
                size={14}
                strokeWidth={2.5}
              />
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
                {profile.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      
      {profile.bio && (
        <View className="gap-1.5 rounded-card border border-border/40 bg-secondary/30 p-3">
          <View className="flex-row items-center gap-1.5">
            <Stethoscope
              color={colors.mutedForeground}
              size={14}
              strokeWidth={2.5}
            />
            <Text className="font-black font-sans text-[10px] text-muted-foreground uppercase tracking-widest">
              About
            </Text>
          </View>
          <Text className="font-medium font-sans text-foreground/80 text-sm leading-relaxed">
            {profile.bio}
          </Text>
        </View>
      )}

      
      <View className="flex-row flex-wrap gap-2">
        
        {profile.specialties && profile.specialties.length > 0 && (
          <View className="flex-row items-center gap-1.5 rounded-chip border-2 border-border bg-card px-3 py-1.5">
            <BriefcaseMedical
              color={colors.primary}
              size={14}
              strokeWidth={2.5}
            />
            <Text className="font-black font-sans text-foreground text-xs uppercase tracking-wider">
              {profile.specialties[0]}
            </Text>
          </View>
        )}

        
        {experienceYears !== null && (
          <View className="flex-row items-center gap-1.5 rounded-chip border-2 border-border bg-secondary px-3 py-1.5">
            <GraduationCap
              color={colors.foreground}
              size={14}
              strokeWidth={2.5}
            />
            <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
              {experienceYears} {experienceYears === 1 ? "yr" : "yrs"} exp.
            </Text>
          </View>
        )}

        
        {profile.languages && profile.languages.length > 0 && (
          <View className="flex-row items-center gap-1.5 rounded-chip border border-border/50 bg-card px-3 py-1.5">
            <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
              {profile.languages.slice(0, 3).join(", ")}
            </Text>
          </View>
        )}
      </View>

      
      {profile.focusAreas && profile.focusAreas.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <Circle color={colors.mutedForeground} size={8} strokeWidth={2.5} />
            <Text className="font-black font-sans text-[10px] text-muted-foreground uppercase tracking-widest">
              Focus Areas
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {profile.focusAreas.slice(0, 4).map((area) => (
              <Text
                className="font-bold font-sans text-foreground text-xs uppercase tracking-wider"
                key={area}
              >
                {area}
              </Text>
            ))}
          </View>
        </View>
      )}

      
      <View className="flex-row items-center justify-between border-border/10 border-t pt-3">
        
        <View className="flex-row items-center gap-1.5">
          {availableSlotCount > 0 ? (
            <>
              <View className="h-2 w-2 rounded-full bg-success" />
              <Text className="font-black font-sans text-[10px] text-success uppercase tracking-widest">
                {availableSlotCount} slots open
              </Text>
            </>
          ) : (
            <>
              <View className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <Text className="font-black font-sans text-[10px] text-muted-foreground uppercase tracking-widest">
                Fully booked
              </Text>
            </>
          )}
        </View>

        <Text className="font-black font-sans text-[10px] text-primary uppercase tracking-widest">
          View Profile
        </Text>
      </View>
    </Card>
  );
}
