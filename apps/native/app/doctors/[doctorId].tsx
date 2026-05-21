import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building,
  Camera,
  Clock,
  FileText,
  Languages,
  MapPin,
  School2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import {
  capitalizeWords,
  consultationModeLabels,
  focusAreaLabels,
  getYearsOfExperience,
  languageLabels,
  specialtyLabels,
} from "@/utils/doctor-profile";
import { orpc } from "@/utils/orpc";

interface DoctorProfileView {
  approach: string | null;
  approachSteps: { id: string; text: string }[];
  bio: string | null;
  consultationModes: string[];
  createdAt: string;
  displayName: string | null;
  education: string | null;
  experienceStartYear: number | null;
  focusAreas: string[];
  headline: string | null;
  languages: string[];
  licenseNumber: string | null;
  location: string | null;
  placeAddress: string | null;
  placeDescription: string | null;
  placeName: string | null;
  specialties: string[];
  stripeAccountEnabled: boolean | null;
  permanent?: boolean;
}

interface DoctorEducationView {
  degree: string;
  id: string;
  institution: string;
  year: number | null;
}

function Tag({
  label,
  color,
}: {
  label: string;
  color: { bg: string; text: string; border: string };
}) {
  return (
    <View
      className={`rounded-full border px-3 py-1 ${color.bg} ${color.border}`}
    >
      <Text className={`font-bold text-xs ${color.text}`}>{label}</Text>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View className="mb-3 flex-row items-center gap-2">
      {icon}
      <Text className="font-black text-foreground text-lg uppercase tracking-tight">
        {title}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </Text>
        <Text className="font-semibold text-foreground/80 text-sm">
          {value}
        </Text>
      </View>
    </View>
  );
}

function TagSection({
  icon,
  label,
  values,
  labels,
  color,
}: {
  icon: ReactNode;
  label: string;
  values: string[];
  labels: Record<string, string>;
  color: { bg: string; text: string; border: string };
}) {
  return (
    <View className="gap-2">
      <Text className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {values.length > 0 ? (
          values.map((value) => (
            <Tag
              color={color}
              key={value}
              label={labels[value] ?? capitalizeWords(value)}
            />
          ))
        ) : (
          <Text className="font-medium text-muted-foreground text-xs italic">
            Not configured
          </Text>
        )}
      </View>
    </View>
  );
}

