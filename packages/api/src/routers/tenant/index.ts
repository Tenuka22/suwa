import {
  listDoctorAffiliationsRoute,
  listDoctorInvitationsRoute,
  listTenantAffiliationsRoute,
  listTenantInvitationsRoute,
  inviteDoctorRoute,
  respondInvitationRoute,
  updateAffiliationWindowsRoute,
} from "./routes/affiliations";
import {
  createAvailabilityOverrideRoute,
  deleteAvailabilityOverrideRoute,
  listAvailabilityOverridesRoute,
  getDoctorHospitalBlocksRoute,
  checkAffilationConflictsRoute,
} from "./routes/availability";
import {
  logAttendanceEventRoute,
  updateAttendanceEventRoute,
  deleteAttendanceEventRoute,
  getAttendanceRoute,
  getDoctorHospitalStatusRoute,
  createClinicRoute,
  updateClinicRoute,
  listClinicsRoute,
  markClinicAttendanceRoute,
  getClinicAttendanceRoute,
} from "./routes/attendance";
import {
  listNotificationsRoute,
  markNotificationReadRoute,
  markAllNotificationsReadRoute,
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
  checkAffiliationConflicts: checkAffilationConflictsRoute,

  // Notifications
  listNotifications: listNotificationsRoute,
  markNotificationRead: markNotificationReadRoute,
  markAllNotificationsRead: markAllNotificationsReadRoute,
};
