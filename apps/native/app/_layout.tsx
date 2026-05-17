import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { env } from "@zen-doc/env/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
import { orpc, queryClient } from "@/utils/orpc";

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
  const { isLoaded, isSignedIn } = useAuth();

  const profileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
    })
  );

  const isOnboardingComplete = profileQuery.data?.isOnboardingComplete ?? false;

  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn &&
      !profileQuery.isLoading &&
      !isOnboardingComplete
    ) {
      router.replace("/onboarding");
    }
  }, [
    isLoaded,
    isSignedIn,
    profileQuery.isLoading,
    isOnboardingComplete,
    router,
  ]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [fontsLoaded, fontError] = useFonts(satoshiFonts);

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
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: isDark ? "#09090b" : "#ffffff",
              },
              headerTitleStyle: {
                fontFamily: "Satoshi",
                fontWeight: "500",
                color: isDark ? "#fafafa" : "#09090b",
              },
              headerTintColor: isDark ? "#fafafa" : "#09090b",
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(onboarding)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="test" options={{ headerShown: false }} />
          </Stack>
          <OnboardingCheck />
          <StatusBar style={isDark ? "light" : "dark"} />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
