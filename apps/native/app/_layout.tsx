import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { env } from "@zen-doc/env/native";
import { useFonts } from "expo-font";
import { Redirect, Stack, usePathname } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChatOverlay } from "@/components/chat/chat-overlay";
import { ErrorDialog, useErrorDialog } from "@/components/ui/error-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
import { orpc, queryClient, setQueryErrorHandler } from "@/utils/orpc";
import { StripePaymentProvider } from "@/utils/stripe";
import { useThemeColor } from "@/utils/theme";

preventAutoHideAsync().catch(() => undefined);
WebBrowser.maybeCompleteAuthSession();

const satoshiFonts = {
  Satoshi: require("../assets/Satoshi_Complete/Fonts/TTF/Satoshi-Variable.ttf"),
};

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
function OnboardingCheck() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const colors = useThemeColor();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      meta: { ignoreError: true },
    })
  );

  const guardianProfileQuery = useQuery(
    orpc.getGuardianProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      meta: { ignoreError: true },
    })
  );

  const isProfileLoaded =
    patientProfileQuery.isFetched && guardianProfileQuery.isFetched;

  // Prefetch HomeLanding data once profile is confirmed to eliminate loading states
  useEffect(() => {
    if (isLoaded && isSignedIn && isProfileLoaded) {
      const patientData = patientProfileQuery.data;
      const guardianData = guardianProfileQuery.data;

      const needsRepair =
        patientData && !(patientData.secured && patientData._securedData);

      // If profile is fully set up, prefetch the dashboard data
      if ((patientData && !needsRepair) || guardianData) {
        queryClient.prefetchQuery(orpc.getSpriteState.queryOptions());
        queryClient.prefetchQuery(orpc.getMoonlightCredits.queryOptions());
        queryClient.prefetchQuery(orpc.getTodayTasks.queryOptions());
        queryClient.prefetchQuery(orpc.listPatientSessions.queryOptions());
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    isProfileLoaded,
    patientProfileQuery.data,
    guardianProfileQuery.data,
  ]);

  if (!isLoaded) {
    return (
      <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isLoaded && isSignedIn && !isProfileLoaded) {
    return (
      <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (
    isLoaded &&
    isSignedIn === false &&
    pathname !== "/landing" &&
    pathname !== "/sign-in" &&
    pathname !== "/sign-up"
  ) {
    return <Redirect href="/landing" />;
  }

  if (isLoaded && isSignedIn && isProfileLoaded) {
    const patientData = patientProfileQuery.data;
    const guardianData = guardianProfileQuery.data;

    if (!(patientData || guardianData)) {
      console.log("[OnboardingCheck] no profile, redirecting to /onboarding");
      if (
        pathname !== "/onboarding" &&
        !pathname.startsWith("/onboarding") &&
        pathname !== "/profile"
      ) {
        return <Redirect href="/onboarding" />;
      }
      return null;
    }

    if (guardianData && !patientData) {
      if (pathname === "/" || pathname.startsWith("/onboarding")) {
        return <Redirect href="/(guardian)" />;
      }
      return null;
    }

    if (patientData) {
      const needsRepair = !(patientData.secured && patientData._securedData);
      console.log("[OnboardingCheck] patient profile exists", {
        needsRepair,
        secured: patientData.secured,
        hasSecuredData: !!patientData._securedData,
      });
      if (
        needsRepair &&
        pathname !== "/profile" &&
        !pathname.startsWith("/onboarding")
      ) {
        return <Redirect href="/profile" />;
      }

      if (
        !needsRepair &&
        (pathname === "/" || pathname.startsWith("/onboarding"))
      ) {
        return <Redirect href="/(patient)" />;
      }
    }
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
  const { background, foreground } = useThemeColor();
  const [fontsLoaded, fontError] = useFonts(satoshiFonts);
  const { toast } = useToast();
  const { dialogProps, showError } = useErrorDialog();

  useEffect(() => {
    setQueryErrorHandler((error) => {
      toast({
        type: "error",
        title: "Something went wrong",
        message: (error as Error)?.message ?? "Please try again.",
      });
    });
  }, [toast]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded]);

  if (!(fontsLoaded || fontError)) {
    return null;
  }

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
                    fontFamily: "Satoshi",
                    fontWeight: "500",
                    color: foreground,
                  },
                  headerTintColor: foreground,
                  headerShadowVisible: false,
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(onboarding)/onboarding"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(patient)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(guardian)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="test" options={{ headerShown: false }} />
              </Stack>
              <OnboardingCheck />
              <ChatOverlay />
            </GlobalErrorBoundary>
            <StatusBar style="auto" />
          </StripePaymentProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
      <ErrorDialog {...dialogProps} />
    </ClerkProvider>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <LayoutContent />
    </ToastProvider>
  );
}
