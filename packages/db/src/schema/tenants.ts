import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ── Enum values ──────────────────────────────────────────────────────

export const tenantTypeValues = [
  "PRIVATE_HOSPITAL",
  "PUBLIC_HOSPITAL",
] as const;

export const tenantStatusValues = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

export const hospitalServiceValues = [
  "EMERGENCY",
  "THEATRE",
  "ICU",
  "OPD",
  "PHARMACY",
  "LABORATORY",
  "RADIOLOGY",
  "PHYSIOTHERAPY",
  "CARDIOLOGY",
  "PEDIATRICS",
] as const;

export const affiliationStatusValues = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
] as const;

export const attendanceEventTypeValues = [
  "CHECKED_IN",
  "CHECKED_OUT",
  "RETURNED",
  "SCHEDULED_DEPARTURE",
] as const;

export const invitationStatusValues = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
] as const;

export const notificationTypeValues = [
  "HOSPITAL_INVITATION",
  "ATTENDANCE_MARKED",
  "AVAILABILITY_CHANGE",
  "AFFILIATION_STATUS",
] as const;

// ── Tables ───────────────────────────────────────────────────────────

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: tenantTypeValues }).notNull(),
  address: text("address").notNull(),
  contactInfo: text("contact_info"),
  logo: text("logo"),
  status: text("status", { enum: tenantStatusValues })
    .notNull()
    .default("ACTIVE"),
  services: text("services"), // JSON array of hospitalServiceValues
  latitude: text("latitude"),
  longitude: text("longitude"),
  phone: text("phone"),
  website: text("website"),
  placeDataRef: text("place_data_ref"), // reference key from places_data.json
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const tenantAdmins = sqliteTable(
  "tenant_admins",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    tenantUserUnique: uniqueIndex("tenant_admins_tenant_user_unique").on(
      table.tenantId,
      table.userId
    ),
  })
);

export const doctorHospitalAffiliations = sqliteTable(
  "doctor_hospital_affiliations",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id").notNull(),
    tenantId: text("tenant_id").notNull(),
    status: text("status", { enum: affiliationStatusValues })
      .notNull()
      .default("PENDING"),
    availabilityWindows: text("availability_windows"), // JSON: [{ dayOfWeek, startTime, endTime }]
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    doctorTenantUnique: uniqueIndex(
      "doctor_hospital_affiliations_doctor_tenant_unique"
    ).on(table.doctorId, table.tenantId),
  })
);

export const hospitalAttendanceEvents = sqliteTable(
  "hospital_attendance_events",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id").notNull(),
    tenantId: text("tenant_id").notNull(),
    clinicId: text("clinic_id"), // null = hospital-level event
    timestamp: text("timestamp").notNull(),
    eventType: text("event_type", { enum: attendanceEventTypeValues }).notNull(),
    note: text("note"),
    recordedBy: text("recorded_by").notNull(), // userId who logged this
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  }
);

export const clinics = sqliteTable("clinics", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  specialization: text("specialization"),
  schedule: text("schedule"), // JSON: description of clinic schedule
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const clinicAttendance = sqliteTable("clinic_attendance", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull(),
  doctorId: text("doctor_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  arrivedAt: text("arrived_at"),
  leftAt: text("left_at"),
  recordedBy: text("recorded_by").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const doctorHospitalInvitations = sqliteTable(
  "doctor_hospital_invitations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    doctorId: text("doctor_id").notNull(),
    invitedBy: text("invited_by").notNull(),
    status: text("status", { enum: invitationStatusValues })
      .notNull()
      .default("PENDING"),
    message: text("message"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    tenantDoctorUnique: uniqueIndex(
      "doctor_hospital_invitations_tenant_doctor_unique"
    ).on(table.tenantId, table.doctorId),
  })
);

export const hospitalAvailabilityOverrides = sqliteTable(
  "hospital_availability_overrides",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id").notNull(),
    tenantId: text("tenant_id").notNull(),
    startAt: text("start_at").notNull(),
    endAt: text("end_at").notNull(),
    reason: text("reason"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  }
);

export const tenantAuditLogs = sqliteTable("tenant_audit_logs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: text("details"), // JSON
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const tenantNotifications = sqliteTable("tenant_notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: notificationTypeValues }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityId: text("entity_id"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ── Type exports ─────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type TenantAdmin = typeof tenantAdmins.$inferSelect;
export type DoctorHospitalAffiliation =
  typeof doctorHospitalAffiliations.$inferSelect;
export type HospitalAttendanceEvent =
  typeof hospitalAttendanceEvents.$inferSelect;
export type Clinic = typeof clinics.$inferSelect;
export type ClinicAttendance = typeof clinicAttendance.$inferSelect;
export type DoctorHospitalInvitation =
  typeof doctorHospitalInvitations.$inferSelect;
export type HospitalAvailabilityOverride =
  typeof hospitalAvailabilityOverrides.$inferSelect;
export type TenantAuditLog = typeof tenantAuditLogs.$inferSelect;
export type TenantNotification = typeof tenantNotifications.$inferSelect;
