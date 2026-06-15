"use client";

import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const SMALL_BREAKPOINT = 680;

const patientTabs = [
  { href: "/doctors", icon: Stethoscope, label: "Doctors" },
  { href: "/sprite", icon: Sparkles, label: "Sprite" },
  { href: "/stress-hub", icon: Activity, label: "Stress Hub" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

const guardianTabs = [
  { href: "/(guardian)", icon: Users, label: "Home" },
  { href: "/(guardian)/activities", icon: Activity, label: "Activities" },
  { href: "/(guardian)/track-management", icon: BarChart3, label: "Tracking" },
  { href: "/(guardian)/profile", icon: User, label: "Profile" },
] as const;

export const RootBottomBar = () => {
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_BREAKPOINT;
  const { isLoaded, isSignedIn } = useAuth();
  const colors = useThemeColor();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
    })
  );

  const isPatient = !!patientProfileQuery.data;
  const tabs = isPatient ? patientTabs : guardianTabs;

  return (
    <View className="-mx-page h-12 flex-row border-border border-t-[3px] bg-card">
      {tabs.map(({ href, icon: Icon, label }) => (
        <Button
          className="h-full flex-1 rounded-none border-0"
          href={href}
          key={href}
          variant="secondary"
        >
          <View className="flex-row items-center justify-center gap-1.5 py-4">
            <Icon color={colors.foreground} size={18} />
            {!isSmall && (
              <Text className="font-bold font-sans text-[10px] text-foreground uppercase">
                {label}
              </Text>
            )}
          </View>
        </Button>
      ))}
    </View>
  );
};
