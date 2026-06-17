import {
  doctorHospitalAffiliations,
  doctorHospitalInvitations,
  doctorProfiles,
  tenantAuditLogs,
  tenantNotifications,
} from "@suwa/db";
import {
  inviteDoctorSchema,
  respondInvitationSchema,
  updateAffiliationWindowsSchema,
} from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAuth, requireTenantAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

// Send invitation to doctor
export const inviteDoctorRoute = protectedProcedure
  .input(inviteDoctorSchema)
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();

    // Check if invitation already exists
    const [existing] = await context.db
      .select()
      .from(doctorHospitalInvitations)
      .where(
        and(
          eq(doctorHospitalInvitations.tenantId, input.tenantId),
          eq(doctorHospitalInvitations.doctorId, input.doctorId)
        )
      )
      .limit(1);

    if (existing?.status === "PENDING") {
      throw new Error("Invitation already sent and pending");
    }

    if (existing?.status === "ACCEPTED") {
      throw new Error("Doctor is already affiliated with this hospital");
    }

    const invitationId = crypto.randomUUID();

    // Upsert (delete old declined and create new, or just create)
    if (existing) {
      await context.db
        .delete(doctorHospitalInvitations)
        .where(eq(doctorHospitalInvitations.id, existing.id));
    }

    await context.db.insert(doctorHospitalInvitations).values({
      id: invitationId,
      tenantId: input.tenantId,
      doctorId: input.doctorId,
      invitedBy: userId,
      status: "PENDING",
      message: input.message ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Notify doctor
    await context.db.insert(tenantNotifications).values({
      id: crypto.randomUUID(),
      userId: input.doctorId,
      type: "HOSPITAL_INVITATION",
      title: "Hospital Invitation",
      message:
        "You have been invited to join a hospital. Please review the invitation.",
      entityId: invitationId,
      isRead: false,
      createdAt: now,
    });

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      actorId: userId,
      action: "DOCTOR_INVITED",
      entityType: "invitation",
      entityId: invitationId,
      details: JSON.stringify({ doctorId: input.doctorId }),
      createdAt: now,
    });

    return { invitationId };
  });

// List pending invitations for a tenant
export const listTenantInvitationsRoute = protectedProcedure
  .input(
    z.object({
      tenantId: z.string().min(1),
      status: z.enum(["PENDING", "ACCEPTED", "DECLINED"]).optional(),
    })
  )
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);

    const query = context.db
      .select()
      .from(doctorHospitalInvitations)
      .where(eq(doctorHospitalInvitations.tenantId, input.tenantId));

    const invitations = await query;

    const filtered = input.status
      ? invitations.filter((i) => i.status === input.status)
      : invitations;

    // Enrich with doctor profile info
    const enriched = await Promise.all(
      filtered.map(async (inv) => {
        const [profile] = await context.db
          .select()
          .from(doctorProfiles)
          .where(eq(doctorProfiles.userId, inv.doctorId))
          .limit(1);

        return {
          ...inv,
          doctorName: profile?.displayName ?? "Unknown Doctor",
          doctorSpecialties: profile?.specialties
            ? (JSON.parse(profile.specialties) as string[])
            : [],
        };
      })
    );

    return { invitations: enriched };
  });

// List invitations for the current doctor
export const listDoctorInvitationsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const invitations = await context.db
      .select()
      .from(doctorHospitalInvitations)
      .where(eq(doctorHospitalInvitations.doctorId, userId));

    return { invitations };
  }
);

