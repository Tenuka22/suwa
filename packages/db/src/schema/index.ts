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

export const doctorProfiles = sqliteTable("doctor_profiles", {
  userId: text("user_id").primaryKey(),
  bio: text("bio"),
  licenseNumber: text("license_number"),
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

export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type DoctorSession = typeof doctorSessions.$inferSelect;
export type DoctorScheduleEntry = typeof doctorScheduleEntries.$inferSelect;
