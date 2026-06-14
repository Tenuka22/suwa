"use client";

import { NATIVE_APP_DISPLAY_NAME } from "@doca/app-info";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { type Href, useRouter } from "expo-router";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Fingerprint,
  HeartPulse,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Video,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import {
  CLASS_COLORS,
  CLASS_LABELS,
  classIndex,
  computeInsights,
  type StressBundle,
  statusFromPrediction,
} from "@/utils/stress/analysis";
import { useThemeColor } from "@/utils/theme";

interface HomeLandingProps {
  signedIn: boolean;
}

// Trust Badges (accurate to @doca/crypto + stress-hub)
const trustBadges = [
  { label: "On-Device Keys", icon: KeyRound },
  { label: "Zero-Knowledge", icon: Database },
  { label: "Encrypted Video", icon: Video },
] as const;

// Security flow steps (accurate to @doca/crypto)
const securitySteps = [
  {
    icon: Fingerprint,
    title: "1. Client Key Generation",
    description:
      "crypto.getRandomValues() generates 32 random bytes (256-bit AES-GCM key) on your device. The key lives exclusively in the OS secure enclave (iOS Keychain / Android Keystore) via expo-secure-store.",
    badge: "AES-256-GCM",
  },
  {
    icon: LockKeyhole,
    title: "2. Zero-Knowledge Encryption",
    description:
      "Your name, email, phone, and address are serialised to JSON, encrypted via crypto.subtle.encrypt with AES-256-GCM + a 12-byte random IV, then base64-encoded. The server can never decrypt the payload.",
    badge: "Client-Side",
  },
  {
    icon: ShieldCheck,
    title: "3. Opaque Storage",
    description:
      "Only an opaque _securedData TEXT blob is persisted in the patient_profiles table via putPrivacyData. The server has no access to the encryption key — true zero-knowledge architecture.",
    badge: "Zero-Knowledge",
  },
] as const;

// Generate mock bundle for signed-out preview
function generateMockBundles(): StressBundle[] {
  const classes = ["baseline", "amusement", "stress"] as const;
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const cls = classes[i % 3 === 2 ? 2 : i % 3 === 1 ? 1 : 0];
    const probs: [number, number, number] =
      cls === "stress"
        ? [0.1, 0.15, 0.75]
        : cls === "amusement"
          ? [0.15, 0.75, 0.1]
          : [0.75, 0.15, 0.1];
    return {
      bundleId: `mock-${i}`,
      createdAt: now - (24 - i) * 600_000,
      prediction: { predictedClass: cls, probabilities: probs },
      samples: [],
    };
  });
}

interface HeroSectionProps {
  primaryColor: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}

