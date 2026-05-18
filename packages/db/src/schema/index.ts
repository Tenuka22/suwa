import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const scheduleKindValues = ["open", "block", "session"] as const;
const scheduleNoteValues = [
  "home",
  "work",
  "pharmacy",
  "after_gym",
  "other",
] as const;
const doctorFileKindValues = [
  "portrait",
  "qualification",
  "intro_video",
  "other",
] as const;

export const doctorProfiles = sqliteTable("doctor_profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  headline: text("headline"),
  bio: text("bio"),
  licenseNumber: text("license_number"),
  location: text("location"),
  placeName: text("place_name"),
  placeAddress: text("place_address"),
  placeDescription: text("place_description"),
  experienceStartYear: integer("experience_start_year"),
  specialties: text("specialties"),
  languages: text("languages"),
  consultationModes: text("consultation_modes"),
  focusAreas: text("focus_areas"),
  approachSteps: text("approach_steps"),
  approach: text("approach"),
  education: text("education"),
  permanent: integer("permanent", { mode: "boolean" }).notNull().default(false),
  stripeAccountId: text("stripe_account_id"),
  stripeAccountEnabled: integer("stripe_account_enabled", {
    mode: "boolean",
  }).default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const doctorSessions = sqliteTable("doctor_sessions", {
  id: text("id").primaryKey(),
  doctorId: text("doctor_id").notNull(),
  patientId: text("patient_id").notNull(),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
  status: text("status").notNull().default("scheduled"), // "scheduled" | "attended" | "cancelled"
  payoutStatus: text("payout_status").notNull().default("none"), // "none" | "pending" | "paid" | "failed"
  payoutTransferId: text("payout_transfer_id"),
  payoutAmount: integer("payout_amount"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const doctorFiles = sqliteTable(
  "doctor_files",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileKind: text("file_kind", { enum: doctorFileKindValues }).notNull(),
    caption: text("caption"),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    fileKeyUnique: uniqueIndex("doctor_files_file_key_unique").on(
      table.fileKey
    ),
  })
);

export const doctorScheduleEntries = sqliteTable(
  "doctor_schedule_entries",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id").notNull(),
    kind: text("kind", { enum: scheduleKindValues }).notNull(),
    noteKind: text("note_kind", { enum: scheduleNoteValues }),
    startAt: text("start_at").notNull(),
    endAt: text("end_at").notNull(),
    sessionId: text("session_id"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    sessionUnique: uniqueIndex("doctor_schedule_entries_session_id_unique").on(
      table.sessionId
    ),
  })
);

export const patientProfiles = sqliteTable("patient_profiles", {
  userId: text("user_id").primaryKey(),
  alias: text("alias").notNull(),
  phone: text("phone"),
  email: text("email"),
  guardianUserId: text("guardian_user_id"),
  guardianEmail: text("guardian_email"),
  guardianPhone: text("guardian_phone"),
  guardianRequestStatus: text("guardian_request_status"), // "pending" | "approved" | null
  isOnboardingComplete: integer("is_onboarding_complete", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const doctorEducationEntries = sqliteTable("doctor_education_entries", {
  id: text("id").primaryKey(),
  doctorId: text("doctor_id").notNull(),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  year: integer("year"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const guardianProfiles = sqliteTable(
  "guardian_profiles",
  {
    userId: text("user_id").primaryKey(),
    clerkUserId: text("clerk_user_id"),
    email: text("email").notNull(),
    phone: text("phone"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    emailUnique: uniqueIndex("guardian_email_unique").on(table.email),
  })
);

export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type DoctorSession = typeof doctorSessions.$inferSelect;
export type DoctorFile = typeof doctorFiles.$inferSelect;
export type DoctorScheduleEntry = typeof doctorScheduleEntries.$inferSelect;
export type DoctorEducationEntry = typeof doctorEducationEntries.$inferSelect;
export type PatientProfile = typeof patientProfiles.$inferSelect;
export type GuardianProfile = typeof guardianProfiles.$inferSelect;
