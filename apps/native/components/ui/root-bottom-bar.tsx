import {
  Activity,
  Calendar,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";

import { Button } from "@/components/ui/button";

const SMALL_BREAKPOINT = 400;

const patientTabs = [
  { href: "/doctors", icon: Stethoscope, label: "Doctors" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/sprite", icon: Sparkles, label: "Sprite" },
  { href: "/stress-hub", icon: Activity, label: "Stress Hub" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

export const RootBottomBar = () => {
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_BREAKPOINT;

  return (
    <View className="-mx-page flex-row h-12 border-border border-t-[3px] bg-card">
      {patientTabs.map(({ href, icon: Icon, label }) => (
        <Button
          className="flex-1 h-full rounded-none"
          href={href}
          key={href}
          variant="secondary"
        >
          <View className="flex-row items-center justify-center gap-1.5 py-4">
            <Icon color="#ffffff" size={18} />
            {!isSmall && (
              <Text className="font-bold font-sans text-white text-[10px] uppercase">
                {label}
              </Text>
            )}
          </View>
        </Button>
      ))}
    </View>
  );
};