// Accept or decline invitation
export const respondInvitationRoute = protectedProcedure
  .input(respondInvitationSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();

    const [invitation] = await context.db
      .select()
      .from(doctorHospitalInvitations)
      .where(eq(doctorHospitalInvitations.id, input.invitationId))
      .limit(1);

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.doctorId !== userId) {
      throw new Error("Not authorized to respond to this invitation");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("Invitation has already been responded to");
    }

    await context.db
      .update(doctorHospitalInvitations)
      .set({ status: input.action, updatedAt: now })
      .where(eq(doctorHospitalInvitations.id, input.invitationId));

    if (input.action === "ACCEPTED") {
      // Create affiliation
      const affiliationId = crypto.randomUUID();
      await context.db.insert(doctorHospitalAffiliations).values({
        id: affiliationId,
        doctorId: userId,
        tenantId: invitation.tenantId,
        status: "ACTIVE",
        availabilityWindows: input.availabilityWindows
          ? JSON.stringify(input.availabilityWindows)
          : null,
        createdAt: now,
        updatedAt: now,
      });

      await context.db.insert(tenantAuditLogs).values({
        id: crypto.randomUUID(),
        tenantId: invitation.tenantId,
        actorId: userId,
        action: "INVITATION_ACCEPTED",
        entityType: "affiliation",
        entityId: affiliationId,
        createdAt: now,
      });

      // Notify tenant admins
      const { tenantAdmins: tenantAdminsTable } = await import("@suwa/db");
      const admins = await context.db
        .select()
        .from(tenantAdminsTable)
        .where(eq(tenantAdminsTable.tenantId, invitation.tenantId));

      for (const admin of admins) {
        await context.db.insert(tenantNotifications).values({
          id: crypto.randomUUID(),
          userId: admin.userId,
          type: "AFFILIATION_STATUS",
          title: "Doctor Accepted Invitation",
          message: "A doctor has accepted your hospital invitation.",
          entityId: affiliationId,
          isRead: false,
          createdAt: now,
        });
      }

      return { affiliationId };
    }

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: invitation.tenantId,
      actorId: userId,
      action: "INVITATION_DECLINED",
      entityType: "invitation",
      entityId: input.invitationId,
      createdAt: now,
    });

    return { affiliationId: null };
  });

// List affiliations for a tenant
export const listTenantAffiliationsRoute = protectedProcedure
  .input(
    z.object({
      tenantId: z.string().min(1),
      status: z.enum(["PENDING", "ACTIVE", "INACTIVE"]).optional(),
    })
  )
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);

    const affiliations = await context.db
      .select()
      .from(doctorHospitalAffiliations)
      .where(eq(doctorHospitalAffiliations.tenantId, input.tenantId));

    const filtered = input.status
      ? affiliations.filter((a) => a.status === input.status)
      : affiliations;

    const enriched = await Promise.all(
      filtered.map(async (aff) => {
        const [profile] = await context.db
          .select()
          .from(doctorProfiles)
          .where(eq(doctorProfiles.userId, aff.doctorId))
          .limit(1);

        return {
          ...aff,
          availabilityWindows: aff.availabilityWindows
            ? (JSON.parse(aff.availabilityWindows) as Array<{
                dayOfWeek: number;
                startTime: string;
                endTime: string;
              }>)
            : [],
          doctorName: profile?.displayName ?? "Unknown Doctor",
          doctorSpecialties: profile?.specialties
            ? (JSON.parse(profile.specialties) as string[])
            : [],
        };
      })
    );

    return { affiliations: enriched };
  });

// List affiliations for the current doctor
export const listDoctorAffiliationsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const affiliations = await context.db
      .select()
      .from(doctorHospitalAffiliations)
      .where(eq(doctorHospitalAffiliations.doctorId, userId));

    const enriched = await Promise.all(
      affiliations.map(async (aff) => {
        const { tenants: tenantsTable } = await import("@suwa/db");
        const [tenant] = await context.db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, aff.tenantId))
          .limit(1);

        return {
          ...aff,
          availabilityWindows: aff.availabilityWindows
            ? (JSON.parse(aff.availabilityWindows) as Array<{
                dayOfWeek: number;
                startTime: string;
                endTime: string;
              }>)
            : [],
          tenantName: tenant?.name ?? "Unknown Hospital",
          tenantType: tenant?.type ?? null,
        };
      })
    );

    return { affiliations: enriched };
  }
);

// Update affiliation availability windows
export const updateAffiliationWindowsRoute = protectedProcedure
  .input(updateAffiliationWindowsSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();

    const [affiliation] = await context.db
      .select()
      .from(doctorHospitalAffiliations)
      .where(eq(doctorHospitalAffiliations.id, input.affiliationId))
      .limit(1);

    if (!affiliation) {
      throw new Error("Affiliation not found");
    }

    // Only the doctor or a tenant admin can update
    const role = context.auth?.sessionClaims?.metadata?.role;
    if (affiliation.doctorId !== userId && role !== "admin") {
      await requireTenantAdmin(context, affiliation.tenantId);
    }

    await context.db
      .update(doctorHospitalAffiliations)
      .set({
        availabilityWindows: JSON.stringify(input.availabilityWindows),
        updatedAt: now,
      })
      .where(eq(doctorHospitalAffiliations.id, input.affiliationId));

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: affiliation.tenantId,
      actorId: userId,
      action: "AVAILABILITY_WINDOWS_UPDATED",
      entityType: "affiliation",
      entityId: input.affiliationId,
      details: JSON.stringify({
        windowCount: input.availabilityWindows.length,
      }),
      createdAt: now,
    });

    return { success: true };
  });
