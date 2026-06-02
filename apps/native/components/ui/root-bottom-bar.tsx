import {
  Activity,
  Calendar,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

const SMALL_BREAKPOINT = 400;

const patientTabs = [
  { href: "/doctors", icon: Stethoscope, label: "Doctors" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/sprite", icon: Sparkles, label: "Sprite" },
  { href: "/stress-hub", icon: Activity, label: "Stress Hub" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

const guardianTabs = [
  { href: "/(guardian)", icon: Users, label: "Managed" },
  { href: "/(guardian)/profile", icon: User, label: "Profile" },
] as const;

export const RootBottomBar = () => {
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_BREAKPOINT;
  const { isLoaded, isSignedIn } = useAuth();
  
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
          className="h-full flex-1 rounded-none"
          href={href}
          key={href}
          variant="secondary"
        >
          <View className="flex-row items-center justify-center gap-1.5 py-4">
            <Icon color="#ffffff" size={18} />
            {!isSmall && (
              <Text className="font-bold font-sans text-[10px] text-white uppercase">
                {label}
              </Text>
            )}
          </View>
        </Button>
      ))}
    </View>
  );
};