export default function DoctorProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#fafafa" : "#09090b";
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;

  const doctorQuery = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => orpc.getDoctor.call({ doctorId: id ?? "" }),
    enabled: !!id,
  });

  const profile = doctorQuery.data?.profile;
  const files = doctorQuery.data?.files ?? [];
  const education = doctorQuery.data?.education ?? [];
  const portraitId = doctorQuery.data?.portrait?.id ?? null;
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(portraitId);
  const yearsOfExperience = useMemo(
    () => getYearsOfExperience(profile?.experienceStartYear ?? null),
    [profile?.experienceStartYear]
  );

  const displayName =
    profile?.displayName ?? profile?.licenseNumber ?? "Doctor";
  const initials = displayName.slice(0, 2).toUpperCase();

  const tagColors = useMemo(
    () => ({
      primary: {
        bg: isDark ? "bg-primary/10" : "bg-primary/10",
        text: "text-primary",
        border: isDark ? "border-primary/20" : "border-primary/20",
      },
      secondary: {
        bg: isDark ? "bg-secondary/20" : "bg-secondary/20",
        text: "text-secondary-foreground",
        border: "border-border",
      },
      muted: {
        bg: isDark ? "bg-muted/30" : "bg-muted/20",
        text: "text-muted-foreground",
        border: "border-border",
      },
      accent: {
        bg: isDark ? "bg-accent/20" : "bg-accent/10",
        text: "text-accent-foreground",
        border: "border-border",
      },
    }),
    [isDark]
  );

  if (doctorQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center px-page py-page">
          <ActivityIndicator size="large" />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="flex-row items-center justify-between">
          <Button
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            size="sm"
            variant="secondary"
          >
            <View className="flex-row items-center gap-2">
              <ArrowLeft color={iconColor} size={16} />
              <Text className="font-bold font-sans text-foreground text-sm">
                Back
              </Text>
            </View>
          </Button>
        </View>

        {profile ? (
          <>
            {/* Profile Header Card */}
            <Card className="gap-4">
              <View className="flex-row items-center gap-4">
                {portraitPreviewUrl ? (
                  <Image
                    className="h-16 w-16 rounded-2xl border-2 border-primary/20"
                    source={{ uri: portraitPreviewUrl }}
                  />
                ) : (
                  <View className="h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/10">
                    <Text className="font-bold text-lg text-primary">
                      {initials}
                    </Text>
                  </View>
                )}

                <View className="flex-1 gap-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="font-bold text-foreground text-xl">
                      {displayName}
                    </Text>
                    <View
                      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-0.5 ${
                        profile.permanent
                          ? "border border-emerald-500/20 bg-emerald-500/10"
                          : "border border-amber-500/20 bg-amber-500/10"
                      }`}
                    >
                      <View
                        className={`h-1.5 w-1.5 rounded-full ${
                          profile.permanent ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      <Text
                        className={`font-semibold text-xs ${
                          profile.permanent
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {profile.permanent ? "Approved" : "Pending"}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-sm">
                    {profile.headline ?? "No professional headline set yet"}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {profile.location ? (
                  <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                    <MapPin color={iconColor} size={12} />
                    <Text className="font-bold text-[10px] text-foreground uppercase tracking-wide">
                      {profile.location}
                    </Text>
                  </View>
                ) : null}
                {yearsOfExperience ? (
                  <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                    <Stethoscope color={iconColor} fill={iconColor} size={12} />
                    <Text className="font-bold text-[10px] text-foreground uppercase tracking-wide">
                      {yearsOfExperience}+ years
                    </Text>
                  </View>
                ) : null}
                {profile.stripeAccountEnabled ? (
                  <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                    <ShieldCheck color={iconColor} size={12} />
                    <Text className="font-bold text-[10px] text-foreground uppercase tracking-wide">
                      Verified
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  className="flex-1"
                  onPress={() => setIsFavorite((current) => !current)}
                >
                  {({ pressed }) => (
                    <View
                      className="rounded-2xl border-2 border-border bg-background px-4 py-3"
                      style={{
                        opacity: pressed ? 0.84 : 1,
                        transform: [{ translateY: pressed ? 2 : 0 }],
                      }}
                    >
                      <Text className="text-center font-bold text-foreground text-sm uppercase tracking-wide">
                        {isFavorite ? "Saved" : "Save doctor"}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Button className="flex-1" variant="primary">
                  Book consult
                </Button>
              </View>

              {profile.bio ? (
                <View className="rounded-xl border border-border/30 bg-muted/5 p-4">
                  <Text className="font-medium text-foreground/90 text-sm italic leading-relaxed">
                    "{profile.bio}"
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* Practice Details */}
            <Card className="gap-4">
              <SectionHeader
                icon={<Building color={iconColor} size={18} />}
                title="Practice Details"
              />
              <View className="gap-4 rounded-xl border border-border/50 bg-muted/5 p-4">
                <InfoRow
                  icon={<Clock color={iconColor} size={14} />}
                  label="Experience"
                  value={
                    profile.experienceStartYear
                      ? `${profile.experienceStartYear} onward`
                      : "Not set"
                  }
                />
                <InfoRow
                  icon={<MapPin color={iconColor} size={14} />}
                  label="Location"
                  value={profile.location ?? "Not set"}
                />
                <InfoRow
                  icon={<Building color={iconColor} size={14} />}
                  label="Practice Address"
                  value={profile.placeAddress ?? "Not set"}
                />
              </View>
            </Card>

            {/* Professional Info */}
            <Card className="gap-4">
              <SectionHeader
                icon={<Award color={iconColor} size={18} />}
                title="Professional Info"
              />
              <View className="gap-4 rounded-xl border border-border/50 bg-muted/5 p-4">
                <InfoRow
                  icon={<FileText color={iconColor} size={14} />}
                  label="License Number"
                  value={profile.licenseNumber ?? "Not set"}
                />
                <InfoRow
                  icon={<Building color={iconColor} size={14} />}
                  label="Practice Name"
                  value={profile.placeName ?? "Not set"}
                />
                <InfoRow
                  icon={<FileText color={iconColor} size={14} />}
                  label="Place Description"
                  value={profile.placeDescription ?? "No description added"}
                />
              </View>
            </Card>

            {/* At a Glance - Tags */}
            <Card className="gap-4">
              <SectionHeader
                icon={<Sparkles color={iconColor} size={18} />}
                title="At a glance"
              />
              <View className="gap-4">
                <TagSection
                  color={tagColors.primary}
                  icon={<BookOpen color={iconColor} size={14} />}
                  label="Specialties"
                  labels={specialtyLabels}
                  values={profile.specialties}
                />
                <TagSection
                  color={tagColors.secondary}
                  icon={<Languages color={iconColor} size={14} />}
                  label="Languages"
                  labels={languageLabels}
                  values={profile.languages}
                />
                <TagSection
                  color={tagColors.muted}
                  icon={<Video color={iconColor} size={14} />}
                  label="Consultation Modes"
                  labels={consultationModeLabels}
                  values={profile.consultationModes}
                />
                <TagSection
                  color={tagColors.accent}
                  icon={<FileText color={iconColor} size={14} />}
                  label="Focus Areas"
                  labels={focusAreaLabels}
                  values={profile.focusAreas}
                />
              </View>
            </Card>

            {/* Approach Steps */}
            {profile.approachSteps?.length > 0 && (
              <Card className="gap-4">
                <SectionHeader
                  icon={<Sparkles color={iconColor} size={18} />}
                  title="Therapeutic Approach"
                />
                <View className="gap-3">
                  {profile.approachSteps.map((step, index) => (
                    <View
                      className="relative rounded-xl border border-border/50 bg-muted/5 p-3.5"
                      key={step.id}
                    >
                      <Text className="absolute top-2.5 right-3 rounded-full bg-muted/60 px-2 py-0.5 font-bold font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                        Step {index + 1}
                      </Text>
                      <Text className="pr-10 font-medium text-foreground/80 text-sm leading-relaxed">
                        {step.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Education */}
            {education.length > 0 && (
              <Card className="gap-4">
                <SectionHeader
                  icon={<School2 color={iconColor} size={18} />}
                  title="Education & Credentials"
                />
                <View className="gap-3 overflow-hidden rounded-xl border border-border/40 bg-muted/5">
                  {education.map((entry, index) => (
                    <View
                      className={`flex-row items-center justify-between p-3.5 ${
                        index < education.length - 1
                          ? "border-border/30 border-b"
                          : ""
                      }`}
                      key={entry.id}
                    >
                      <View className="flex-1 gap-0.5">
                        <Text className="font-semibold text-foreground/80 text-sm">
                          {entry.degree}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          {entry.institution}
                        </Text>
                      </View>
                      {entry.year ? (
                        <View className="rounded-full border bg-muted px-2.5 py-1">
                          <Text className="font-mono font-semibold text-muted-foreground text-xs">
                            {entry.year}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Profile Resources */}
            <Card className="gap-4">
              <SectionHeader
                icon={<Camera color={iconColor} size={18} />}
                title="Profile Resources"
              />
              {files.length === 0 ? (
                <Text className="text-center text-muted-foreground text-sm italic">
                  No resources uploaded yet.
                </Text>
              ) : (
                <View className="gap-3">
                  {files.map((file) => (
                    <View
                      className="flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/5 p-3"
                      key={file.id}
                    >
                      <View className="flex-1 gap-0.5">
                        <Text className="font-semibold text-foreground/80 text-sm">
                          {capitalizeWords(file.fileKind)}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          {file.caption ?? file.fileName}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </>
        ) : (
          <Card className="gap-3">
            <Text className="font-black text-2xl text-foreground">
              Doctor not found
            </Text>
            <Text className="font-medium text-muted-foreground text-sm">
              That public profile does not exist yet.
            </Text>
          </Card>
        )}
      </Screen>
    </>
  );
}
