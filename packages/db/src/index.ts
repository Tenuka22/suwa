import { env } from "@suwa/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type ClinicAttendanceRecord as ClinicAttendanceSchema,
  type Clinic as ClinicSchema,
  clinicAttendance as clinicAttendanceTable,
  clinics as clinicsTable,
  type DoctorCashoutRequest as DoctorCashoutRequestSchema,
  type DoctorCredit as DoctorCreditSchema,
  type DoctorEducationEntry as DoctorEducationEntrySchema,
  type DoctorFile as DoctorFileSchema,
  type DoctorHospitalAffiliation as DoctorHospitalAffiliationSchema,
  type DoctorHospitalInvitation as DoctorHospitalInvitationSchema,
  type DoctorHubChannel as DoctorHubChannelSchema,
  type DoctorMaterial as DoctorMaterialSchema,
  type DoctorPlan as DoctorPlanSchema,
  type DoctorProfile as DoctorProfileSchema,
  type DoctorScheduleEntry as DoctorScheduleEntrySchema,
  type DoctorSession as DoctorSessionSchema,
  type DoctorWeeklyAvailability as DoctorWeeklyAvailabilitySchema,
  doctorCashoutRequests as doctorCashoutRequestsTable,
  doctorCredits as doctorCreditsTable,
  doctorEducationEntries as doctorEducationEntriesTable,
  doctorFiles as doctorFilesTable,
  doctorHospitalAffiliations as doctorHospitalAffiliationsTable,
  doctorHospitalInvitations as doctorHospitalInvitationsTable,
  doctorHubChannels as doctorHubChannelsTable,
  doctorHubMaterials as doctorHubMaterialsTable,
  doctorPlans as doctorPlansTable,
  doctorPlaylists as doctorPlaylistsTable,
  doctorProfiles as doctorProfilesTable,
  doctorScheduleEntries as doctorScheduleEntriesTable,
  doctorSessions as doctorSessionsTable,
  doctorWeeklyAvailability as doctorWeeklyAvailabilityTable,
  type HospitalAttendanceEvent as HospitalAttendanceEventSchema,
  type HospitalAvailabilityOverride as HospitalAvailabilityOverrideSchema,
  type HubUploadSession as HubUploadSessionSchema,
  hospitalAttendanceEvents as hospitalAttendanceEventsTable,
  hospitalAvailabilityOverrides as hospitalAvailabilityOverridesTable,
  hubUploadSessions as hubUploadSessionsTable,
  type PatientProfile as PatientProfileSchema,
  patientProfiles as patientProfilesTable,
  type SessionAttendanceEvent as SessionAttendanceEventSchema,
  type SessionSnapshot as SessionSnapshotSchema,
  type SessionTaskAssignment as SessionTaskAssignmentSchema,
  type StressDownloadAcknowledgment as StressDownloadAcknowledgmentSchema,
  type StressPrediction as StressPredictionSchema,
  sessionAttendanceEvents as sessionAttendanceEventsTable,
  sessionSnapshots as sessionSnapshotsTable,
  sessionTaskAssignments as sessionTaskAssignmentsTable,
  stressDownloadAcknowledgments as stressDownloadAcknowledgmentsTable,
  stressPredictions as stressPredictionsTable,
  type TenantAdmin as TenantAdminSchema,
  type TenantAuditLog as TenantAuditLogSchema,
  type TenantNotification as TenantNotificationSchema,
  type Tenant as TenantSchema,
  tenantAdmins as tenantAdminsTable,
  tenantAuditLogs as tenantAuditLogsTable,
  tenantNotifications as tenantNotificationsTable,
  tenants as tenantsTable,
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
export const doctorHubMaterials = doctorHubMaterialsTable;
export const doctorPlaylists = doctorPlaylistsTable;
export const doctorHubChannels = doctorHubChannelsTable;
export const hubUploadSessions = hubUploadSessionsTable;
export const doctorScheduleEntries = doctorScheduleEntriesTable;
export const patientProfiles = patientProfilesTable;

