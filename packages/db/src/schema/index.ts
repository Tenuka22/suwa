import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const sessionStatusValues = [
  "requested",
  "rescheduled",
  "approved",
  "attended",
  "timing_balance_failure",
] as const;

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
  planId: text("plan_id"),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
  status: text("status", { enum: sessionStatusValues })
    .notNull()
    .default("requested"),
  creditCost: integer("credit_cost").notNull(),
  doctorEarnedCents: integer("doctor_earned_cents"),
  payoutStatus: text("payout_status").notNull().default("none"),
  payoutTransferId: text("payout_transfer_id"),
  payoutAmount: integer("payout_amount"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const sessionTaskAssignments = sqliteTable("session_task_assignments", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  doctorId: text("doctor_id").notNull(),
  patientId: text("patient_id").notNull(),
  taskKey: text("task_key").notNull(),
  title: text("title").notNull(),
  minutes: integer("minutes").notNull(),
  points: integer("points").notNull(),
  rewardLabel: text("reward_label").notNull(),
  status: text("status").notNull().default("assigned"),
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

export const userCredits = sqliteTable("user_credits", {
  userId: text("user_id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const creditTransactions = sqliteTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const doctorWeeklyAvailability = sqliteTable(
  "doctor_weekly_availability",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    isAvailable: integer("is_available", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  }
);

export const doctorCredits = sqliteTable("doctor_credits", {
  doctorId: text("doctor_id").primaryKey(),
  balanceCents: integer("balance_cents").notNull().default(0),
  totalEarnedCents: integer("total_earned_cents").notNull().default(0),
  totalCashedOutCents: integer("total_cashed_out_cents").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const doctorCashoutRequests = sqliteTable("doctor_cashout_requests", {
  id: text("id").primaryKey(),
  doctorId: text("doctor_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  stripeTransferId: text("stripe_transfer_id"),
  failureReason: text("failure_reason"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const sessionAttendanceEvents = sqliteTable(
  "session_attendance_events",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    participantId: text("participant_id").notNull(),
    participantType: text("participant_type").notNull(),
    event: text("event").notNull(),
    timestamp: text("timestamp").notNull(),
    metadata: text("metadata"),
  }
);

export const sessionSnapshots = sqliteTable("session_snapshots", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  capturedAt: text("captured_at").notNull(),
  imageUrl: text("image_url"),
  imageData: text("image_data"),
  participantType: text("participant_type").notNull(),
  reason: text("reason").notNull(),
});

export const doctorPlans = sqliteTable("doctor_plans", {
  id: text("id").primaryKey(),
  doctorId: text("doctor_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  creditCost: integer("credit_cost").notNull().default(1),
  durationMinutes: integer("duration_minutes").notNull(),
  features: text("features"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const userSubscriptions = sqliteTable("user_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"), // active, cancelled, past_due, etc.
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type DoctorSession = typeof doctorSessions.$inferSelect;
export type DoctorFile = typeof doctorFiles.$inferSelect;
export type DoctorScheduleEntry = typeof doctorScheduleEntries.$inferSelect;
export type DoctorEducationEntry = typeof doctorEducationEntries.$inferSelect;
export type PatientProfile = typeof patientProfiles.$inferSelect;
export type GuardianProfile = typeof guardianProfiles.$inferSelect;
export type UserCredit = typeof userCredits.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type DoctorPlan = typeof doctorPlans.$inferSelect;
export type DoctorWeeklyAvailability =
  typeof doctorWeeklyAvailability.$inferSelect;
export type DoctorCredit = typeof doctorCredits.$inferSelect;
export type DoctorCashoutRequest = typeof doctorCashoutRequests.$inferSelect;
export type SessionAttendanceEvent =
  typeof sessionAttendanceEvents.$inferSelect;
export type SessionSnapshot = typeof sessionSnapshots.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
