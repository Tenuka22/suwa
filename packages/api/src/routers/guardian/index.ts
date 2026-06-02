import { acceptRequestRoute } from "./routes/accept-request";
import { getGuardianProfileRoute } from "./routes/get-guardian-profile";
import { getManagedPatientsRoute } from "./routes/get-managed-patients";
import { getPendingRequestsRoute } from "./routes/get-pending-requests";
import { getManagedPatientWellnessRoute } from "./routes/get-managed-patient-wellness";
import { getManagedPatientStressMetricsRoute } from "./routes/get-managed-patient-stress";

export const guardianRouter = {
  getGuardianProfile: getGuardianProfileRoute,
  getPendingRequests: getPendingRequestsRoute,
  acceptRequest: acceptRequestRoute,
  getManagedPatients: getManagedPatientsRoute,
  getManagedPatientWellness: getManagedPatientWellnessRoute,
  getManagedPatientStressMetrics: getManagedPatientStressMetricsRoute,
};
