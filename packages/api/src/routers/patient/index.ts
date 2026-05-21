import { approveGuardianRequestRoute } from "./routes/approve-guardian-request";
import { checkGuardianMatchRoute } from "./routes/check-guardian-match";
import { completeOnboardingRoute } from "./routes/complete-onboarding";
import { getPatientProfileRoute } from "./routes/get-patient-profile";
import { getPendingGuardianRequestsRoute } from "./routes/get-pending-guardian-requests";

export const patientRouter = {
  getPatientProfile: getPatientProfileRoute,
  checkGuardianMatch: checkGuardianMatchRoute,
  getPendingGuardianRequests: getPendingGuardianRequestsRoute,
  approveGuardianRequest: approveGuardianRequestRoute,
  completeOnboarding: completeOnboardingRoute,
};