export const doctorPlans = doctorPlansTable;
export const userSubscriptions = userSubscriptionsTable;
export const doctorWeeklyAvailability = doctorWeeklyAvailabilityTable;
export const doctorCredits = doctorCreditsTable;
export const doctorCashoutRequests = doctorCashoutRequestsTable;
export const sessionAttendanceEvents = sessionAttendanceEventsTable;
export const sessionSnapshots = sessionSnapshotsTable;
export const sessionTaskAssignments = sessionTaskAssignmentsTable;
export const stressPredictions = stressPredictionsTable;
export const stressDownloadAcknowledgments = stressDownloadAcknowledgmentsTable;

export const tenants = tenantsTable;
export const tenantAdmins = tenantAdminsTable;
export const doctorHospitalAffiliations = doctorHospitalAffiliationsTable;
export const hospitalAttendanceEvents = hospitalAttendanceEventsTable;
export const clinics = clinicsTable;
export const clinicAttendance = clinicAttendanceTable;
export const doctorHospitalInvitations = doctorHospitalInvitationsTable;
export const hospitalAvailabilityOverrides = hospitalAvailabilityOverridesTable;
export const tenantAuditLogs = tenantAuditLogsTable;
export const tenantNotifications = tenantNotificationsTable;

export type DoctorProfile = DoctorProfileSchema;
export type DoctorFile = DoctorFileSchema;
export type DoctorSession = DoctorSessionSchema;
export type DoctorScheduleEntry = DoctorScheduleEntrySchema;
export type DoctorEducationEntry = DoctorEducationEntrySchema;
export type PatientProfile = PatientProfileSchema;

export type DoctorHubChannel = DoctorHubChannelSchema;
export type DoctorMaterial = DoctorMaterialSchema;
export type HubUploadSession = HubUploadSessionSchema;
export type DoctorPlan = DoctorPlanSchema;

export type DoctorWeeklyAvailability = DoctorWeeklyAvailabilitySchema;
export type DoctorCredit = DoctorCreditSchema;
export type DoctorCashoutRequest = DoctorCashoutRequestSchema;
export type SessionAttendanceEvent = SessionAttendanceEventSchema;
export type SessionSnapshot = SessionSnapshotSchema;
export type SessionTaskAssignment = SessionTaskAssignmentSchema;
export type StressPrediction = StressPredictionSchema;
export type StressDownloadAcknowledgment = StressDownloadAcknowledgmentSchema;
export type Tenant = TenantSchema;
export type TenantAdmin = TenantAdminSchema;
export type DoctorHospitalAffiliation = DoctorHospitalAffiliationSchema;
export type HospitalAttendanceEvent = HospitalAttendanceEventSchema;
export type Clinic = ClinicSchema;
export type ClinicAttendanceRecord = ClinicAttendanceSchema;
export type DoctorHospitalInvitation = DoctorHospitalInvitationSchema;
export type HospitalAvailabilityOverride = HospitalAvailabilityOverrideSchema;
export type TenantAuditLog = TenantAuditLogSchema;
export type TenantNotification = TenantNotificationSchema;

export function createDb() {
  return drizzle(env.DB, {
    schema: {
      doctorProfiles,
      doctorFiles,
      doctorSessions,
      doctorScheduleEntries,
      patientProfiles,

      doctorPlans,
      userSubscriptions,
      doctorWeeklyAvailability,
      doctorCredits,
      doctorCashoutRequests,
      sessionAttendanceEvents,
      sessionSnapshots,
      sessionTaskAssignments,
      stressPredictions,
      stressDownloadAcknowledgments,
      doctorHubMaterials,
      doctorPlaylists,
      doctorHubChannels,
      hubUploadSessions,
      tenants,
      tenantAdmins,
      doctorHospitalAffiliations,
      hospitalAttendanceEvents,
      clinics,
      clinicAttendance,
      doctorHospitalInvitations,
      hospitalAvailabilityOverrides,
      tenantAuditLogs,
      tenantNotifications,
    },
  });
}
