"use client";

import { useRouter } from "expo-router";
import { BookOpen, Home, MessageCircle, User } from "lucide-react-native";
import type { ReactNode } from "react";
import { ScreenTabBar } from "@/components/design/ui/screen-tab-bar";

type PatientTab = "doctors" | "health" | "home" | "profile";

interface PatientTabScaffoldProps {
  activeTab: PatientTab;
  children: ReactNode;
}

const ACTIVE_COLOR = "#315b4d";
const INACTIVE_COLOR = "#7f8a83";

export function PatientTabScaffold({
  activeTab,
  children,
}: PatientTabScaffoldProps) {
  const router = useRouter();
  const iconColor = (tab: PatientTab) =>
    activeTab === tab ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <ScreenTabBar
      tabs={[
        {
          active: activeTab === "home",
          icon: <Home color={iconColor("home")} size={20} strokeWidth={2.2} />,
          label: "Home",
          onPress: () => router.replace("/(patient)"),
        },
        {
          active: activeTab === "doctors",
          icon: (
            <MessageCircle
              color={iconColor("doctors")}
              size={20}
              strokeWidth={2.2}
            />
          ),
          label: "Doctors",
          onPress: () => router.replace("/(patient)/doctors"),
        },
        {
          active: activeTab === "health",
          icon: (
            <BookOpen color={iconColor("health")} size={20} strokeWidth={2.2} />
          ),
          label: "Health",
          onPress: () => router.replace("/(patient)/health-hub"),
        },
        {
          active: activeTab === "profile",
          icon: (
            <User color={iconColor("profile")} size={20} strokeWidth={2.2} />
          ),
          label: "Profile",
          onPress: () => router.replace("/(patient)/profile"),
        },
      ]}
    >
      {children}
    </ScreenTabBar>
  );
}
