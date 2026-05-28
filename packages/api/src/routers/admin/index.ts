import { adminApproveDoctorRoute } from "./routes/approve-doctor";
import { adminApprovedDoctorsRoute } from "./routes/approved-doctors";
import { adminCreateTestSessionRoute } from "./routes/create-test-session";
import { adminDoctorEducationEntriesRoute } from "./routes/doctor-education-entries";
import { adminDoctorScheduleEntriesRoute } from "./routes/doctor-schedule-entries";
import { adminPendingDoctorsRoute } from "./routes/pending-doctors";

export const adminRouter = {
  pendingDoctors: adminPendingDoctorsRoute,
  approveDoctor: adminApproveDoctorRoute,
  approvedDoctors: adminApprovedDoctorsRoute,
  createTestSession: adminCreateTestSessionRoute,
  doctorScheduleEntries: adminDoctorScheduleEntriesRoute,
  doctorEducationEntries: adminDoctorEducationEntriesRoute,
};
