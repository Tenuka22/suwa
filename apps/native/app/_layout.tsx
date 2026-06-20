"use client";

import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { env } from "@suwa/env/native";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Redirect, Stack, usePathname } from "expo-router";
import { hideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { maybeCompleteAuthSession } from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ErrorDialog,
  useErrorDialog,
} from "@/components/design/ui/error-dialog";
import { showToast } from "@/components/design/ui/toast";
import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
import { orpc, queryClient, setQueryErrorHandler } from "@/utils/orpc";
import { StripePaymentProvider } from "@/utils/stripe";

maybeCompleteAuthSession();

function ClerkApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkAuthTokenGetter(getToken);

    return () => {
      setClerkAuthTokenGetter(null);
    };
  }, [getToken]);

  return null;
}

type OnboardingRedirectPath = "/(patient)" | "/landing" | "/profile";

function getOnboardingRedirect({
  hasPatientProfile,
  isProfileLoaded,
  isSignedIn,
  needsRepair,
  pathname,
}: {
  hasPatientProfile: boolean;
  isProfileLoaded: boolean;
  isSignedIn: boolean | undefined;
  needsRepair: boolean;
  pathname: string;
}): OnboardingRedirectPath | null {
  const isPublicAuthPath =
    pathname === "/landing" ||
    pathname === "/sign-in" ||
    pathname === "/sign-up";

  if (isSignedIn === false && !isPublicAuthPath) {
    return "/landing";
  }

  if (!(isSignedIn && isProfileLoaded)) {
    return null;
  }

  if (!hasPatientProfile) {
    return pathname === "/landing" || pathname === "/profile"
      ? null
      : "/landing";
  }

  const isRepairPath =
    pathname === "/profile" || pathname.startsWith("/onboarding");
  if (needsRepair && !isRepairPath) {
    return "/profile";
  }

  if (!needsRepair && pathname === "/landing") {
    return "/(patient)";
  }

  return null;
}

function OnboardingCheck() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      meta: { ignoreError: true },
    })
  );

  const isProfileLoaded = patientProfileQuery.isFetched;

  // Prefetch HomeLanding data once profile is confirmed to eliminate loading states
  useEffect(() => {
    if (isLoaded && isSignedIn && isProfileLoaded) {
      const patientData = patientProfileQuery.data;

      const needsRepair =
        patientData && !(patientData.secured && patientData._securedData);

      if (patientData && !needsRepair) {
        queryClient.prefetchQuery(orpc.listPatientSessions.queryOptions());
      }
    }
  }, [isLoaded, isSignedIn, isProfileLoaded, patientProfileQuery.data]);

  if (!isLoaded) {
    return (
      <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-background">
        <ActivityIndicator className="text-primary" size="large" />
      </View>
    );
  }

  if (isLoaded && isSignedIn && !isProfileLoaded) {
    return (
      <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-background">
        <ActivityIndicator className="text-primary" size="large" />
      </View>
    );
  }

  const patientData = patientProfileQuery.data;
  const hasPatientProfile = Boolean(patientData);
  const needsRepair = Boolean(
    patientData && !(patientData.secured && patientData._securedData)
  );
  const redirectPath = getOnboardingRedirect({
    hasPatientProfile,
    isProfileLoaded,
    isSignedIn,
    needsRepair,
    pathname,
  });

  if (redirectPath) {
    return <Redirect href={redirectPath} />;
  }

  return null;
}

function GlobalErrorBoundary({
  showError,
  children,
}: {
  showError: (title: string, message: string) => void;
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setError(event.error);
      setHasError(true);
      showError(
        "Unexpected error",
        event.error?.message ?? "Something went wrong. Please restart the app."
      );
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, [showError]);

  if (hasError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-page">
        <Text className="text-center font-black font-sans text-2xl text-destructive">
          Something went wrong
        </Text>
        <Text className="mt-2 text-center font-normal font-sans text-foreground text-sm">
          {error?.message ?? "An unexpected error occurred."}
        </Text>
      </View>
    );
  }

  return children;
}

function LayoutContent() {
  const { dialogProps, showError } = useErrorDialog();
  const background = "#fbf7f0";
  const foreground = "#243a31";

  useEffect(() => {
    setQueryErrorHandler((error) => {
      showToast({
        type: "error",
        title: "Something went wrong",
        message: (error as Error)?.message ?? "Please try again.",
      });
    });
  }, []);

  return (
    <ClerkProvider
      publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ClerkApiAuthBridge />
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StripePaymentProvider>
            <GlobalErrorBoundary showError={showError}>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: background,
                  },
                  headerTitleStyle: {
                    fontFamily: "Poppins",
                    fontWeight: "500",
                    color: foreground,
                  },
                  headerTintColor: foreground,
                  headerShadowVisible: false,
                }}
              >
                <Stack.Screen
                  name="(patient)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="test" options={{ headerShown: false }} />
              </Stack>
              <OnboardingCheck />
            </GlobalErrorBoundary>
            <StatusBar backgroundColor={background} style="dark" />
          </StripePaymentProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
      <ErrorDialog {...dialogProps} />
    </ClerkProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Playfair Display": require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
    "Playfair Display-Italic": require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideAsync().catch(() => {
        // The splash screen may already be hidden during web hot reloads.
      });
    }
  }, [fontsLoaded, fontError]);

  if (!(fontsLoaded || fontError)) {
    return null;
  }

  return <LayoutContent />;
}
