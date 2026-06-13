import { env } from "@zen-doc/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type CreditTransaction as CreditTransactionSchema,
  conversations as conversationsTable,
  creditTransactions as creditTransactionsTable,
  type DoctorCashoutRequest as DoctorCashoutRequestSchema,
  type DoctorCredit as DoctorCreditSchema,
  type DoctorEducationEntry as DoctorEducationEntrySchema,
  type DoctorFile as DoctorFileSchema,
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
  doctorHubChannels as doctorHubChannelsTable,
  doctorHubMaterials as doctorHubMaterialsTable,
  doctorPlans as doctorPlansTable,
  doctorPlaylists as doctorPlaylistsTable,
  doctorProfiles as doctorProfilesTable,
  doctorScheduleEntries as doctorScheduleEntriesTable,
  doctorSessions as doctorSessionsTable,
  doctorWeeklyAvailability as doctorWeeklyAvailabilityTable,
  type GuardianProfile as GuardianProfileSchema,
  guardianProfiles as guardianProfilesTable,
  type HubUploadSession as HubUploadSessionSchema,
  hubUploadSessions as hubUploadSessionsTable,
  type MoonlightCredit as MoonlightCreditSchema,
  type MoonlightCreditTransaction as MoonlightCreditTransactionSchema,
  messages as messagesTable,
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
  type Tenant as TenantSchema,
  type TenantAdmin as TenantAdminSchema,
  type DoctorHospitalAffiliation as DoctorHospitalAffiliationSchema,
  type HospitalAttendanceEvent as HospitalAttendanceEventSchema,
  type Clinic as ClinicSchema,
  type ClinicAttendanceRecord as ClinicAttendanceSchema,
  type DoctorHospitalInvitation as DoctorHospitalInvitationSchema,
  type HospitalAvailabilityOverride as HospitalAvailabilityOverrideSchema,
  type TenantAuditLog as TenantAuditLogSchema,
  type TenantNotification as TenantNotificationSchema,
  tenants as tenantsTable,
  tenantAdmins as tenantAdminsTable,
  doctorHospitalAffiliations as doctorHospitalAffiliationsTable,
  hospitalAttendanceEvents as hospitalAttendanceEventsTable,
  clinics as clinicsTable,
  clinicAttendance as clinicAttendanceTable,
  doctorHospitalInvitations as doctorHospitalInvitationsTable,
  hospitalAvailabilityOverrides as hospitalAvailabilityOverridesTable,
  tenantAuditLogs as tenantAuditLogsTable,
  tenantNotifications as tenantNotificationsTable,
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
export type GuardianProfile = GuardianProfileSchema;
export type DoctorHubChannel = DoctorHubChannelSchema;
export type DoctorMaterial = DoctorMaterialSchema;
export type HubUploadSession = HubUploadSessionSchema;
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
