import {
  BriefcaseMedical,
  Circle,
  GraduationCap,
  Languages,
  MapPin,
  Sparkles,
  Stethoscope,
} from "lucide-react-native";
import { useMemo } from "react";
import { Image, Text, View } from "react-native";

import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { useThemeColor } from "@/utils/theme";

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
    experienceStartYear?: number | null;
  };
}

export const DoctorCard = ({
  profile,
  portrait,
  availableSlotCount,
  onPress,
}: DoctorCardProps) => {
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
              <Sparkles
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
          <Tag icon={BriefcaseMedical}>{profile.specialties[0]}</Tag>
        )}

        {experienceYears !== null && (
          <Tag icon={GraduationCap} variant="secondary">
            {experienceYears} {experienceYears === 1 ? "yr" : "yrs"} exp.
          </Tag>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <Tag variant="muted">{profile.languages.slice(0, 3).join(", ")}</Tag>
        )}

        {profile.consultationModes?.[0] && (
          <Tag icon={Languages} size="sm">
            {profile.consultationModes[0]}
          </Tag>
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
};
