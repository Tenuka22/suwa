import { env } from "@zen-doc/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type DoctorProfile as DoctorProfileSchema,
  type DoctorFile as DoctorFileSchema,
  type DoctorScheduleEntry as DoctorScheduleEntrySchema,
  type DoctorEducationEntry as DoctorEducationEntrySchema,
  type DoctorSession as DoctorSessionSchema,
  doctorProfiles as doctorProfilesTable,
  doctorEducationEntries as doctorEducationEntriesTable,
  doctorFiles as doctorFilesTable,
  doctorScheduleEntries as doctorScheduleEntriesTable,
  doctorSessions as doctorSessionsTable,
  type GuardianProfile as GuardianProfileSchema,
  guardianProfiles as guardianProfilesTable,
  type PatientProfile as PatientProfileSchema,
  patientProfiles as patientProfilesTable,
} from "./schema";
export {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
  parseJsonApproachSteps,
  stringifyJsonApproachSteps,
  parseJsonStringArray,
  stringifyJsonStringArray,
} from "./doctor-profile";

export const doctorProfiles = doctorProfilesTable;
export const doctorFiles = doctorFilesTable;
export const doctorEducationEntries = doctorEducationEntriesTable;
export const doctorSessions = doctorSessionsTable;
export const doctorScheduleEntries = doctorScheduleEntriesTable;
export const patientProfiles = patientProfilesTable;
export const guardianProfiles = guardianProfilesTable;
export type DoctorProfile = DoctorProfileSchema;
export type DoctorFile = DoctorFileSchema;
export type DoctorSession = DoctorSessionSchema;
export type DoctorScheduleEntry = DoctorScheduleEntrySchema;
export type DoctorEducationEntry = DoctorEducationEntrySchema;
export type PatientProfile = PatientProfileSchema;
export type GuardianProfile = GuardianProfileSchema;

export function createDb() {
  return drizzle(env.DB, {
    schema: {
      doctorProfiles,
      doctorFiles,
      doctorSessions,
      doctorScheduleEntries,
      patientProfiles,
      guardianProfiles,
    },
  });
}