function HeroSection({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  primaryColor,
}: HeroSectionProps) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <Animated.View className="px-1" entering={FadeIn.duration(800)}>
      <View
        className="relative flex overflow-hidden rounded-card border-2 border-border bg-card"
        style={{ height: screenHeight }}
      >
        {/* Neo-brutalist decorative geometry */}
        <View className="absolute -top-10 -right-10 h-40 w-40 rotate-12 border-[6px] border-primary/20" />
        <View className="absolute -bottom-8 -left-8 h-28 w-28 bg-primary/10" />
        <View className="absolute top-1/3 right-4 h-1 w-16 bg-primary/30" />

        <View className="h-full flex-1 px-card pb-card">
          {/* Top - flex-1 pushes buttons to bottom */}
          <View className="flex-1 items-start justify-start gap-5 pt-card">
            {/* Brand pill */}
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-card">
                <Image
                  className="size-14"
                  source={require("@/assets/images/Logo.png")}
                  style={{ height: "100%", width: "100%", resizeMode: "contain" }}
                />
              </View>
              <View className="gap-1">
                <Text className="font-black font-sans text-[10px] text-primary uppercase tracking-[0.3em]">
                  {NATIVE_APP_DISPLAY_NAME}
                </Text>
                <View className="h-[3px] w-10 bg-primary" />
              </View>
            </View>

            {/* Main headline */}
            <View className="gap-1">
              <Text className="font-black font-sans text-5xl text-foreground leading-[1.05] tracking-tighter">
                Secured
              </Text>
              <Text className="font-black font-sans text-5xl text-primary leading-[1.05] tracking-tighter">
                Wellness
              </Text>
            </View>

            <Text className="max-w-[90%] font-medium font-sans text-base text-muted-foreground leading-relaxed">
              Care for your mental health with an interactive Sprite companion,
              log daily habits, track real-time wearable stress data, and
              consult therapists in zero-knowledge privacy.
            </Text>
          </View>

          {/* Bottom - anchored stay */}
          <View className="gap-4">
            {/* CTAs */}
            <View className="flex-col gap-3">
              <Button
                className="h-14"
                href={primaryHref}
                icon={<ArrowRight color="white" size={18} />}
              >
                {primaryLabel}
              </Button>
              <Button className="h-14" href={secondaryHref} variant="outline">
                {secondaryLabel}
              </Button>
            </View>

            {/* Trust Badges */}
            <View className="flex-row flex-wrap items-center justify-center gap-6 border-border/30 border-t-2 pt-4">
              {trustBadges.map(({ label, icon: Icon }) => (
                <View className="flex-row items-center gap-1.5" key={label}>
                  <Icon color={primaryColor} size={14} />
                  <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="absolute bottom-0 h-2 w-full bg-primary" />
      </View>
    </Animated.View>
  );
}

// Security Pipeline Sub-component
function SecurityPipeline({ primaryColor }: { primaryColor: string }) {
  return (
    <View className="px-1">
      <View className="overflow-hidden rounded-card border-2 border-border bg-card">
        <View className="p-6">
          <View className="relative">
            {/* Connector line */}
            <View className="absolute top-6 bottom-6 left-[23px] w-[3px] bg-primary/40" />

            <View className="gap-10">
              {securitySteps.map((step) => (
                <View className="flex-row items-start gap-5" key={step.title}>
                  <View className="relative z-10 h-12 w-12 items-center justify-center rounded-card border-2 border-border bg-muted">
                    <step.icon color={primaryColor} size={22} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-black font-sans text-base text-foreground tracking-tight">
                        {step.title}
                      </Text>
                      <View className="rounded-full border-2 border-border/30 bg-primary/10 px-2 py-0.5">
                        <Text className="font-bold text-[8px] text-primary uppercase">
                          {step.badge}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-1 font-normal font-sans text-muted-foreground text-xs leading-relaxed">
                      {step.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View className="h-1.5 bg-primary/60" />
      </View>
    </View>
  );
}

// Guardian Collaboration Sub-component
function GuardianCollaboration({ primaryColor }: { primaryColor: string }) {
  return (
    <View className="px-1">
      <View className="overflow-hidden rounded-card border-2 border-border bg-card">
        <View className="gap-4 p-card">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 items-center gap-1.5 rounded-card border-2 border-emerald-500/30 bg-emerald-500/20 p-3">
              <UserCheck color="#10b981" size={20} />
              <Text className="font-black font-sans text-foreground text-xs">
                Patient Profile
              </Text>
              <Text className="font-bold font-sans text-[8px] text-emerald-600 uppercase">
                Secured Alias
              </Text>
            </View>

            <View className="items-center px-3">
              <Text className="font-black font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
                linked
              </Text>
              <ChevronRight color={primaryColor} size={16} />
            </View>

            <View className="flex-1 items-center gap-1.5 rounded-card border-2 border-indigo-500/30 bg-indigo-500/20 p-3">
              <Users color="#6366f1" size={20} />
              <Text className="font-black font-sans text-foreground text-xs">
                Guardian Profile
              </Text>
              <Text className="font-bold font-sans text-[8px] text-indigo-600 uppercase">
                Linked Identity
              </Text>
            </View>
          </View>

          <View className="gap-2 rounded-card border-2 border-border bg-muted p-3">
            <Text className="font-black font-sans text-foreground text-xs">
              Invitation Verification Flow
            </Text>
            <View className="flex-row items-center gap-2">
              <CheckCircle2 color="#10b981" size={14} />
              <Text className="font-normal font-sans text-muted-foreground text-xs">
                Patient sends invite via Email/Phone
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <CheckCircle2 color="#10b981" size={14} />
              <Text className="font-normal font-sans text-muted-foreground text-xs">
                Guardian logs in and accepts the request
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <CheckCircle2 color="#10b981" size={14} />
              <Text className="font-normal font-sans text-muted-foreground text-xs">
                Secure connection tunnel established
              </Text>
            </View>
          </View>
        </View>
        <View className="h-1.5 bg-primary/60" />
      </View>
    </View>
  );
}

// Main Component
export function HomeLanding({ signedIn }: HomeLandingProps) {
  const colors = useThemeColor();
  const router = useRouter();

  // Selected Tab for Live Simulator Preview
  const [activeSimTab, setActiveSimTab] = useState<
    "sprite" | "habits" | "stress" | "sessions"
  >("sprite");

  // Dynamic user data queries (only activated when signedIn is true)
  const spriteQuery = useQuery({
    ...orpc.getSpriteState.queryOptions(),
    enabled: signedIn,
  });

  const creditsQuery = useQuery({
    ...orpc.getMoonlightCredits.queryOptions(),
    enabled: signedIn,
  });

  const tasksQuery = useQuery({
    ...orpc.getTodayTasks.queryOptions(),
    enabled: signedIn,
  });

  const sessionsQuery = useQuery({
    ...orpc.listPatientSessions.queryOptions(),
    enabled: signedIn,
  });

  // Simulator Mood Interactive State (for signed out users)
  const [simMood, setSimMood] = useState<
    "happy" | "thinking" | "alert" | "idle"
  >("idle");
  const [simCredits, setSimCredits] = useState(250);

  // Simulator Habits Interactive Checkboxes (for signed out users)
  const [simHabits, setSimHabits] = useState([
    {
      id: "h1",
      title: "Morning Breathing Rhythm",
      completed: false,
      time: "Morning",
    },
    {
      id: "h2",
      title: "Dawn Stillness Meditation",
      completed: true,
      time: "Morning",
    },
    {
      id: "h3",
      title: "Night Calm Breathwork",
      completed: false,
      time: "Night",
    },
  ]);

  const toggleSimHabit = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSimHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextState = !h.completed;
          if (nextState) {
            setSimCredits((c) => c + 10);
            setSimMood("happy");
          } else {
            setSimCredits((c) => Math.max(0, c - 10));
            setSimMood("thinking");
          }
          return { ...h, completed: nextState };
        }
        return h;
      })
    );
  };

  // Paths & Labels — primary action drives users to consultation
  const primaryHref = "/doctors";
  const secondaryHref = signedIn ? "/appointments" : "/(auth)/sign-in";
  const primaryLabel = "Find a Therapist";
  const secondaryLabel = signedIn ? "My Appointments" : "Sign In";

  // Logic to obtain current next upcoming session
  const nextSession = sessionsQuery.data?.sessions?.find(
    (s) => s.status === "approved" || s.status === "requested"
  );

  // Determine dynamic Sprite animation action state
  let spriteAction: "idle" | "happy" | "thinking" | "alert" = "idle";
  if (signedIn) {
    const mood = spriteQuery.data?.mood;
    if (mood === "sleep") {
      spriteAction = "alert";
    } else if (mood === "yawn") {
      spriteAction = "thinking";
    } else if (mood === "happy") {
      spriteAction = "happy";
    } else {
      spriteAction = "idle";
    }
  } else {
    spriteAction = simMood;
  }

  // Pre-calculated content structures to avoid nested ternary complexity

  const renderSpriteContent = () => (
    <View className="items-center gap-4">
      <View className="h-56 w-full items-center justify-center rounded-card border-2 border-border bg-muted py-4">
        <SpriteAnimation action={spriteAction} size="md" />
      </View>

      <View className="w-full gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-black font-sans text-foreground text-lg tracking-tight">
            Sprite Health
          </Text>
          <Text className="font-bold font-sans text-primary text-sm">
            {signedIn ? (spriteQuery.data?.health ?? 100) : 85}%
          </Text>
        </View>

        <View className="h-3 w-full overflow-hidden rounded-full border-2 border-border bg-muted">
          <View
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: `${signedIn ? (spriteQuery.data?.health ?? 100) : 85}%`,
            }}
          />
        </View>

        <View className="mt-1 flex-row gap-2.5">
          <View className="flex-1 items-center justify-center rounded-card border-2 border-border bg-muted p-3">
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Mood
            </Text>
            <Text
              className="mt-0.5 text-center font-black font-sans text-foreground text-sm uppercase"
              numberOfLines={1}
            >
              {signedIn ? (spriteQuery.data?.mood ?? "idle") : simMood}
            </Text>
          </View>
          <View className="flex-1 items-center justify-center rounded-card border-2 border-border bg-muted p-3">
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Streak
            </Text>
            <Text
              className="mt-0.5 text-center font-black font-sans text-foreground text-sm"
              numberOfLines={1}
            >
              {signedIn ? (spriteQuery.data?.streakDays ?? 0) : 5} Days
            </Text>
          </View>
          <View className="flex-1 items-center justify-center rounded-card border-2 border-border bg-muted p-3">
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Credits
            </Text>
            <Text
              className="mt-0.5 text-center font-black font-sans text-foreground text-sm"
              numberOfLines={1}
            >
              {signedIn ? (creditsQuery.data?.balance ?? 0) : simCredits}
            </Text>
          </View>
        </View>

        {!signedIn && (
          <View className="mt-2 gap-2">
            <Text className="text-center font-normal font-sans text-muted-foreground text-xs">
              Tap below to simulate pet mood changes:
            </Text>
            <View className="flex-row justify-center gap-2">
              {(["idle", "happy", "thinking", "alert"] as const).map((mood) => (
                <Pressable
                  className={`rounded-full border-2 px-3 py-1 ${simMood === mood ? "border-primary bg-primary" : "border-border bg-muted"}`}
                  key={mood}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSimMood(mood);
                  }}
                >
                  <Text
                    className={`font-bold text-[10px] uppercase tracking-wider ${simMood === mood ? "text-white" : "text-foreground"}`}
                  >
                    {mood}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderHabitsContent = () => {
    if (signedIn) {
      if (tasksQuery.isLoading) {
        return (
          <Text className="py-4 text-center font-medium font-sans text-muted-foreground text-sm">
            Loading daily tasks...
          </Text>
        );
      }
      if (tasksQuery.data?.tasks && tasksQuery.data.tasks.length > 0) {
        return tasksQuery.data.tasks.map((task) => (
          <Pressable
            className={`flex-row items-center gap-3 rounded-card border-2 p-3 ${
              task.completed
                ? "border-green-500/40 bg-green-500/20"
                : "border-border bg-muted"
            }`}
            key={task.actionType}
            onPress={() => router.push("/sprite/actions")}
          >
            <View
              className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                task.completed
                  ? "border-green-500 bg-green-500"
                  : "border-border"
              }`}
            >
              {task.completed && (
                <Check color="white" size={12} strokeWidth={3} />
              )}
            </View>
            <View className="flex-1">
              <Text
                className={`font-black font-sans text-sm ${
                  task.completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {task.title}
              </Text>
              <Text className="font-normal font-sans text-muted-foreground text-xs">
                {task.description}
              </Text>
            </View>
            <ChevronRight color={colors.mutedForeground} size={16} />
          </Pressable>
        ));
      }
      return (
        <Text className="py-4 text-center font-medium font-sans text-muted-foreground text-sm">
          No habits assigned for this time slot.
        </Text>
      );
    }

    return simHabits.map((habit) => (
      <Pressable
        className={`flex-row items-center gap-3 rounded-card border-2 p-3 ${
          habit.completed
            ? "border-green-500/40 bg-green-500/20"
            : "border-border bg-muted"
        }`}
        key={habit.id}
        onPress={() => toggleSimHabit(habit.id)}
      >
        <View
          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
            habit.completed ? "border-green-500 bg-green-500" : "border-border"
          }`}
        >
          {habit.completed && <Check color="white" size={12} strokeWidth={3} />}
        </View>
        <View className="flex-1">
          <Text
            className={`font-black font-sans text-sm ${
              habit.completed
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {habit.title}
          </Text>
          <Text className="mt-0.5 font-bold text-[9px] text-primary uppercase tracking-wide">
            Scheduled: {habit.time}
          </Text>
        </View>
        <View className="rounded-full bg-muted px-2 py-0.5">
          <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase">
            Simulate
          </Text>
        </View>
      </Pressable>
    ));
  };

  const stressQuery = useQuery({
    ...orpc.getStressData.queryOptions(),
    enabled: signedIn,
  });

  const mockBundles = useMemo(() => generateMockBundles(), []);
  const stressBundles = signedIn
    ? (stressQuery.data?.bundles ?? [])
    : mockBundles;
  const stressInsights = useMemo(
    () => computeInsights(stressBundles),
    [stressBundles]
  );

  const latestBundle =
    stressBundles.length > 0 ? stressBundles[stressBundles.length - 1] : null;
  const status = latestBundle?.prediction
    ? statusFromPrediction(latestBundle.prediction.predictedClass)
    : null;
  const StatusIcon = status?.icon ?? Brain;

  const renderStressContent = () => {
    return (
      <View className="gap-4">
        {/* Status indicator */}
        <View className="items-center py-2">
          <View className="h-40 w-40 items-center justify-center rounded-full border-[3px] border-border bg-card">
            <View
              className={`h-full w-full items-center justify-center rounded-full ${status?.bg || "bg-muted/30"}`}
            >
              <StatusIcon
                color={
                  status?.color === "text-destructive"
                    ? "#ef4444"
                    : status?.color === "text-success"
                      ? "#10b981"
                      : colors.primary
                }
                size={48}
              />
              <Text
                className={`mt-2 font-black font-sans text-sm uppercase tracking-widest ${status?.color || "text-muted-foreground"}`}
              >
                {status?.label || "No Data"}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Stats */}
        <View className="gap-3 rounded-card border-2 border-border bg-muted p-4">
          <View className="flex-row items-center gap-3">
            <View className="rounded-full bg-primary/10 p-3">
              <Activity color={colors.primary} size={18} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                Current State
              </Text>
              <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                {stressInsights?.dominantLabel || "Idle"}
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                Stress Ratio
              </Text>
              <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
                {stressInsights?.stressRatio || 0}%
              </Text>
            </View>
            <View className="h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
              <View
                className="h-full rounded-full bg-destructive"
                style={{
                  width: `${Math.min(100, stressInsights?.stressRatio || 0)}%`,
                }}
              />
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 rounded-card border-2 border-border bg-background px-3 py-3">
              <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                Trend
              </Text>
              <View className="mt-1 flex-row items-center gap-1">
                {stressInsights?.trendDirection === "up" ? (
                  <TrendingUp color="#ef4444" size={16} />
                ) : stressInsights?.trendDirection === "down" ? (
                  <TrendingDown color="#10b981" size={16} />
                ) : (
                  <BarChart3 color={colors.foreground} size={16} />
                )}
                <Text
                  className="font-black font-sans text-foreground text-lg"
                  numberOfLines={1}
                >
                  {stressInsights?.trendLabel || "Stable"}
                </Text>
              </View>
            </View>
            <View className="flex-1 rounded-card border-2 border-border bg-background px-3 py-3">
              <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                Avg Confidence
              </Text>
              <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                {stressInsights?.averageConfidence || 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Prediction Timeline */}
        {stressBundles.length > 0 && (
          <View className="gap-2">
            <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
              Prediction Timeline
            </Text>
            <View className="rounded-card border-2 border-border bg-muted p-3">
              <View className="flex-row items-end gap-[2px]">
                {stressBundles.slice(-60).map((b, i) => {
                  const idx = b.prediction
                    ? classIndex(b.prediction.predictedClass)
                    : -1;
                  const color =
                    idx >= 0 ? CLASS_COLORS[idx] : colors.mutedForeground;
                  const height = idx >= 0 ? 16 + idx * 10 : 6;
                  return (
                    <View
                      key={b.bundleId ?? i}
                      style={{
                        backgroundColor: color,
                        borderRadius: 2,
                        flex: 1,
                        height,
                        opacity: b.prediction ? 1 : 0.3,
                      }}
                    />
                  );
                })}
              </View>
              <View className="mt-3 flex-row gap-4">
                {CLASS_LABELS.map((label, i) => (
                  <View className="flex-row items-center gap-1.5" key={label}>
                    <View
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: CLASS_COLORS[i] }}
                    />
                    <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {!signedIn && (
          <Text className="text-center font-normal font-sans text-[11px] text-muted-foreground italic leading-relaxed">
            *Simulated stress data preview. Sign in to see your real-time
            wearable ingestion.
          </Text>
        )}
      </View>
    );
  };

  const renderSessionsContent = () => {
    if (signedIn) {
      if (sessionsQuery.isLoading) {
        return (
          <Text className="py-4 text-center font-medium font-sans text-muted-foreground text-sm">
            Loading sessions...
          </Text>
        );
      }
      if (nextSession) {
        return (
          <View className="gap-3">
            <View className="flex-row items-start justify-between">
              <View className="gap-1">
                <Text className="font-black font-sans text-base text-foreground uppercase">
                  {nextSession.doctor?.displayName ?? "Clinical Doctor"}
                </Text>
                <View className="flex-row items-center gap-2 self-start rounded-full border-2 border-border bg-muted px-3 py-1">
                  <Calendar color={colors.primary} size={12} />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    {new Date(nextSession.startAt).toLocaleDateString()}
                  </Text>
                  <Clock color={colors.primary} size={12} />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    {new Date(nextSession.startAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
              <View className="rounded-full border-2 border-emerald-500/40 bg-emerald-500/20 px-3 py-1">
                <Text className="font-black font-sans text-[10px] text-emerald-600 uppercase tracking-wider">
                  {nextSession.status}
                </Text>
              </View>
            </View>

            <SessionJoinAction
              endAt={nextSession.endAt}
              id={nextSession.id}
              startAt={nextSession.startAt}
            />
          </View>
        );
      }
      return (
        <View className="items-center gap-3 py-4">
          <Text className="text-center font-medium font-sans text-muted-foreground text-sm">
            No upcoming appointments scheduled.
          </Text>
          <Button href="/doctors" variant="primary">
            Book Appointment
          </Button>
        </View>
      );
    }

    return (
      <View className="gap-3">
        <View className="flex-row items-start justify-between">
          <View className="gap-1">
            <Text className="font-black font-sans text-base text-foreground uppercase">
              Dr. Evelyn Vance, PsyD
            </Text>
            <View className="flex-row items-center gap-2 self-start rounded-full border-2 border-border/30 bg-muted px-3 py-1">
              <Calendar color={colors.primary} size={12} />
              <Text className="font-medium font-sans text-foreground text-xs">
                Today
              </Text>
              <Clock color={colors.primary} size={12} />
              <Text className="font-medium font-sans text-foreground text-xs">
                4:00 PM - 4:45 PM
              </Text>
            </View>
          </View>
          <View className="rounded-full border-2 border-emerald-500/40 bg-emerald-500/20 px-3 py-1">
            <Text className="font-black font-sans text-[10px] text-emerald-600 uppercase tracking-wider">
              Approved
            </Text>
          </View>
        </View>

        <View className="mt-1 rounded-card border-2 border-rose-500/30 bg-rose-500/20 p-3">
          <Text className="font-normal font-sans text-rose-500 text-xs leading-normal">
            LiveKit Video room is ready. Press join to launch the secure stream
            room on your device.
          </Text>
        </View>

        <Button
          className="h-12 w-full"
          icon={<Video color="white" size={18} />}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(
              "Authentication Required",
              "Please sign in to join a live telehealth video room."
            );
          }}
        >
          Join Room (Simulation)
        </Button>
      </View>
    );
  };

  const tabs: {
    id: "sprite" | "habits" | "stress" | "sessions";
    label: string;
    icon: typeof Sparkles;
  }[] = [
    { id: "sprite", label: "Sprite Pet", icon: Sparkles },
    { id: "habits", label: "Wellness Habits", icon: Award },
    { id: "stress", label: "Stress Hub", icon: Activity },
    { id: "sessions", label: "Telehealth Sessions", icon: Calendar },
  ];

  return (
    <View className="gap-14 pb-12">
      {/* 1. HERO SECTION */}
      <HeroSection
        primaryColor={colors.primary}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
      />

      {/* 2. DYNAMIC LIVE SIMULATOR / DASHBOARD PREVIEW */}
      <View className="gap-6">
        <SectionHeader
          description="Experience how our clinic dynamically tracks your habits, Sprite, and appointments in real-time."
          subtitle="Your Wellness Dashboard"
          title="Interactive Simulator"
        />

        {/* Navigation Tabs */}
        <ScrollView
          className="animate-none flex-row"
          contentContainerStyle={{ paddingHorizontal: 4, gap: 10 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeSimTab === id;
            return (
              <Pressable
                className={`rounded-card border-2 px-4 py-2 ${
                  isActive
                    ? "border-primary bg-primary"
                    : "border-border bg-muted"
                }`}
                key={id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSimTab(id);
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Icon color={isActive ? "white" : colors.primary} size={16} />
                  <Text
                    className={`font-black font-sans text-xs uppercase tracking-wider ${isActive ? "text-white" : "text-foreground"}`}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="px-1">
          {activeSimTab === "sprite" && (
            <Animated.View entering={FadeIn.duration(400)}>
              <View className="relative" style={{ overflow: "visible" }}>
                <View
                  className="absolute inset-0 rounded-card bg-border"
                  style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                />
                <View className="gap-section rounded-card border-2 border-border bg-card p-card">
                  {renderSpriteContent()}
                </View>
              </View>
            </Animated.View>
          )}

          {activeSimTab === "habits" && (
            <Animated.View entering={FadeIn.duration(400)}>
              <View className="relative" style={{ overflow: "visible" }}>
                <View
                  className="absolute inset-0 rounded-card bg-border"
                  style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                />
                <View className="gap-section rounded-card border-2 border-border bg-card p-card">
                  <View className="gap-4">
                    <View className="flex-row items-center justify-between border-border/30 border-b-2 pb-3">
                      <View>
                        <Text className="font-black font-sans text-foreground text-lg tracking-tight">
                          Wellness Habit Tree
                        </Text>
                        <Text className="mt-0.5 font-normal font-sans text-muted-foreground text-xs">
                          Perform daily habits to grow your tree and feed your
                          Sprite.
                        </Text>
                      </View>
                      <View className="rounded-full border-2 border-primary/30 bg-primary/20 px-3 py-1">
                        <Text className="font-black font-sans text-primary text-xs">
                          +10 Credits
                        </Text>
                      </View>
                    </View>
                    <View className="gap-3">{renderHabitsContent()}</View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {activeSimTab === "stress" && (
            <Animated.View entering={FadeIn.duration(400)}>
              <View className="relative" style={{ overflow: "visible" }}>
                <View
                  className="absolute inset-0 rounded-card bg-border"
                  style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                />
                <View className="gap-section rounded-card border-2 border-border bg-card p-card">
                  {renderStressContent()}
                </View>
              </View>
            </Animated.View>
          )}

          {activeSimTab === "sessions" && (
            <Animated.View entering={FadeIn.duration(400)}>
              <View className="relative" style={{ overflow: "visible" }}>
                <View
                  className="absolute inset-0 rounded-card bg-border"
                  style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                />
                <View className="gap-section rounded-card border-2 border-border bg-card p-card">
                  {renderSessionsContent()}
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Section divider */}
      <View className="mx-1 h-[3px] bg-primary" />

      {/* 3. PRODUCT CORE CAPABILITIES (FEATURES BUILD ON CODE) */}
      <View className="gap-6">
        <SectionHeader
          subtitle="Engineered for clinical wellness."
          title="Product Features"
        />

        <View className="gap-4 px-1">
          {/* Feature 1: Sprite Wellness loops */}
          <View className="overflow-hidden rounded-card border-2 border-border bg-card">
            <View className="gap-section p-card">
              <View className="flex-row items-start gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-card border-2 border-orange-500/30 bg-orange-500/20">
                  <Sparkles color="#f97316" size={24} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-black font-sans text-foreground text-lg leading-none tracking-tight">
                    Sprite Wellness Loops
                  </Text>
                  <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
                    Keep a virtual companion healthy by building positive
                    habits. Each completed habit rewards Moonlight Credits,
                    grows your Sprite's health, and maintains your streak.
                  </Text>
                </View>
              </View>
            </View>
            <View className="h-1.5 bg-orange-500" />
          </View>

          {/* Feature 2: Wearable Ingestion & Stress Predictor */}
          <View className="overflow-hidden rounded-card border-2 border-border bg-card">
            <View className="gap-section p-card">
              <View className="flex-row items-start gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-card border-2 border-rose-500/30 bg-rose-500/20">
                  <HeartPulse color="#f43f5e" size={24} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-black font-sans text-foreground text-lg leading-none tracking-tight">
                    Real-time Stress Ingestion
                  </Text>
                  <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
                    Stream a 5-feature HRV vector (meanRR, SDNN, RMSSD, pNN50,
                    HR) from your wearable every 250ms. A 360-sample sliding
                    window feeds an ML predictor over HTTP; results persist to
                    Upstash Redis.
                  </Text>
                </View>
              </View>
            </View>
            <View className="h-1.5 bg-rose-500" />
          </View>

          {/* Feature 3: Patient Anonymity & Local Encryption */}
          <View className="overflow-hidden rounded-card border-2 border-border bg-card">
            <View className="gap-section p-card">
              <View className="flex-row items-start gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-card border-2 border-emerald-500/30 bg-emerald-500/20">
                  <LockKeyhole color="#10b981" size={24} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-black font-sans text-foreground text-lg leading-none tracking-tight">
                    On-Device Key Cryptography
                  </Text>
                  <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
                    generateUserSecret() from @doca/crypto creates a 256-bit
                    AES-GCM key via crypto.getRandomValues(). PII is encrypted
                    with crypto.subtle.encrypt + a 12-byte IV before
                    transmission — the server stores only an opaque _securedData
                    blob.
                  </Text>
                </View>
              </View>
            </View>
            <View className="h-1.5 bg-emerald-500" />
          </View>

          {/* Feature 4: LiveKit Teletherapy Rooms */}
          <View className="overflow-hidden rounded-card border-2 border-border bg-card">
            <View className="gap-section p-card">
              <View className="flex-row items-start gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-card border-2 border-indigo-500/30 bg-indigo-500/20">
                  <Video color="#6366f1" size={24} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-black font-sans text-foreground text-lg leading-none tracking-tight">
                    Compliant Video consultations
                  </Text>
                  <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
                    Book direct appointments with licensed practitioners. Join
                    sessions securely with audited attendance tracks, compliance
                    logs, and instant LiveKit connection speeds.
                  </Text>
                </View>
              </View>
            </View>
            <View className="h-1.5 bg-indigo-500" />
          </View>
        </View>
      </View>

      {/* Section divider */}
      <View className="mx-1 h-[3px] bg-primary" />

      {/* 4. SECURITY PIPELINE VISUALIZATION */}
      <View className="gap-6">
        <SectionHeader
          description="generateUserSecret() → encryptUserData() → putPrivacyData. AES-256-GCM with a 12-byte IV, backed by expo-secure-store on iOS/Android. The server never sees the key."
          subtitle="Zero-Knowledge Data Pipeline"
          title="Privacy Infrastructure"
        />

        <SecurityPipeline primaryColor={colors.primary} />
      </View>

      {/* Section divider */}
      <View className="mx-1 h-[3px] bg-primary" />

      {/* 5. GUARDIAN COLLABORATION FLOW (IF GUARDIANS EXIST) */}
      <View className="gap-6">
        <SectionHeader
          description="Guardians subscribe to the patient's stress stream via subscribePatientStressStream. Both parties must acknowledge downloaded data before the 7-day Upstash Redis TTL shortens to 1 day."
          subtitle="Linked Guardian Relationships"
          title="Support Circle"
        />

        <GuardianCollaboration primaryColor={colors.primary} />
      </View>
    </View>
  );
}

// Action Button for Telehealth Session in Live Preview
function SessionJoinAction({
  startAt,
  endAt,
  id,
}: {
  startAt: string;
  endAt: string;
  id: string;
}) {
  const router = useRouter();
  const timing = useSessionTiming(startAt, endAt, "patient");

  if (timing.canJoin) {
    return (
      <Button
        className="mt-1 h-12 w-full"
        icon={<Video color="white" size={18} />}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/appointments/${id}` as Href);
        }}
        variant="primary"
      >
        Join Video Session
      </Button>
    );
  }

  if (timing.timeStatus === "before" && timing.joinWindowOpenAt) {
    const diff = timing.joinWindowOpenAt.getTime() - Date.now();
    const minutes = Math.max(0, Math.ceil(diff / 60_000));

    if (minutes < 60) {
      return (
        <View className="mt-1 items-center justify-center rounded-card border-2 border-amber-500/30 bg-amber-500/20 p-3">
          <Text className="font-bold font-sans text-amber-600 text-xs uppercase tracking-wider">
            Join Room opens in {minutes} minutes
          </Text>
        </View>
      );
    }
  }

  return (
    <View className="mt-1 items-center justify-center rounded-card border-2 border-border bg-muted p-3">
      <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
        Session Finished
      </Text>
    </View>
  );
}
