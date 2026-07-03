"use client";

import { Globe } from "lucide-react-native";

export const OAUTH_STRATEGIES = [
  { strategy: "oauth_google", label: "Google", icon: Globe },
] as const;
