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
  type SessionTaskAssignment as SessionTaskAssignmentSchema,
  sessionTaskAssignments as sessionTaskAssignmentsTable,
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
  type PatientProfile as PatientProfileSchema,
  patientProfiles as patientProfilesTable,
  type SessionAttendanceEvent as SessionAttendanceEventSchema,
  type SessionSnapshot as SessionSnapshotSchema,
  sessionAttendanceEvents as sessionAttendanceEventsTable,
  sessionSnapshots as sessionSnapshotsTable,
  type UserCredit as UserCreditSchema,
  userCredits as userCreditsTable,
  userSubscriptions as userSubscriptionsTable,
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
    },
  });
}
