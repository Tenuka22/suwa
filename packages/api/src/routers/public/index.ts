import { getDoctorRoute } from "./routes/get-doctor";
import { healthCheckRoute } from "./routes/health-check";
import { listDoctorsRoute } from "./routes/list-doctors";
import { privateDataRoute } from "./routes/private-data";

export const publicRouter = {
  healthCheck: healthCheckRoute,
  privateData: privateDataRoute,
  listDoctors: listDoctorsRoute,
  getDoctor: getDoctorRoute,
};
