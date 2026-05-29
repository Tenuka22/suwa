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

  const guardianProfileQuery = useQuery(
    orpc.getGuardianProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      throwOnError: false,
      queryFn: async () => {
        try {
          const data = await orpc.getGuardianProfile.call();
          return data ?? null;
        } catch {
          return null;
        }
      },
    })
  );

  const hasPatientProfile = Boolean(patientProfileQuery.data);
  const hasGuardianProfile = Boolean(guardianProfileQuery.data);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!(patientProfileQuery.isFetched && guardianProfileQuery.isFetched)) {
    return null;
  }

  if (hasPatientProfile || hasGuardianProfile) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
