import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { env } from "@zen-doc/env/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorDialog, useErrorDialog } from "@/components/ui/error-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
import { orpc, queryClient, setQueryErrorHandler } from "@/utils/orpc";
import { StripePaymentProvider } from "@/utils/stripe";
import { useThemeColor } from "@/utils/theme";

preventAutoHideAsync().catch(() => undefined);

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
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      throwOnError: false,
    })
  );

  useEffect(() => {
    if (isLoaded && isSignedIn && patientProfileQuery.isFetched) {
      const needsSetup = !(
        patientProfileQuery.data?.secured &&
        patientProfileQuery.data?._securedData
      );
      if (
        needsSetup &&
        pathname !== "/profile" &&
        !pathname.startsWith("/onboarding")
      ) {
        router.replace("/profile");
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    patientProfileQuery.isFetched,
    patientProfileQuery.data,
    router,
    pathname,
  ]);

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

import { Text, View } from "react-native";

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
                  name="(onboarding)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(patient)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="test" options={{ headerShown: false }} />
              </Stack>
              <OnboardingCheck />
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
