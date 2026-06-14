import {
  clinicAttendance,
  clinics,
  hospitalAttendanceEvents,
  tenantAuditLogs,
  tenantNotifications,
} from "@zen-doc/db";
import {
  clinicAttendanceSchema,
  getAttendanceSchema,
  logAttendanceEventSchema,
  updateAttendanceEventSchema,
} from "@zen-doc/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAuth, requireTenantAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

// Log a hospital-level attendance event
export const logAttendanceEventRoute = protectedProcedure
  .input(logAttendanceEventSchema)
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();
    const eventId = crypto.randomUUID();

    await context.db.insert(hospitalAttendanceEvents).values({
      id: eventId,
      doctorId: input.doctorId,
      tenantId: input.tenantId,
      clinicId: input.clinicId ?? null,
      timestamp: input.timestamp,
      eventType: input.eventType,
      note: input.note ?? null,
      recordedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      actorId: userId,
      action: "ATTENDANCE_EVENT_LOGGED",
      entityType: "attendance_event",
      entityId: eventId,
      details: JSON.stringify({
        doctorId: input.doctorId,
        eventType: input.eventType,
        timestamp: input.timestamp,
      }),
      createdAt: now,
    });

    // Notify the doctor
    await context.db.insert(tenantNotifications).values({
      id: crypto.randomUUID(),
      userId: input.doctorId,
      type: "ATTENDANCE_MARKED",
      title: "Attendance Recorded",
      message: `Your attendance has been marked: ${input.eventType.replace(/_/g, " ").toLowerCase()}`,
      entityId: eventId,
      isRead: false,
      createdAt: now,
    });

    return { eventId };
  });

// Update an attendance event
export const updateAttendanceEventRoute = protectedProcedure
  .input(updateAttendanceEventSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();

    const [existing] = await context.db
      .select()
      .from(hospitalAttendanceEvents)
      .where(eq(hospitalAttendanceEvents.id, input.eventId))
      .limit(1);

    if (!existing) {
      throw new Error("Attendance event not found");
    }

    await requireTenantAdmin(context, existing.tenantId);

    const updateData: Record<string, unknown> = { updatedAt: now };
    if (input.timestamp !== undefined) {
      updateData.timestamp = input.timestamp;
    }
    if (input.eventType !== undefined) {
      updateData.eventType = input.eventType;
    }
    if (input.note !== undefined) {
      updateData.note = input.note;
    }

    await context.db
      .update(hospitalAttendanceEvents)
      .set(updateData)
      .where(eq(hospitalAttendanceEvents.id, input.eventId));

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: existing.tenantId,
      actorId: userId,
      action: "ATTENDANCE_EVENT_UPDATED",
      entityType: "attendance_event",
      entityId: input.eventId,
      details: JSON.stringify({ changedFields: Object.keys(updateData) }),
      createdAt: now,
    });

    return { success: true };
  });

// Delete an attendance event
export const deleteAttendanceEventRoute = protectedProcedure
  .input(z.object({ eventId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();

    const [existing] = await context.db
      .select()
      .from(hospitalAttendanceEvents)
      .where(eq(hospitalAttendanceEvents.id, input.eventId))
      .limit(1);

    if (!existing) {
      throw new Error("Attendance event not found");
    }

    await requireTenantAdmin(context, existing.tenantId);

    await context.db
      .delete(hospitalAttendanceEvents)
      .where(eq(hospitalAttendanceEvents.id, input.eventId));

    await context.db.insert(tenantAuditLogs).values({
      id: crypto.randomUUID(),
      tenantId: existing.tenantId,
      actorId: userId,
      action: "ATTENDANCE_EVENT_DELETED",
      entityType: "attendance_event",
      entityId: input.eventId,
      createdAt: now,
    });

    return { success: true };
  });

// Get attendance events for a tenant, optionally filtered by doctor and/or date
export const getAttendanceRoute = protectedProcedure
  .input(getAttendanceSchema)
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);

    const events = await context.db
      .select()
      .from(hospitalAttendanceEvents)
      .where(eq(hospitalAttendanceEvents.tenantId, input.tenantId));

    let filtered = events;

    if (input.doctorId) {
      filtered = filtered.filter((e) => e.doctorId === input.doctorId);
    }

    if (input.date) {
      filtered = filtered.filter((e) => e.timestamp.startsWith(input.date!));
    }

    filtered.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return { events: filtered };
  });

