import {
  inviteDoctorRoute,
  listDoctorAffiliationsRoute,
  listDoctorInvitationsRoute,
  listTenantAffiliationsRoute,
  listTenantInvitationsRoute,
  respondInvitationRoute,
  updateAffiliationWindowsRoute,
} from "./routes/affiliations";
import {
  createClinicRoute,
  deleteAttendanceEventRoute,
  getAttendanceRoute,
  getClinicAttendanceRoute,
  getDoctorHospitalStatusRoute,
  listClinicsRoute,
  logAttendanceEventRoute,
  markClinicAttendanceRoute,
  updateAttendanceEventRoute,
  updateClinicRoute,
} from "./routes/attendance";
import {
  checkAffiliationConflictsRoute,
  createAvailabilityOverrideRoute,
  deleteAvailabilityOverrideRoute,
  getDoctorHospitalBlocksRoute,
  listAvailabilityOverridesRoute,
} from "./routes/availability";
import {
  listNotificationsRoute,
  markAllNotificationsReadRoute,
  markNotificationReadRoute,
} from "./routes/notifications";
import {
  addTenantAdminRoute,
  createTenantRoute,
  getTenantAuditLogRoute,
  getTenantRoute,
  listTenantAdminsRoute,
  listTenantsRoute,
  updateTenantRoute,
} from "./routes/tenant-crud";

export const tenantRouter = {
  // Tenant CRUD
  createTenant: createTenantRoute,
  getTenant: getTenantRoute,
  updateTenant: updateTenantRoute,
  listTenants: listTenantsRoute,
  listTenantAdmins: listTenantAdminsRoute,
  addTenantAdmin: addTenantAdminRoute,
  getTenantAuditLog: getTenantAuditLogRoute,

  // Invitations
  inviteDoctor: inviteDoctorRoute,
  listTenantInvitations: listTenantInvitationsRoute,
  listDoctorInvitations: listDoctorInvitationsRoute,
  respondInvitation: respondInvitationRoute,

  // Affiliations
  listTenantAffiliations: listTenantAffiliationsRoute,
  listDoctorAffiliations: listDoctorAffiliationsRoute,
  updateAffiliationWindows: updateAffiliationWindowsRoute,

  // Attendance
  logAttendanceEvent: logAttendanceEventRoute,
  updateAttendanceEvent: updateAttendanceEventRoute,
  deleteAttendanceEvent: deleteAttendanceEventRoute,
  getAttendance: getAttendanceRoute,
  getDoctorHospitalStatus: getDoctorHospitalStatusRoute,

  // Clinics
  createClinic: createClinicRoute,
  updateClinic: updateClinicRoute,
  listClinics: listClinicsRoute,
  markClinicAttendance: markClinicAttendanceRoute,
  getClinicAttendance: getClinicAttendanceRoute,

  // Availability
  createAvailabilityOverride: createAvailabilityOverrideRoute,
  deleteAvailabilityOverride: deleteAvailabilityOverrideRoute,
  listAvailabilityOverrides: listAvailabilityOverridesRoute,
  getDoctorHospitalBlocks: getDoctorHospitalBlocksRoute,
  checkAffiliationConflicts: checkAffiliationConflictsRoute,

  // Notifications
  listNotifications: listNotificationsRoute,
  markNotificationRead: markNotificationReadRoute,
  markAllNotificationsRead: markAllNotificationsReadRoute,
};
