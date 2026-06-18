"use client";

import {
  Activity,
  MessageCircle,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";
import { Button } from "@/components/ui/button";
import { useThemeColor } from "@/utils/theme";

const SMALL_BREAKPOINT = 680;

const patientTabs = [
  { href: "/doctors", icon: Stethoscope, label: "Doctors" },

  { href: "/stress-hub", icon: Activity, label: "Stress Hub" },
  { href: "/ai", icon: MessageCircle, label: "AI Chat" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

export const RootBottomBar = () => {
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_BREAKPOINT;
  const colors = useThemeColor();

  return (
    <View className="-mx-page h-12 flex-row border-border border-t-[3px] bg-card">
      {patientTabs.map(({ href, icon: Icon, label }) => (
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
