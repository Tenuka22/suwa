import { bookSessionRoute } from "./routes/book-session";
import { createConnectAccountLinkRoute } from "./routes/create-connect-account-link";
import { getConnectAccountStatusRoute } from "./routes/get-connect-account-status";
import { getDoctorAvailableSlotsRoute } from "./routes/get-doctor-available-slots";
import { getUserCreditsRoute } from "./routes/get-user-credits";
import { listDoctorSessionsRoute } from "./routes/list-doctor-sessions";
import { listPatientSessionsRoute } from "./routes/list-patient-sessions";
import { markSessionAttendedRoute } from "./routes/mark-session-attended";
import { syncConnectAccountStatusRoute } from "./routes/sync-connect-account-status";

export const bookingRouter = {
  bookSession: bookSessionRoute,
  getConnectAccountStatus: getConnectAccountStatusRoute,
  createConnectAccountLink: createConnectAccountLinkRoute,
  syncConnectAccountStatus: syncConnectAccountStatusRoute,
  markSessionAttended: markSessionAttendedRoute,
  listPatientSessions: listPatientSessionsRoute,
  listDoctorSessions: listDoctorSessionsRoute,
  getDoctorAvailableSlots: getDoctorAvailableSlotsRoute,
  getUserCredits: getUserCreditsRoute,
};
