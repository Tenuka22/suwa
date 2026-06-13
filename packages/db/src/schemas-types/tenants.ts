import { z } from "zod";

import {
  affiliationStatusValues,
  attendanceEventTypeValues,
  hospitalServiceValues,
  invitationStatusValues,
  tenantStatusValues,
  tenantTypeValues,
} from "../schema/tenants";

// ── Enum schemas ─────────────────────────────────────────────────────

export const tenantTypeSchema = z.enum(tenantTypeValues);
export const tenantStatusSchema = z.enum(tenantStatusValues);
export const hospitalServiceSchema = z.enum(hospitalServiceValues);
export const affiliationStatusSchema = z.enum(affiliationStatusValues);
export const attendanceEventTypeSchema = z.enum(attendanceEventTypeValues);
export const invitationStatusSchema = z.enum(invitationStatusValues);

// ── Tenant CRUD schemas ──────────────────────────────────────────────

export const createTenantSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: tenantTypeSchema,
  address: z.string().trim().min(1).max(500),
  contactInfo: z.string().trim().max(500).optional(),
  logo: z.string().trim().max(500).optional(),
  services: z.array(hospitalServiceSchema).max(20).optional(),
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
  phone: z.string().trim().max(50).optional(),
  website: z.string().trim().max(500).optional(),
  placeDataRef: z.string().trim().min(1).max(200),
});

export const updateTenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(200).optional(),
  address: z.string().trim().min(1).max(500).optional(),
  contactInfo: z.string().trim().max(500).nullable().optional(),
  logo: z.string().trim().max(500).nullable().optional(),
  status: tenantStatusSchema.optional(),
  services: z.array(hospitalServiceSchema).max(20).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  website: z.string().trim().max(500).nullable().optional(),
});

export const tenantIdSchema = z.object({
  tenantId: z.string().min(1),
});

// ── Affiliation schemas ──────────────────────────────────────────────

export const availabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const inviteDoctorSchema = z.object({
  tenantId: z.string().min(1),
  doctorId: z.string().min(1),
  message: z.string().trim().max(500).optional(),
});

export const respondInvitationSchema = z.object({
  invitationId: z.string().min(1),
  action: z.enum(["ACCEPTED", "DECLINED"]),
  availabilityWindows: z.array(availabilityWindowSchema).max(20).optional(),
});

export const updateAffiliationWindowsSchema = z.object({
  affiliationId: z.string().min(1),
  availabilityWindows: z.array(availabilityWindowSchema).max(20),
});

// ── Attendance schemas ───────────────────────────────────────────────

export const logAttendanceEventSchema = z.object({
  doctorId: z.string().min(1),
  tenantId: z.string().min(1),
  clinicId: z.string().min(1).optional(),
  timestamp: z.iso.datetime(),
  eventType: attendanceEventTypeSchema,
  note: z.string().trim().max(500).optional(),
});

export const updateAttendanceEventSchema = z.object({
  eventId: z.string().min(1),
  timestamp: z.iso.datetime().optional(),
  eventType: attendanceEventTypeSchema.optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const getAttendanceSchema = z.object({
  tenantId: z.string().min(1),
  doctorId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ── Clinic schemas ───────────────────────────────────────────────────

export const createClinicSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  specialization: z.string().trim().max(200).optional(),
  schedule: z.string().trim().max(1000).optional(),
});

export const updateClinicSchema = z.object({
  clinicId: z.string().min(1),
  name: z.string().trim().min(1).max(200).optional(),
  specialization: z.string().trim().max(200).nullable().optional(),
  schedule: z.string().trim().max(1000).nullable().optional(),
});

export const clinicAttendanceSchema = z.object({
  clinicId: z.string().min(1),
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arrivedAt: z.iso.datetime().optional(),
  leftAt: z.iso.datetime().optional(),
});

// ── Availability override schemas ────────────────────────────────────

export const createAvailabilityOverrideSchema = z.object({
  tenantId: z.string().min(1),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  reason: z.string().trim().max(500).optional(),
});

export const deleteAvailabilityOverrideSchema = z.object({
  overrideId: z.string().min(1),
});

// ── Notification schemas ─────────────────────────────────────────────

export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1),
});
