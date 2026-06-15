import { adminApproveDoctorRoute } from "./routes/approve-doctor";
import { adminApprovedDoctorsRoute } from "./routes/approved-doctors";
import { adminCreateTestSessionRoute } from "./routes/create-test-session";
import {
  adminCreditTransactionsRoute,
  adminUserCreditsRoute,
} from "./routes/credits";
import { adminDoctorEducationEntriesRoute } from "./routes/doctor-education-entries";
import { adminDoctorScheduleEntriesRoute } from "./routes/doctor-schedule-entries";

import { adminPatientsRoute } from "./routes/patients";
import { adminPendingDoctorsRoute } from "./routes/pending-doctors";
import { adminPlansRoute } from "./routes/plans";
import { adminSessionsRoute } from "./routes/sessions";
import { adminStatsRoute } from "./routes/stats";

export const adminRouter = {
  stats: adminStatsRoute,
  pendingDoctors: adminPendingDoctorsRoute,
  approveDoctor: adminApproveDoctorRoute,
  approvedDoctors: adminApprovedDoctorsRoute,
  createTestSession: adminCreateTestSessionRoute,
  doctorScheduleEntries: adminDoctorScheduleEntriesRoute,
  doctorEducationEntries: adminDoctorEducationEntriesRoute,
  sessions: adminSessionsRoute,
  patients: adminPatientsRoute,
  plans: adminPlansRoute,
  creditTransactions: adminCreditTransactionsRoute,
  userCredits: adminUserCreditsRoute,

};
