import {
  ArrowRight,
  Clock,
  Languages,
  MapPin,
  Sparkles,
} from "lucide-react-native";
import { Image, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { useThemeColor } from "@/utils/theme";

interface DoctorCardProps {
  availableSlotCount: number;
  onPress: () => void;
  portrait: { id: string | null } | null;
  profile: {
    userId: string;
    displayName?: string;
    location?: string;
    headline?: string;
    specialties?: string[];
    consultationModes?: string[];
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

  return (
    <Card
      className="gap-4"
      href={`/doctors/${profile.userId}`}
      onPress={onPress}
    >
      
      <View className="flex-row items-center gap-4">
        <View className="h-12 w-12 overflow-hidden rounded-full border-2 border-border bg-muted">
          {previewUrl ? (
            <Image
              className="h-full w-full"
              source={{ uri: previewUrl }}
              style={{ resizeMode: "cover" }}
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-secondary">
              <Sparkles color={colors.foreground} size={24} strokeWidth={2} />
            </View>
          )}
        </View>
        <View className="flex-1 justify-center gap-1">
          <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
            {profile.displayName ?? "Clinician"}
          </Text>
          {profile.location && (
            <View className="flex-row items-center gap-1">
              <MapPin
                color={colors.mutedForeground}
                size={12}
                strokeWidth={2.5}
              />
              <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                {profile.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      
      <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
        {profile.headline ??
          "Licensed medical practitioner dedicated to safe, private clinical care."}
      </Text>

      
      <View className="flex-row flex-wrap gap-2">
        {availableSlotCount > 0 ? (
          <View className="flex-row items-center gap-1 rounded-chip border border-success/30 bg-success/10 px-2 py-0.5">
            <Clock color={colors.success} size={10} strokeWidth={2.5} />
            <Text className="font-bold font-sans text-[9px] text-success uppercase tracking-wider">
              {availableSlotCount} Slots Available
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1 rounded-chip border border-border bg-secondary px-2 py-0.5">
            <Clock color={colors.mutedForeground} size={10} strokeWidth={2.5} />
            <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-wider">
              No Slots
            </Text>
          </View>
        )}
        {profile.specialties?.[0] && (
          <View className="flex-row items-center gap-1 rounded-chip border border-border bg-card px-2 py-0.5">
            <Sparkles color={colors.foreground} size={10} strokeWidth={2.5} />
            <Text className="font-bold font-sans text-[9px] text-foreground uppercase tracking-wider">
              {profile.specialties[0]}
            </Text>
          </View>
        )}
        {profile.consultationModes?.[0] && (
          <View className="flex-row items-center gap-1 rounded-chip border border-border bg-card px-2 py-0.5">
            <Languages color={colors.foreground} size={10} strokeWidth={2.5} />
            <Text className="font-bold font-sans text-[9px] text-foreground uppercase tracking-wider">
              {profile.consultationModes[0]}
            </Text>
          </View>
        )}
      </View>

      
      <View className="flex-row items-center justify-between border-border/10 border-t pt-3">
        <Text className="font-black font-sans text-[10px] text-primary uppercase tracking-widest">
          View Profile
        </Text>
        <ArrowRight color={colors.primary} size={16} strokeWidth={2.5} />
      </View>
    </Card>
  );
};
