import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Award,
  BookOpen,
  BriefcaseMedical,
  Building,
  Clock,
  FileText,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  MapPin,
  Play,
  School2,
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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { Tag } from "@/components/ui/tag";
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
import { useIsDoctorSaved } from "@/utils/saved-doctors";
import { useThemeColor } from "@/utils/theme";

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <View className="flex-row items-center gap-3 border-border border-b pb-3">
      <View className="rounded-card bg-primary/10 p-2">{icon}</View>
      <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
        {title}
      </Text>
    </View>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-card border-2 border-border bg-card p-3">
      <View className="rounded-card bg-primary/10 p-2">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
          {label}
        </Text>
        <Text className="font-black font-sans text-foreground text-xs uppercase tracking-tight">
          {value}
        </Text>
      </View>
    </View>
  );
}

function PlanCard({
  plan,
}: {
  plan: {
    id: string;
    name: string;
    description?: string | null;
    durationMinutes: number;
    features?: string | null;
  };
}) {
  const features: string[] = plan.features
    ? (JSON.parse(plan.features) as string[])
    : [];

  return (
    <View className="rounded-card border-2 border-border bg-card p-card">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 font-black font-sans text-foreground text-lg uppercase tracking-tight">
          {plan.name}
        </Text>
        <Tag size="lg" variant="success">
          1 Credit
        </Tag>
      </View>
      {plan.description && (
        <Text className="mb-4 font-medium font-sans text-muted-foreground text-sm leading-relaxed">
          {plan.description}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        <Tag variant="secondary">{plan.durationMinutes} min</Tag>
        {features.map((feature) => (
          <Tag key={feature} variant="muted">
            {feature}
          </Tag>
        ))}
      </View>
    </View>
  );
}

function LoadingState() {
  const colors = useThemeColor();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="items-center justify-center px-page py-page">
        <Card className="items-center gap-4 px-8 py-12">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-widest">
            Loading profile...
          </Text>
        </Card>
      </Screen>
    </>
  );
}

function NotFoundState() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="px-page py-page">
        <BackButton />
        <Card className="items-center gap-3 px-8 py-12">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Stethoscope size={28} strokeWidth={2} />
          </View>
          <Text className="font-black font-sans text-2xl text-foreground uppercase tracking-tight">
            Not Found
          </Text>
          <Text className="text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
            That public profile does not exist yet.
          </Text>
        </Card>
      </Screen>
    </>
  );
}

function BackButton() {
  const colors = useThemeColor();

  return (
    <View className="pb-4">
      <Button
        className="self-start"
        href="/doctors"
        icon={
          <ArrowLeft color={colors.foreground} size={18} strokeWidth={2.5} />
        }
        variant="secondary"
      >
        BACK
      </Button>
    </View>
  );
}

function ProfileHeader({
  profile,
  portraitPreviewUrl,
  initials,
  yearsOfExperience,
}: {
  profile: {
    displayName?: string | null;
    headline?: string | null;
    permanent?: boolean | null;
    location?: string | null;
    stripeAccountEnabled?: boolean | null;
    experienceStartYear?: number | null;
  };
  portraitPreviewUrl: string | null;
  initials: string;
  yearsOfExperience: number | null;
}) {
  const colors = useThemeColor();

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="items-center gap-4 bg-primary/5 p-6">
        {portraitPreviewUrl ? (
          <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted">
            <Image
              className="h-full w-full"
              source={{ uri: portraitPreviewUrl }}
              style={{ resizeMode: "cover" }}
            />
          </View>
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-primary">
            <Text className="font-black font-sans text-3xl text-primary-foreground tracking-tighter">
              {initials}
            </Text>
          </View>
        )}

        <View className="flex items-center gap-2">
          <Text className="text-center font-black font-sans text-3xl text-foreground uppercase leading-none tracking-tight">
            {profile.displayName ?? "Clinician"}
          </Text>
          <Tag variant={profile.permanent ? "success" : "secondary"}>
            {profile.permanent ? "Licensed" : "Pending"}
          </Tag>
        </View>

        {profile.headline && (
          <Text className="max-w-[320px] text-center font-medium font-sans text-muted-foreground text-sm leading-snug">
            {profile.headline}
          </Text>
        )}
      </View>

      <View className="flex-row flex-wrap justify-center gap-2 p-4">
        {profile.location && (
          <Tag icon={MapPin} size="lg">
            {profile.location}
          </Tag>
        )}
        {yearsOfExperience && (
          <Tag icon={GraduationCap} size="lg" variant="secondary">
            {yearsOfExperience}+ years
          </Tag>
        )}
      </View>
    </Card>
  );
}

