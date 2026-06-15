import { useMutation, useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useDoctorStats() {
  return useQuery(orpc.doctorStats.queryOptions());
}

export function useDoctorSessions() {
  return useQuery(orpc.listDoctorSessions.queryOptions());
}

export function useSessionStats() {
  return useQuery(orpc.sessionStats.queryOptions());
}

export function useAvailabilityStats() {
  return useQuery(orpc.availabilityStats.queryOptions());
}

export function useWeeklyAvailability() {
  return useQuery(orpc.getWeeklyAvailability.queryOptions());
}

export function useSaveAvailability() {
  return useMutation(orpc.saveWeeklyAvailability.mutationOptions());
}

export function useConnectAccountStatus() {
  return useQuery(orpc.getConnectAccountStatus.queryOptions());
}

export function useCreateConnectAccountLink() {
  return useMutation(orpc.createConnectAccountLink.mutationOptions());
}

export function usePlanStats() {
  return useQuery(orpc.planStats.queryOptions());
}

export function useDoctorPlans() {
  return useQuery(orpc.listDoctorPlans.queryOptions());
}

export function useCreateDoctorPlan() {
  return useMutation(orpc.createDoctorPlan.mutationOptions());
}

export function useProfileStats() {
  return useQuery(orpc.profileStats.queryOptions());
}

export function useDoctorProfile() {
  return useQuery(orpc.doctorProfile.queryOptions());
}

export function useSaveDoctorProfile() {
  return useMutation(orpc.saveDoctorProfile.mutationOptions());
}

export function useRespondSession() {
  return useMutation(orpc.respondSession.mutationOptions());
}

export function useLiveKitToken(input: { sessionId: string }) {
  return useQuery(orpc.getLiveKitToken.queryOptions({ input }));
}