// Get doctor's current presence status at a hospital
export const getDoctorHospitalStatusRoute = protectedProcedure
  .input(
    z.object({
      tenantId: z.string().min(1),
      doctorId: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    requireAuth(context);

    const today = new Date().toISOString().split("T")[0]!;

    const allEvents = await context.db
      .select()
      .from(hospitalAttendanceEvents)
      .where(
        and(
          eq(hospitalAttendanceEvents.tenantId, input.tenantId),
          eq(hospitalAttendanceEvents.doctorId, input.doctorId)
        )
      );

    const todayEvents = allEvents.filter((e) => e.timestamp.startsWith(today));

    todayEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const latestEvent = todayEvents.at(-1);

    const isPresent =
      latestEvent?.eventType === "CHECKED_IN" ||
      latestEvent?.eventType === "RETURNED";

    return {
      isPresent,
      latestEvent: latestEvent ?? null,
      todayEvents,
    };
  });

// ── Clinic management ────────────────────────────────────────────────

export const createClinicRoute = protectedProcedure
  .input(
    z.object({
      tenantId: z.string().min(1),
      name: z.string().trim().min(1).max(200),
      specialization: z.string().trim().max(200).optional(),
      schedule: z.string().trim().max(1000).optional(),
    })
  )
  .handler(async ({ context, input }) => {
    await requireTenantAdmin(context, input.tenantId);
    const now = new Date().toISOString();
    const clinicId = crypto.randomUUID();

    await context.db.insert(clinics).values({
      id: clinicId,
      tenantId: input.tenantId,
      name: input.name,
      specialization: input.specialization ?? null,
      schedule: input.schedule ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return { clinicId };
  });

export const updateClinicRoute = protectedProcedure
  .input(
    z.object({
      clinicId: z.string().min(1),
      name: z.string().trim().min(1).max(200).optional(),
      specialization: z.string().trim().max(200).nullable().optional(),
      schedule: z.string().trim().max(1000).nullable().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const [clinic] = await context.db
      .select()
      .from(clinics)
      .where(eq(clinics.id, input.clinicId))
      .limit(1);

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    await requireTenantAdmin(context, clinic.tenantId);
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updatedAt: now };
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.specialization !== undefined) {
      updateData.specialization = input.specialization;
    }
    if (input.schedule !== undefined) {
      updateData.schedule = input.schedule;
    }

    await context.db
      .update(clinics)
      .set(updateData)
      .where(eq(clinics.id, input.clinicId));

    return { success: true };
  });

export const listClinicsRoute = protectedProcedure
  .input(z.object({ tenantId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    requireAuth(context);

    const clinicList = await context.db
      .select()
      .from(clinics)
      .where(eq(clinics.tenantId, input.tenantId));

    return { clinics: clinicList };
  });

// Mark clinic attendance (auto-propagates to hospital level)
export const markClinicAttendanceRoute = protectedProcedure
  .input(clinicAttendanceSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();

    const [clinic] = await context.db
      .select()
      .from(clinics)
      .where(eq(clinics.id, input.clinicId))
      .limit(1);

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    await requireTenantAdmin(context, clinic.tenantId);

    // Upsert clinic attendance for the day
    const [existing] = await context.db
      .select()
      .from(clinicAttendance)
      .where(
        and(
          eq(clinicAttendance.clinicId, input.clinicId),
          eq(clinicAttendance.doctorId, input.doctorId),
          eq(clinicAttendance.date, input.date)
        )
      )
      .limit(1);

    if (existing) {
      const updateData: Record<string, unknown> = { updatedAt: now };
      if (input.arrivedAt !== undefined) {
        updateData.arrivedAt = input.arrivedAt;
      }
      if (input.leftAt !== undefined) {
        updateData.leftAt = input.leftAt;
      }

      await context.db
        .update(clinicAttendance)
        .set(updateData)
        .where(eq(clinicAttendance.id, existing.id));
    } else {
      await context.db.insert(clinicAttendance).values({
        id: crypto.randomUUID(),
        clinicId: input.clinicId,
        doctorId: input.doctorId,
        date: input.date,
        arrivedAt: input.arrivedAt ?? null,
        leftAt: input.leftAt ?? null,
        recordedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // AUTO-PROPAGATION: Sync to hospital-level attendance
    const allHospitalEvents = await context.db
      .select()
      .from(hospitalAttendanceEvents)
      .where(
        and(
          eq(hospitalAttendanceEvents.tenantId, clinic.tenantId),
          eq(hospitalAttendanceEvents.doctorId, input.doctorId)
        )
      );

    const dayEvents = allHospitalEvents.filter((e) =>
      e.timestamp.startsWith(input.date)
    );

    const hasCheckedIn = dayEvents.some((e) => e.eventType === "CHECKED_IN");
    const hasCheckedOut = dayEvents.some((e) => e.eventType === "CHECKED_OUT");

    // Propagate CHECKED_IN if arrivedAt set and not already present
    if (input.arrivedAt && !hasCheckedIn) {
      await context.db.insert(hospitalAttendanceEvents).values({
        id: crypto.randomUUID(),
        doctorId: input.doctorId,
        tenantId: clinic.tenantId,
        clinicId: input.clinicId,
        timestamp: input.arrivedAt,
        eventType: "CHECKED_IN",
        note: `Auto-propagated from clinic: ${clinic.name}`,
        recordedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Propagate CHECKED_OUT if leftAt set and not already checked out
    if (input.leftAt && !hasCheckedOut) {
      await context.db.insert(hospitalAttendanceEvents).values({
        id: crypto.randomUUID(),
        doctorId: input.doctorId,
        tenantId: clinic.tenantId,
        clinicId: input.clinicId,
        timestamp: input.leftAt,
        eventType: "CHECKED_OUT",
        note: `Auto-propagated from clinic: ${clinic.name}`,
        recordedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Notify doctor
    await context.db.insert(tenantNotifications).values({
      id: crypto.randomUUID(),
      userId: input.doctorId,
      type: "ATTENDANCE_MARKED",
      title: "Clinic Attendance Recorded",
      message: `Your attendance at clinic "${clinic.name}" has been recorded.`,
      entityId: input.clinicId,
      isRead: false,
      createdAt: now,
    });

    return { success: true };
  });

export const getClinicAttendanceRoute = protectedProcedure
  .input(
    z.object({
      clinicId: z.string().min(1),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    })
  )
  .handler(async ({ context, input }) => {
    requireAuth(context);

    const [clinic] = await context.db
      .select()
      .from(clinics)
      .where(eq(clinics.id, input.clinicId))
      .limit(1);

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    const records = await context.db
      .select()
      .from(clinicAttendance)
      .where(eq(clinicAttendance.clinicId, input.clinicId));

    const filtered = input.date
      ? records.filter((r) => r.date === input.date)
      : records;

    return { records: filtered, clinic };
  });
