import { createScheduleEntryRoute } from "./routes/create-schedule-entry";
import { deleteScheduleEntryRoute } from "./routes/delete-schedule-entry";
import { listScheduleEntriesRoute } from "./routes/list-schedule-entries";
import { doctorProfileRoute } from "./routes/profile";
import { saveDoctorProfileRoute } from "./routes/save-profile";

export const doctorRouter = {
  doctorProfile: doctorProfileRoute,
  saveDoctorProfile: saveDoctorProfileRoute,
  listScheduleEntries: listScheduleEntriesRoute,
  createScheduleEntry: createScheduleEntryRoute,
  deleteScheduleEntry: deleteScheduleEntryRoute,
};