function BioSection({ bio }: { bio?: string | null }) {
  const colors = useThemeColor();

  if (!bio) {
    return null;
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="bg-primary/10 p-card">
        <View className="flex-row items-start gap-3">
          <View className="rounded-card bg-primary p-2">
            <BookOpen
              color={colors.primaryForeground}
              size={18}
              strokeWidth={2.5}
            />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-black font-sans text-primary text-xs uppercase tracking-widest">
              About
            </Text>
            <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
              {bio}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function MediaViewerModal({
  file,
  onClose,
}: {
  file: {
    id: string;
    fileKind: string;
    caption?: string | null;
    fileName: string;
  } | null;
  onClose: () => void;
}) {
  const previewUrl = useDoctorMaterialPreviewUrl(file?.id ?? null);
  const colors = useThemeColor();
  const isVideo = file?.fileKind === "intro_video";

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={file !== null}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/80"
        onPress={onClose}
      >
        <Pressable className="w-full max-w-lg px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1">
              {file?.caption && (
                <Text className="font-bold font-sans text-sm text-white/80 uppercase tracking-wider">
                  {file.caption}
                </Text>
              )}
              <Text className="font-black font-sans text-[10px] text-white/50 uppercase tracking-widest">
                {file ? capitalizeWords(file.fileKind) : ""}
              </Text>
            </View>
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
              onPress={onClose}
            >
              <X color="#ffffff" size={20} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View className="overflow-hidden rounded-2xl border-2 border-white/20 bg-muted">
            {previewUrl ? (
              <View>
                <Image
                  className="h-96 w-full"
                  source={{ uri: previewUrl }}
                  style={{ resizeMode: "contain" }}
                />
                {isVideo && (
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-white/90">
                      <Play
                        color={colors.foreground}
                        fill={colors.foreground}
                        size={28}
                        strokeWidth={2.5}
                      />
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View className="h-96 w-full items-center justify-center">
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MediaPreviewCard({
  caption,
  fileId,
  fileKind,
  onPress,
}: {
  caption?: string | null;
  fileId: string;
  fileKind: string;
  onPress: () => void;
}) {
  const previewUrl = useDoctorMaterialPreviewUrl(fileId);
  const colors = useThemeColor();
  const isVideo = fileKind === "intro_video";

  return (
    <Pressable onPress={onPress}>
      <View className="w-52 overflow-hidden rounded-card border-2 border-border bg-card">
        {previewUrl ? (
          <View className="h-36 w-full bg-muted">
            <Image
              className="h-full w-full"
              source={{ uri: previewUrl }}
              style={{ resizeMode: "cover" }}
            />
            {isVideo && (
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-white/90">
                  <Play
                    color={colors.foreground}
                    fill={colors.foreground}
                    size={22}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="h-36 w-full items-center justify-center bg-muted">
            {isVideo ? (
              <Play color={colors.mutedForeground} size={32} strokeWidth={2} />
            ) : (
              <ImageIcon
                color={colors.mutedForeground}
                size={32}
                strokeWidth={2}
              />
            )}
          </View>
        )}
        <View className="px-3 py-2">
          <Text className="font-black font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
            {capitalizeWords(fileKind)}
          </Text>
          {caption && (
            <Text
              className="font-bold font-sans text-foreground text-xs uppercase tracking-tight"
              numberOfLines={1}
            >
              {caption}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function MediaShowcase({
  files,
}: {
  files: {
    id: string;
    fileKind: string;
    caption?: string | null;
    fileName: string;
  }[];
}) {
  const colors = useThemeColor();
  const [selectedFile, setSelectedFile] = useState<(typeof files)[0] | null>(
    null
  );
  const mediaFiles = files.filter((f) =>
    ["qualification", "intro_video"].includes(f.fileKind)
  );

  return (
    <View className="gap-3">
      <SectionHeader
        icon={
          <ImageIcon color={colors.foreground} size={18} strokeWidth={2.5} />
        }
        title="Media"
      />
      {mediaFiles.length === 0 ? (
        <Text className="font-medium font-sans text-muted-foreground text-sm italic">
          No media assets uploaded.
        </Text>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {mediaFiles.map((file) => (
            <MediaPreviewCard
              caption={file.caption}
              fileId={file.id}
              fileKind={file.fileKind}
              key={file.id}
              onPress={() => setSelectedFile(file)}
            />
          ))}
        </ScrollView>
      )}

      <MediaViewerModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </View>
  );
}

function DetailsSection({
  profile,
}: {
  profile: {
    experienceStartYear?: number | null;
    location?: string | null;
    placeAddress?: string | null;
    placeName?: string | null;
    licenseNumber?: string | null;
  };
}) {
  const colors = useThemeColor();

  return (
    <Card className="gap-section">
      <SectionHeader
        icon={<Award color={colors.foreground} size={18} strokeWidth={2.5} />}
        title="Details"
      />
      <View className="gap-2">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <InfoChip
              icon={
                <Clock color={colors.foreground} size={16} strokeWidth={2.5} />
              }
              label="Experience"
              value={
                profile.experienceStartYear
                  ? `Since ${profile.experienceStartYear}`
                  : "Not set"
              }
            />
          </View>
          <View className="flex-1">
            <InfoChip
              icon={
                <MapPin color={colors.foreground} size={16} strokeWidth={2.5} />
              }
              label="Location"
              value={profile.location ?? "Not set"}
            />
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <InfoChip
              icon={
                <FileText
                  color={colors.foreground}
                  size={16}
                  strokeWidth={2.5}
                />
              }
              label="License"
              value={profile.licenseNumber ?? "Not set"}
            />
          </View>
          <View className="flex-1">
            <InfoChip
              icon={
                <Building
                  color={colors.foreground}
                  size={16}
                  strokeWidth={2.5}
                />
              }
              label="Practice"
              value={profile.placeName ?? profile.placeAddress ?? "Not set"}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

function TagsOverviewSection({
  profile,
}: {
  profile: {
    specialties: string[];
    languages: string[];
    consultationModes: string[];
    focusAreas: string[];
  };
}) {
  const colors = useThemeColor();

  return (
    <Card className="gap-section">
      <SectionHeader
        icon={
          <Sparkles color={colors.foreground} size={18} strokeWidth={2.5} />
        }
        title="At a Glance"
      />
      <View className="gap-3">
        {profile.specialties.length > 0 && (
          <View className="gap-2">
            <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
              Specialties
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.specialties.map((s) => (
                <Tag key={s} variant="primary">
                  {specialtyLabels[s] ?? capitalizeWords(s)}
                </Tag>
              ))}
            </View>
          </View>
        )}
        {profile.languages.length > 0 && (
          <View className="gap-2">
            <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
              Languages
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.languages.map((l) => (
                <Tag key={l} variant="secondary">
                  {languageLabels[l] ?? capitalizeWords(l)}
                </Tag>
              ))}
            </View>
          </View>
        )}
        {profile.consultationModes.length > 0 && (
          <View className="gap-2">
            <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
              Consultation
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.consultationModes.map((m) => (
                <Tag key={m} variant="muted">
                  {consultationModeLabels[m] ?? capitalizeWords(m)}
                </Tag>
              ))}
            </View>
          </View>
        )}
        {profile.focusAreas.length > 0 && (
          <View className="gap-2">
            <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
              Focus Areas
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.focusAreas.map((a) => (
                <Tag key={a} variant="success">
                  {focusAreaLabels[a] ?? capitalizeWords(a)}
                </Tag>
              ))}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

function ApproachStepsSection({
  steps,
}: {
  steps: { id: string; text: string }[];
}) {
  const colors = useThemeColor();

  if (steps.length === 0) {
    return null;
  }

  return (
    <Card className="gap-section">
      <SectionHeader
        icon={
          <BriefcaseMedical
            color={colors.foreground}
            size={18}
            strokeWidth={2.5}
          />
        }
        title="Approach"
      />
      <View className="relative ml-1 gap-0">
        {steps.map((step, index) => (
          <View className="flex-row" key={step.id}>
            <View className="items-center pt-3" style={{ width: 28 }}>
              <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-primary">
                <Text className="font-black font-sans text-[10px] text-primary-foreground">
                  {index + 1}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View className="mt-0.5 h-full w-0.5 flex-1 rounded-full bg-border" />
              )}
            </View>
            <View className="flex-1 pb-4 pl-3">
              <View className="rounded-card border-2 border-border bg-card p-3">
                <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
                  {step.text}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function EducationSection({
  education,
}: {
  education: {
    id: string;
    degree: string;
    institution: string;
    year?: number | null;
  }[];
}) {
  const colors = useThemeColor();

  if (education.length === 0) {
    return null;
  }

  return (
    <Card className="gap-section">
      <SectionHeader
        icon={<School2 color={colors.foreground} size={18} strokeWidth={2.5} />}
        title="Education"
      />
      <View className="gap-2">
        {education.map((entry) => (
          <View
            className="flex-row items-center gap-3 rounded-card border-2 border-border bg-card p-3"
            key={entry.id}
          >
            <View className="rounded-card bg-secondary p-2.5">
              <School2 color={colors.foreground} size={20} strokeWidth={2} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-black font-sans text-foreground text-sm uppercase tracking-tight">
                {entry.degree}
              </Text>
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase">
                {entry.institution}
              </Text>
            </View>
            {entry.year && (
              <Tag size="md" variant="secondary">
                {entry.year}
              </Tag>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}

function PlansSection({ doctorId }: { doctorId: string }) {
  const colors = useThemeColor();

  const plansQuery = useQuery(
    orpc.getDoctorPlans.queryOptions({
      input: { doctorId },
    })
  );

  const plans = plansQuery.data?.plans ?? [];

  if (plans.length === 0) {
    return null;
  }

  return (
    <Card className="gap-section">
      <SectionHeader
        icon={
          <FileText color={colors.foreground} size={18} strokeWidth={2.5} />
        }
        title="Session Plans"
      />
      <View className="gap-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </View>
    </Card>
  );
}

function SaveButton({ doctorId }: { doctorId: string }) {
  const colors = useThemeColor();
  const { isSaved, toggleSave } = useIsDoctorSaved(doctorId);

  return (
    <Pressable
      className="flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-card px-4"
      onPress={toggleSave}
    >
      <Heart
        color={isSaved ? colors.foreground : colors.mutedForeground}
        fill={isSaved ? colors.foreground : "transparent"}
        size={18}
        strokeWidth={2.5}
      />
      <Text className="font-black font-sans text-foreground text-sm uppercase tracking-widest">
        {isSaved ? "Saved" : "Save"}
      </Text>
    </Pressable>
  );
}

function BackIconButton() {
  const router = useRouter();

  return (
    <IconButton
      icon={ArrowLeft}
      iconSize={20}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/doctors");
        }
      }}
    />
  );
}

export default function DoctorProfileScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;

  const doctorQuery = useQuery(
    orpc.getDoctor.queryOptions({
      input: { doctorId: id ?? "" },
      enabled: !!id,
    })
  );

  const profile = doctorQuery.data?.profile;
  const files = doctorQuery.data?.files ?? [];
  const portraitId = doctorQuery.data?.portrait?.id ?? null;
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(portraitId);

  const yearsOfExperience = useMemo(
    () => getYearsOfExperience(profile?.experienceStartYear ?? null),
    [profile?.experienceStartYear]
  );

  const displayName =
    profile?.displayName ?? profile?.licenseNumber ?? "DOCTOR";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (doctorQuery.isLoading) {
    return <LoadingState />;
  }

  if (!profile) {
    return <NotFoundState />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-section px-page py-page pb-28">
        <ProfileHeader
          initials={initials}
          portraitPreviewUrl={portraitPreviewUrl}
          profile={profile}
          yearsOfExperience={yearsOfExperience}
        />

        <BioSection bio={profile.bio} />

        <MediaShowcase files={files} />

        <TagsOverviewSection profile={profile} />

        <ApproachStepsSection steps={profile.approachSteps} />

        <EducationSection education={doctorQuery.data?.education ?? []} />

        <PlansSection doctorId={id ?? ""} />

        <DetailsSection profile={profile} />
      </Screen>

      <ScreenBottomBar>
        <View className="flex-1 flex-row gap-2">
          <SaveButton doctorId={id ?? ""} />
          <Button className="flex-1" href={`/doctors/${id}/booking`}>
            BOOK CONSULT
          </Button>
        </View>
        <BackIconButton />
      </ScreenBottomBar>
    </>
  );
}
