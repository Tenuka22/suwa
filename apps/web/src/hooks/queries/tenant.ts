import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

// ── Tenant CRUD ──────────────────────────────────────────────────────

export function useListTenants() {
  return useQuery(orpc.listTenants.queryOptions());
}

export function useGetTenant(tenantId: string) {
  return useQuery(orpc.getTenant.queryOptions({ input: { tenantId } }));
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.createTenant.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.listTenants.queryKey() });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.updateTenant.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(
        { queryKey: orpc.getTenant.queryKey({ input: { tenantId: variables.id } }) }
      );
      queryClient.invalidateQueries({ queryKey: orpc.listTenants.queryKey() });
    },
  });
}

export function useGetTenantAuditLog(
  tenantId: string,
  page?: number,
  pageSize?: number
) {
  return useQuery(
    orpc.getTenantAuditLog.queryOptions({
      input: { tenantId, page, pageSize },
    })
  );
}

// ── Invitations ──────────────────────────────────────────────────────

export function useListTenantInvitations(
  tenantId: string,
  status?: "PENDING" | "ACCEPTED" | "DECLINED"
) {
  return useQuery(
    orpc.listTenantInvitations.queryOptions({ input: { tenantId, status } })
  );
}

export function useListDoctorInvitations() {
  return useQuery(orpc.listDoctorInvitations.queryOptions());
}

export function useInviteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.inviteDoctor.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.listTenantInvitations.queryKey({
          input: { tenantId: variables.tenantId },
        }),
      });
    },
  });
}

export function useRespondInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.respondInvitation.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.listDoctorInvitations.queryKey() });
      queryClient.invalidateQueries({ queryKey: orpc.listDoctorAffiliations.queryKey() });
    },
  });
}

// ── Affiliations ─────────────────────────────────────────────────────

export function useListTenantAffiliations(
  tenantId: string,
  status?: "PENDING" | "ACTIVE" | "INACTIVE"
) {
  return useQuery(
    orpc.listTenantAffiliations.queryOptions({ input: { tenantId, status } })
  );
}

export function useListDoctorAffiliations() {
  return useQuery(orpc.listDoctorAffiliations.queryOptions());
}

export function useUpdateAffiliationWindows() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.updateAffiliationWindows.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.listDoctorAffiliations.queryKey() });
    },
  });
}

// ── Attendance ───────────────────────────────────────────────────────

export function useGetAttendance(
  tenantId: string,
  opts?: { doctorId?: string; date?: string }
) {
  return useQuery(
    orpc.getAttendance.queryOptions({ input: { tenantId, ...opts } })
  );
}

export function useGetDoctorHospitalStatus(tenantId: string, doctorId: string) {
  return useQuery(
    orpc.getDoctorHospitalStatus.queryOptions({ input: { tenantId, doctorId } })
  );
}

export function useLogAttendanceEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.logAttendanceEvent.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.getAttendance.queryKey({
          input: { tenantId: variables.tenantId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.getDoctorHospitalStatus.queryKey({
          input: { tenantId: variables.tenantId, doctorId: variables.doctorId },
        }),
      });
    },
  });
}

export function useUpdateAttendanceEvent() {
  return useMutation(orpc.updateAttendanceEvent.mutationOptions());
}

export function useDeleteAttendanceEvent() {
  return useMutation(orpc.deleteAttendanceEvent.mutationOptions());
}

// ── Clinics ──────────────────────────────────────────────────────────

export function useListClinics(tenantId: string) {
  return useQuery(orpc.listClinics.queryOptions({ input: { tenantId } }));
}

export function useCreateClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.createClinic.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.listClinics.queryKey({
          input: { tenantId: variables.tenantId },
        }),
      });
    },
  });
}

export function useMarkClinicAttendance() {
  return useMutation(orpc.markClinicAttendance.mutationOptions());
}

export function useGetClinicAttendance(clinicId: string, date?: string) {
  return useQuery(
    orpc.getClinicAttendance.queryOptions({ input: { clinicId, date } })
  );
}

// ── Availability overrides ───────────────────────────────────────────

export function useListAvailabilityOverrides(tenantId?: string) {
  return useQuery(
    orpc.listAvailabilityOverrides.queryOptions({ input: { tenantId } })
  );
}

export function useCreateAvailabilityOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.createAvailabilityOverride.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        { queryKey: orpc.listAvailabilityOverrides.queryKey({ input: {} }) }
      );
    },
  });
}

export function useDeleteAvailabilityOverride() {
  return useMutation(orpc.deleteAvailabilityOverride.mutationOptions());
}

export function useGetDoctorHospitalBlocks(
  doctorId: string,
  from: string,
  to: string
) {
  return useQuery(
    orpc.getDoctorHospitalBlocks.queryOptions({ input: { doctorId, from, to } })
  );
}

export function useCheckAffiliationConflicts() {
  return useMutation(orpc.checkAffiliationConflicts.mutationOptions());
}

// ── Notifications ────────────────────────────────────────────────────

export function useListNotifications() {
  return useQuery(orpc.listNotifications.queryOptions());
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.markNotificationRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.listNotifications.queryKey() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.markAllNotificationsRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.listNotifications.queryKey() });
    },
  });
}
