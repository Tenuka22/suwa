"use client";

import { useQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import {
  Activity,
  ArrowRight,
  Calendar,
  Heart,
  MapPin,
  Stethoscope,
} from "lucide-react-native";
import {
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

interface HomeLandingProps {
  signedIn: boolean;
}

interface HeroSectionProps {
  primaryColor: string;
  signedIn: boolean;
  spriteAction: "idle" | "happy" | "thinking" | "alert";
}

function HeroSection({
  primaryColor,
  spriteAction,
  signedIn,
}: HeroSectionProps) {
  const { height: screenHeight } = useWindowDimensions();
  const primaryHref = signedIn ? "/sprite" : "/(auth)/sign-in";
  const secondaryHref = "/doctors";
  const primaryLabel = signedIn ? "Sprite" : "Sign In";
  const secondaryLabel = "Doctors";

  return (
    <Animated.View className="px-1" entering={FadeIn.duration(800)}>
      <View
        className="relative flex overflow-hidden rounded-card border-2 border-border bg-card py-6"
        style={{ height: screenHeight - 48 }}
      >
        <View className="absolute -top-10 -right-10 h-40 w-40 rotate-12 border-[6px] border-primary/20" />
        <View className="absolute -bottom-8 -left-8 h-28 w-28 bg-primary/10" />
        <View className="absolute top-1/3 right-4 h-1 w-16 bg-primary/30" />

        <View className="h-full flex-1 px-card pb-card">
          {/* Center content */}
          <View className="flex-1 items-center justify-center gap-3">
            <View className="size-16 items-center justify-center overflow-hidden rounded-card">
              <Image
                className="size-14"
                source={require("@/assets/images/Logo.png")}
                style={{
                  height: "100%",
                  width: "100%",
                  resizeMode: "contain",
                }}
              />
            </View>
            <Text className="text-center font-black font-sans text-4xl text-foreground leading-[1.05] tracking-tighter">
              Healthcare <Text className="text-primary">Reimagined</Text>
            </Text>

            <Text className="max-w-xl text-center font-medium font-sans text-base text-muted-foreground leading-relaxed">
              Giving you the power that you never had in medical sector by
              empoveering you with tooling.
            </Text>

            <SpriteAnimation action={spriteAction} size="lg" />
          </View>

          {/* Bottom buttons */}
          <View className="gap-4">
            <View className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                className="h-14 w-full"
                href={primaryHref}
                icon={<ArrowRight color="white" size={18} />}
              >
                {primaryLabel}
              </Button>
              <Button
                className="h-14 w-full"
                href={secondaryHref}
                variant="outline"
              >
                {secondaryLabel}
              </Button>
            </View>
          </View>
        </View>

        <View className="absolute bottom-0 h-2 w-full bg-primary" />
      </View>
    </Animated.View>
  );
}

interface FeatureCardProps {
  color: string;
  description: string;
  href: Href;
  icon: typeof Stethoscope;
  title: string;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: FeatureCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel={`${title}: ${description}`}
      className="flex-1 flex-row items-center gap-4 rounded-xl border-2 border-border bg-card p-4 active:opacity-70"
      onPress={() => router.push(href)}
    >
      <View
        className="items-center justify-center rounded-xl p-3"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon color={color} size={22} strokeWidth={2} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-black font-sans text-foreground text-sm uppercase tracking-tight">
          {title}
        </Text>
        <Text className="font-medium font-sans text-muted-foreground text-xs leading-relaxed">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export function HomeLanding({ signedIn }: HomeLandingProps) {
  const colors = useThemeColor();
  const router = useRouter();

  const spriteQuery = useQuery({
    ...orpc.getSpriteState.queryOptions(),
    enabled: signedIn,
  });

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
  }

  const features: FeatureCardProps[] = [
    {
      icon: Stethoscope,
      title: "Find Doctors",
      description:
        "Browse qualified therapists and mental health professionals",
      href: "/doctors",
      color: colors.primary,
    },
    {
      icon: MapPin,
      title: "Hospital Map",
      description: "Find nearby hospitals and healthcare facilities",
      href: "/map",
      color: colors.primary,
    },
    {
      icon: Calendar,
      title: "Appointments",
      description: "Manage your therapy sessions and bookings",
      href: "/appointments",
      color: colors.primary,
    },
    {
      icon: Activity,
      title: "Stress Hub",
      description: "Monitor your stress levels with real-time tracking",
      href: "/stress-hub",
      color: colors.primary,
    },
    {
      icon: Heart,
      title: "Sprite",
      description: "Your virtual wellness companion with daily exercises",
      href: "/sprite",
      color: colors.primary,
    },
  ];

  return (
    <View className="gap-14 pb-12">
      <HeroSection
        primaryColor={colors.primary}
        signedIn={signedIn}
        spriteAction={spriteAction}
      />

      <View className="gap-6 px-card">
        <View className="gap-1.5">
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
            Explore Features
          </Text>
          <Text className="font-medium font-sans text-muted-foreground text-sm">
            Everything you need for your wellness journey
          </Text>
        </View>

        <View className="gap-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </View>
      </View>
    </View>
  );
}
