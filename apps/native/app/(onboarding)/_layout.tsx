import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";

import { orpc } from "@/utils/orpc";

export default function OnboardingLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      throwOnError: false,
      queryFn: async () => {
        try {
          const data = await orpc.getPatientProfile.call();
          return data ?? null;
        } catch {
          return null;
        }
      },
    })
  );

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!patientProfileQuery.isFetched) {
    return null;
  }

  if (patientProfileQuery.data) {
    const profile = patientProfileQuery.data;
    if (profile?.secured && profile?._securedData) {
      return <Redirect href="/(patient)" />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
