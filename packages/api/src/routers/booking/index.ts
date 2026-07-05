import { acceptRescheduledSessionRoute } from "./routes/accept-rescheduled-session";
import { availabilityStatsRoute } from "./routes/availability-stats";
import { bookSessionRoute } from "./routes/book-session";
import { cancelSessionRoute } from "./routes/cancel-session";
import { counterProposeSessionRoute } from "./routes/counter-propose-session";
import {
  createDoctorPlanRoute,
  deleteDoctorPlanRoute,
  getDoctorPlansRoute,
  listDoctorPlansRoute,
  updateDoctorPlanRoute,
} from "./routes/doctor-plans";
import { listDoctorSessionsRoute } from "./routes/list-doctor-sessions";
import { listPatientSessionsRoute } from "./routes/list-patient-sessions";
import { markSessionAttendedRoute } from "./routes/mark-session-attended";
import { planStatsRoute } from "./routes/plan-stats";
import { respondSessionRoute } from "./routes/respond-session";
import { sessionStatsRoute } from "./routes/session-stats";
import {
  getDoctorWeeklyAvailabilityRoute,
  getWeeklyAvailabilityRoute,
  saveWeeklyAvailabilityRoute,
} from "./routes/weekly-availability";

export const bookingRouter = {
  bookSession: bookSessionRoute,
  cancelSession: cancelSessionRoute,
  respondSession: respondSessionRoute,
  acceptRescheduledSession: acceptRescheduledSessionRoute,
  counterProposeSession: counterProposeSessionRoute,
  markSessionAttended: markSessionAttendedRoute,
  sessionStats: sessionStatsRoute,
  planStats: planStatsRoute,
  availabilityStats: availabilityStatsRoute,
  listPatientSessions: listPatientSessionsRoute,
  listDoctorSessions: listDoctorSessionsRoute,
  createDoctorPlan: createDoctorPlanRoute,
  updateDoctorPlan: updateDoctorPlanRoute,
  deleteDoctorPlan: deleteDoctorPlanRoute,
  listDoctorPlans: listDoctorPlansRoute,
  getDoctorPlans: getDoctorPlansRoute,
  getWeeklyAvailability: getWeeklyAvailabilityRoute,
  saveWeeklyAvailability: saveWeeklyAvailabilityRoute,
  getDoctorWeeklyAvailability: getDoctorWeeklyAvailabilityRoute,
};
