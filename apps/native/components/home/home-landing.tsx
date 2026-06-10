import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { type Href, useRouter } from "expo-router";
import {
  Activity,
  ArrowRight,
  Award,
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
  UserCheck,
  Users,
  Video,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

interface HomeLandingProps {
  signedIn: boolean;
}

// Trust Badges
const trustBadges = [
  { label: "On-Device Keys", icon: KeyRound },
  { label: "Zero-Knowledge DB", icon: Database },
  { label: "HIPAA Compliant Video", icon: Video },
] as const;

// Security flow steps
const securitySteps = [
  {
    icon: Fingerprint,
    title: "1. Client Key Generation",
    description:
      "A secure 256-bit AES key is created locally on your device and kept in iOS/Android secure keychain.",
    badge: "Local Only",
  },
  {
    icon: LockKeyhole,
    title: "2. Zero-Knowledge Encryption",
    description:
      "Your name, email, phone, and address are sealed client-side before transmission. The cloud cannot read them.",
    badge: "AES-256",
  },
  {
    icon: ShieldCheck,
    title: "3. Compliant Storage",
    description:
      "Only an encrypted payload (_securedData) is saved to the database. Scanned or viewed only when you log back in.",
    badge: "Protected",
  },
] as const;

// Stress Simulator Mock Data
const STRESS_PREDICT_MOCK = [
  { id: "sb-1", val: 20, hour: "0h" },
  { id: "sb-2", val: 25, hour: "2h" },
  { id: "sb-3", val: 45, hour: "4h" },
  { id: "sb-4", val: 60, hour: "6h" },
  { id: "sb-5", val: 80, hour: "8h" },
  { id: "sb-6", val: 50, hour: "10h" },
  { id: "sb-7", val: 30, hour: "12h" },
  { id: "sb-8", val: 20, hour: "14h" },
  { id: "sb-9", val: 15, hour: "16h" },
  { id: "sb-10", val: 30, hour: "18h" },
  { id: "sb-11", val: 40, hour: "20h" },
  { id: "sb-12", val: 28, hour: "22h" },
] as const;

const getBarColor = (val: number): string => {
  if (val > 70) {
    return "bg-rose-500";
  }
  if (val > 40) {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
};

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
  return (
    <Animated.View className="px-1" entering={FadeIn.duration(800)}>
      <Card className="overflow-hidden p-0">
        <View className="absolute -top-16 -right-16 h-40 w-40 rounded-full border-2 border-primary/5" />
        <View className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary/5" />

        <View className="gap-6 py-6">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-card border-2 border-primary bg-primary">
              <Activity color="white" size={32} />
            </View>
            <View className="flex-1">
              <Text className="font-black font-sans text-[10px] text-primary uppercase tracking-[0.3em]">
                ZenDoc Native
              </Text>
              <Text className="font-black font-sans text-3xl text-foreground leading-none tracking-tighter">
                Secured Wellness
              </Text>
            </View>
          </View>

          <Text className="font-normal font-sans text-lg text-muted-foreground leading-relaxed">
            Care for your mental health with an interactive Sprite companion,
            log daily habits, track real-time wearable stress data, and consult
            therapists in zero-knowledge privacy.
          </Text>

          {/* CTAs */}
          <View className="flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 flex-1"
              href={primaryHref}
              icon={<ArrowRight color="white" size={18} />}
            >
              {primaryLabel}
            </Button>
            <Button
              className="h-12 flex-1"
              href={secondaryHref}
              variant="outline"
            >
              {secondaryLabel}
            </Button>
          </View>

          {/* Trust Badges */}
          <View className="mt-2 flex-row flex-wrap items-center justify-center gap-8 border-border/10 border-t pt-4">
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

        <View className="h-1 w-full bg-primary" />
      </Card>
    </Animated.View>
  );
}

// Security Pipeline Sub-component
function SecurityPipeline({ primaryColor }: { primaryColor: string }) {
  return (
    <View className="px-1">
      <Card className="p-6">
        <View className="relative">
          {/* Connector line */}
          <View className="absolute top-6 bottom-6 left-[23px] w-[2px] bg-border/20" />

          <View className="gap-10">
            {securitySteps.map((step) => (
              <View className="flex-row items-start gap-5" key={step.title}>
                <View className="relative z-10 h-12 w-12 items-center justify-center rounded-card border-2 border-border bg-card shadow-sm">
                  <step.icon color={primaryColor} size={22} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-black font-sans text-base text-foreground tracking-tight">
                      {step.title}
                    </Text>
                    <View className="rounded-full border border-border/5 bg-muted px-2 py-0.5">
                      <Text className="font-bold text-[8px] text-muted-foreground uppercase">
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
      </Card>
    </View>
  );
}

// Guardian Collaboration Sub-component
function GuardianCollaboration({ primaryColor }: { primaryColor: string }) {
  return (
    <View className="px-1">
      <Card>
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 items-center gap-1.5 rounded-card border border-emerald-500/20 bg-emerald-500/10 p-3">
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

            <View className="flex-1 items-center gap-1.5 rounded-card border border-indigo-500/20 bg-indigo-500/10 p-3">
              <Users color="#6366f1" size={20} />
              <Text className="font-black font-sans text-foreground text-xs">
                Guardian Profile
              </Text>
              <Text className="font-bold font-sans text-[8px] text-indigo-600 uppercase">
                Linked Identity
              </Text>
            </View>
          </View>

          <View className="gap-2 rounded-card border border-border/10 bg-muted/30 p-3">
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
      </Card>
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

  // Paths & Labels based on Auth State
  const primaryHref = signedIn ? "/appointments" : "/(auth)/sign-in";
  const secondaryHref = signedIn ? "/profile" : "/(auth)/sign-up";
  const primaryLabel = signedIn ? "Appointments Hub" : "Enter Clinic";
  const secondaryLabel = signedIn ? "Manage Profile" : "Register Profile";

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
      <View className="h-56 w-full items-center justify-center rounded-card border border-border/10 bg-muted/20 py-4">
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

        <View className="h-3 w-full overflow-hidden rounded-full border border-border/10 bg-muted">
          <View
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: `${signedIn ? (spriteQuery.data?.health ?? 100) : 85}%`,
            }}
          />
        </View>

        <View className="mt-1 flex-row gap-2.5">
          <View className="flex-1 items-center justify-center rounded-card border border-border/10 bg-muted/20 p-3">
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
          <View className="flex-1 items-center justify-center rounded-card border border-border/10 bg-muted/20 p-3">
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
          <View className="flex-1 items-center justify-center rounded-card border border-border/10 bg-muted/20 p-3">
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
                  className={`rounded-full border px-3 py-1 ${simMood === mood ? "border-primary bg-primary" : "border-border/30 bg-card"}`}
                  key={mood}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSimMood(mood);
                  }}
                >
                  <Text
                    className={`font-bold text-[10px] uppercase tracking-wider ${simMood === mood ? "text-white" : "text-muted-foreground"}`}
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
            className={`flex-row items-center gap-3 rounded-card border p-3 ${
              task.completed
                ? "border-green-300 bg-green-500/5"
                : "border-border/30 bg-muted/5"
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
        className={`flex-row items-center gap-3 rounded-card border p-3 ${
          habit.completed
            ? "border-green-300 bg-green-500/5"
            : "border-border/30 bg-muted/5"
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

  const renderStressContent = () => {
    return (
      <View className="gap-4">
        <View className="flex-row items-center justify-between border-border/10 border-b pb-3">
          <View>
            <Text className="font-black font-sans text-foreground text-lg tracking-tight">
              Stress Intelligence Hub
            </Text>
            <Text className="mt-0.5 font-normal font-sans text-muted-foreground text-xs">
              Continuous biometrics ingestion and stress trend analytics.
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1">
            <View className="h-2 w-2 rounded-full bg-rose-500" />
            <Text className="font-black font-sans text-[10px] text-rose-500 uppercase tracking-wide">
              Wearable Ingestion Active
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-4 rounded-card border border-border/10 bg-muted/10 p-4">
          <View className="flex-1 gap-1">
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Heart Rate
            </Text>
            <Text className="font-black font-sans text-2xl text-foreground">
              74 BPM
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Stress Score
            </Text>
            <Text className="font-black font-sans text-2xl text-rose-500">
              Low (28/100)
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Biometrics Stream
            </Text>
            <Text className="font-black font-sans text-base text-foreground">
              5 features / s
            </Text>
          </View>
        </View>

        {/* Trend chart representation */}
        <View className="gap-2">
          <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
            Predicted Stress Trend (24h)
          </Text>
          <View className="h-28 justify-end rounded-card border border-border/10 bg-muted/20 p-2">
            <View className="h-full flex-row items-end gap-2 px-2">
              {STRESS_PREDICT_MOCK.map((item) => (
                <View className="flex-1 items-center gap-1" key={item.id}>
                  <View
                    className={`w-full rounded-t-sm ${getBarColor(item.val)}`}
                    style={{ height: `${item.val}%` }}
                  />
                  <Text className="font-bold font-sans text-[7px] text-muted-foreground">
                    {item.hour}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Text className="mt-1 text-center font-normal font-sans text-[11px] text-muted-foreground italic leading-relaxed">
            *Analyzing sample sliding windows of size 360 using our secure
            machine learning predictor.
          </Text>
        </View>
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
                <View className="flex-row items-center gap-2 self-start rounded-full border border-border/5 bg-muted/30 px-3 py-1">
                  <Calendar color={colors.primary} size={12} />
                  <Text className="font-medium font-sans text-foreground text-xs">
                    {new Date(nextSession.startAt).toLocaleDateString()}
                  </Text>
                  <Clock color={colors.primary} size={12} />
                  <Text className="font-medium font-sans text-foreground text-xs">
                    {new Date(nextSession.startAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
              <View className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
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
            <View className="flex-row items-center gap-2 self-start rounded-full border border-border/5 bg-muted/30 px-3 py-1">
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
          <View className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1">
            <Text className="font-black font-sans text-[10px] text-emerald-600 uppercase tracking-wider">
              Approved
            </Text>
          </View>
        </View>

        <View className="mt-1 rounded-card border border-rose-500/10 bg-rose-500/5 p-3">
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
                    : "border-border bg-card"
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
              <Card>{renderSpriteContent()}</Card>
            </Animated.View>
          )}

          {activeSimTab === "habits" && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Card>
                <View className="gap-4">
                  <View className="flex-row items-center justify-between border-border/10 border-b pb-3">
                    <View>
                      <Text className="font-black font-sans text-foreground text-lg tracking-tight">
                        Wellness Habit Tree
                      </Text>
                      <Text className="mt-0.5 font-normal font-sans text-muted-foreground text-xs">
                        Perform daily habits to grow your tree and feed your
                        Sprite.
                      </Text>
                    </View>
                    <View className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                      <Text className="font-black font-sans text-primary text-xs">
                        +10 Credits
                      </Text>
                    </View>
                  </View>

                  {/* Dynamic checklist */}
                  <View className="gap-3">{renderHabitsContent()}</View>
                </View>
              </Card>
            </Animated.View>
          )}

          {activeSimTab === "stress" && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Card>{renderStressContent()}</Card>
            </Animated.View>
          )}

          {activeSimTab === "sessions" && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Card>{renderSessionsContent()}</Card>
            </Animated.View>
          )}
        </View>
      </View>

      {/* 3. PRODUCT CORE CAPABILITIES (FEATURES BUILD ON CODE) */}
      <View className="gap-6">
        <SectionHeader
          subtitle="Engineered for clinical wellness."
          title="Product Features"
        />

        <View className="gap-4 px-1">
          {/* Feature 1: Sprite Wellness loops */}
          <Card>
            <View className="flex-row items-start gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-card border border-orange-500/20 bg-orange-500/10">
                <Sparkles color="#f97316" size={24} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-black font-sans text-foreground text-lg leading-none tracking-tight">
                  Sprite Wellness Loops
                </Text>
                <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
                  Keep a virtual companion healthy by building positive habits.
                  Gamifying mental health ensures consistency, raising clinical
                  compliance rates among patient groups.
                </Text>
              </View>
            </View>
          </Card>

          {/* Feature 2: Wearable Ingestion & Stress Predictor */}
          <Card>
            <View className="flex-row items-start gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-card border border-rose-500/20 bg-rose-500/10">
                <HeartPulse color="#f43f5e" size={24} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-black font-sans text-foreground text-lg leading-none tracking-tight">
                  Real-time Stress Ingestion
                </Text>
                <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
                  Connect smart wearables to automatically stream heart rate,
                  HRV, and respiratory rates. An AI model parses feature samples
                  to detect stress escalation trends before you do.
                </Text>
              </View>
            </View>
          </Card>

          {/* Feature 3: Patient Anonymity & Local Encryption */}
          <Card>
            <View className="flex-row items-start gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-card border border-emerald-500/20 bg-emerald-500/10">
                <LockKeyhole color="#10b981" size={24} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-black font-sans text-foreground text-lg leading-none tracking-tight">
                  On-Device Key Cryptography
                </Text>
                <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
                  Personal identifying data (PII) is encrypted locally on your
                  phone via random AES-256 keys. The server only sees encrypted
                  blobs, guaranteeing complete zero-knowledge privacy.
                </Text>
              </View>
            </View>
          </Card>

          {/* Feature 4: LiveKit Teletherapy Rooms */}
          <Card>
            <View className="flex-row items-start gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-card border border-indigo-500/20 bg-indigo-500/10">
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
          </Card>
        </View>
      </View>

      {/* 4. SECURITY PIPELINE VISUALIZATION */}
      <View className="gap-6">
        <SectionHeader
          description="How ZenDoc keeps your medical and identifying data completely private using on-device cryptography."
          subtitle="Zero-Knowledge Data Pipeline"
          title="Privacy Infrastructure"
        />

        <SecurityPipeline primaryColor={colors.primary} />
      </View>

      {/* 5. GUARDIAN COLLABORATION FLOW (IF GUARDIANS EXIST) */}
      <View className="gap-6">
        <SectionHeader
          description="Patients can easily invite guardians by email or phone to monitor progress, with encrypted verification flows."
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
        <View className="mt-1 items-center justify-center rounded-card border border-amber-500/20 bg-amber-500/10 p-3">
          <Text className="font-bold font-sans text-amber-600 text-xs uppercase tracking-wider">
            Join Room opens in {minutes} minutes
          </Text>
        </View>
      );
    }
  }

  return (
    <View className="mt-1 items-center justify-center rounded-card border border-border/10 bg-muted p-3">
      <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
        Session Finished
      </Text>
    </View>
  );
}
