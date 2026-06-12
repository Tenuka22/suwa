import { env } from "@zen-doc/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type CreditTransaction as CreditTransactionSchema,
  creditTransactions as creditTransactionsTable,
  type DoctorCashoutRequest as DoctorCashoutRequestSchema,
  type DoctorCredit as DoctorCreditSchema,
  type DoctorEducationEntry as DoctorEducationEntrySchema,
  type DoctorFile as DoctorFileSchema,
  type DoctorPlan as DoctorPlanSchema,
  type DoctorProfile as DoctorProfileSchema,
  type DoctorScheduleEntry as DoctorScheduleEntrySchema,
  type DoctorSession as DoctorSessionSchema,
  type DoctorWeeklyAvailability as DoctorWeeklyAvailabilitySchema,
  doctorCashoutRequests as doctorCashoutRequestsTable,
  doctorCredits as doctorCreditsTable,
  doctorEducationEntries as doctorEducationEntriesTable,
  doctorFiles as doctorFilesTable,
  doctorPlans as doctorPlansTable,
  doctorProfiles as doctorProfilesTable,
  doctorScheduleEntries as doctorScheduleEntriesTable,
  doctorSessions as doctorSessionsTable,
  doctorWeeklyAvailability as doctorWeeklyAvailabilityTable,
  type GuardianProfile as GuardianProfileSchema,
  guardianProfiles as guardianProfilesTable,
  type MoonlightCredit as MoonlightCreditSchema,
  type MoonlightCreditTransaction as MoonlightCreditTransactionSchema,
  moonlightCredits as moonlightCreditsTable,
  moonlightCreditTransactions as moonlightCreditTransactionsTable,
  type PatientProfile as PatientProfileSchema,
  patientProfiles as patientProfilesTable,
  type SessionAttendanceEvent as SessionAttendanceEventSchema,
  type SessionSnapshot as SessionSnapshotSchema,
  type SessionTaskAssignment as SessionTaskAssignmentSchema,
  type SpriteState as SpriteStateSchema,
  type StressDownloadAcknowledgment as StressDownloadAcknowledgmentSchema,
  type StressPrediction as StressPredictionSchema,
  sessionAttendanceEvents as sessionAttendanceEventsTable,
  sessionSnapshots as sessionSnapshotsTable,
  sessionTaskAssignments as sessionTaskAssignmentsTable,
  spriteStates as spriteStatesTable,
  stressDownloadAcknowledgments as stressDownloadAcknowledgmentsTable,
  stressPredictions as stressPredictionsTable,
  type UserCredit as UserCreditSchema,
  userCredits as userCreditsTable,
  userSubscriptions as userSubscriptionsTable,
  type WellnessAction as WellnessActionSchema,
  wellnessActions as wellnessActionsTable,
  conversations as conversationsTable,
  messages as messagesTable,
} from "./schema";

export {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
  parseJsonApproachSteps,
  parseJsonStringArray,
  stringifyJsonApproachSteps,
  stringifyJsonStringArray,
} from "./doctor-profile";

export const doctorProfiles = doctorProfilesTable;
export const doctorFiles = doctorFilesTable;
export const doctorEducationEntries = doctorEducationEntriesTable;
export const doctorSessions = doctorSessionsTable;
export const doctorScheduleEntries = doctorScheduleEntriesTable;
export const patientProfiles = patientProfilesTable;
export const guardianProfiles = guardianProfilesTable;
export const doctorPlans = doctorPlansTable;
export const userCredits = userCreditsTable;
export const userSubscriptions = userSubscriptionsTable;
export const creditTransactions = creditTransactionsTable;
export const doctorWeeklyAvailability = doctorWeeklyAvailabilityTable;
export const doctorCredits = doctorCreditsTable;
export const doctorCashoutRequests = doctorCashoutRequestsTable;
export const sessionAttendanceEvents = sessionAttendanceEventsTable;
export const sessionSnapshots = sessionSnapshotsTable;
export const sessionTaskAssignments = sessionTaskAssignmentsTable;
export const spriteStates = spriteStatesTable;
export const wellnessActions = wellnessActionsTable;
export const moonlightCredits = moonlightCreditsTable;
export const moonlightCreditTransactions = moonlightCreditTransactionsTable;
export const stressPredictions = stressPredictionsTable;
export const stressDownloadAcknowledgments = stressDownloadAcknowledgmentsTable;
export const conversations = conversationsTable;
export const messages = messagesTable;

export type DoctorProfile = DoctorProfileSchema;
export type DoctorFile = DoctorFileSchema;
export type DoctorSession = DoctorSessionSchema;
export type DoctorScheduleEntry = DoctorScheduleEntrySchema;
export type DoctorEducationEntry = DoctorEducationEntrySchema;
export type PatientProfile = PatientProfileSchema;
export type GuardianProfile = GuardianProfileSchema;
export type DoctorPlan = DoctorPlanSchema;
export type UserCredit = UserCreditSchema;
export type CreditTransaction = CreditTransactionSchema;
export type DoctorWeeklyAvailability = DoctorWeeklyAvailabilitySchema;
export type DoctorCredit = DoctorCreditSchema;
export type DoctorCashoutRequest = DoctorCashoutRequestSchema;
export type SessionAttendanceEvent = SessionAttendanceEventSchema;
export type SessionSnapshot = SessionSnapshotSchema;
export type SessionTaskAssignment = SessionTaskAssignmentSchema;
export type SpriteState = SpriteStateSchema;
export type WellnessAction = WellnessActionSchema;
export type MoonlightCredit = MoonlightCreditSchema;
export type MoonlightCreditTransaction = MoonlightCreditTransactionSchema;
export type StressPrediction = StressPredictionSchema;
export type StressDownloadAcknowledgment = StressDownloadAcknowledgmentSchema;

export function createDb() {
  return drizzle(env.DB, {
    schema: {
      doctorProfiles,
      doctorFiles,
      doctorSessions,
      doctorScheduleEntries,
      patientProfiles,
      guardianProfiles,
      doctorPlans,
      userCredits,
      userSubscriptions,
      creditTransactions,
      doctorWeeklyAvailability,
      doctorCredits,
      doctorCashoutRequests,
      sessionAttendanceEvents,
      sessionSnapshots,
      sessionTaskAssignments,
      spriteStates,
      wellnessActions,
      moonlightCredits,
      moonlightCreditTransactions,
      stressPredictions,
      stressDownloadAcknowledgments,
      conversations,
      messages,
    },
  });
}
