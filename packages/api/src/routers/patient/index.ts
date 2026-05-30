import { approveGuardianRequestRoute } from "./routes/approve-guardian-request";
import { checkGuardianMatchRoute } from "./routes/check-guardian-match";
import { completeOnboardingRoute } from "./routes/complete-onboarding";
import { getGuardianProfileRoute } from "./routes/get-guardian-profile";
import { getPatientProfileRoute } from "./routes/get-patient-profile";
import { getPendingGuardianRequestsRoute } from "./routes/get-pending-guardian-requests";
import { getUserCreditsRoute } from "./routes/get-user-credits";
import { ingestModelFeaturesRoute } from "./routes/ingest-model-features";
import { predictStressRoute } from "./routes/predict-stress";
import { purchaseCreditsRoute } from "./routes/purchase-credits";
import { createSubscriptionRoute } from "./routes/subscription/create-subscription";
import { getUserSubscriptionRoute } from "./routes/subscription/get-user-subscription";

export const patientRouter = {
  getPatientProfile: getPatientProfileRoute,
  getGuardianProfile: getGuardianProfileRoute,
  checkGuardianMatch: checkGuardianMatchRoute,
  getPendingGuardianRequests: getPendingGuardianRequestsRoute,
  approveGuardianRequest: approveGuardianRequestRoute,
  completeOnboarding: completeOnboardingRoute,
  ingestModelFeatures: ingestModelFeaturesRoute,
  predictStress: predictStressRoute,
  getUserCredits: getUserCreditsRoute,
  purchaseCredits: purchaseCreditsRoute,
  createSubscription: createSubscriptionRoute,
  getUserSubscription: getUserSubscriptionRoute,
};
