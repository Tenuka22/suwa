import { env } from "@zen-doc/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type DoctorEducationEntry as DoctorEducationEntrySchema,
  type DoctorFile as DoctorFileSchema,
  type DoctorProfile as DoctorProfileSchema,
  type DoctorScheduleEntry as DoctorScheduleEntrySchema,
  type DoctorSession as DoctorSessionSchema,
  doctorEducationEntries as doctorEducationEntriesTable,
  doctorFiles as doctorFilesTable,
  doctorProfiles as doctorProfilesTable,
  doctorScheduleEntries as doctorScheduleEntriesTable,
  doctorSessions as doctorSessionsTable,
  type GuardianProfile as GuardianProfileSchema,
  guardianProfiles as guardianProfilesTable,
  type PatientProfile as PatientProfileSchema,
  patientProfiles as patientProfilesTable,
  type UserCredit as UserCreditSchema,
  userCredits as userCreditsTable,
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
export const userCredits = userCreditsTable;
export type DoctorProfile = DoctorProfileSchema;
export type DoctorFile = DoctorFileSchema;
export type DoctorSession = DoctorSessionSchema;
export type DoctorScheduleEntry = DoctorScheduleEntrySchema;
export type DoctorEducationEntry = DoctorEducationEntrySchema;
export type PatientProfile = PatientProfileSchema;
export type GuardianProfile = GuardianProfileSchema;
export type UserCredit = UserCreditSchema;

export function createDb() {
  return drizzle(env.DB, {
    schema: {
      doctorProfiles,
      doctorFiles,
      doctorSessions,
      doctorScheduleEntries,
      patientProfiles,
      guardianProfiles,
      userCredits,
    },
  });
}
