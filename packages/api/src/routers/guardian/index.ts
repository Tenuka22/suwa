import { acceptRequestRoute } from "./routes/accept-request";
import { getGuardianProfileRoute } from "./routes/get-guardian-profile";
import { getManagedPatientsRoute } from "./routes/get-managed-patients";
import { getPendingRequestsRoute } from "./routes/get-pending-requests";

export const guardianRouter = {
  getGuardianProfile: getGuardianProfileRoute,
  getPendingRequests: getPendingRequestsRoute,
  acceptRequest: acceptRequestRoute,
  getManagedPatients: getManagedPatientsRoute,
};
