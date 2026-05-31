import { completeOnboardingRoute } from "./routes/complete-onboarding";
import { getPatientProfileRoute } from "./routes/get-patient-profile";
import { getUserCreditsRoute } from "./routes/get-user-credits";
import { ingestModelFeaturesRoute } from "./routes/ingest-model-features";
import { predictStressRoute } from "./routes/predict-stress";
import { purchaseCreditsRoute } from "./routes/purchase-credits";
import { putPrivacyDataRoute } from "./routes/put-privacy-data";
import { createSubscriptionRoute } from "./routes/subscription/create-subscription";
import { getUserSubscriptionRoute } from "./routes/subscription/get-user-subscription";
import { updatePatientProfileRoute } from "./routes/update-patient-profile";

export const patientRouter = {
  getPatientProfile: getPatientProfileRoute,
  completeOnboarding: completeOnboardingRoute,
  updatePatientProfile: updatePatientProfileRoute,
  putPrivacyData: putPrivacyDataRoute,
  ingestModelFeatures: ingestModelFeaturesRoute,
  predictStress: predictStressRoute,
  getUserCredits: getUserCreditsRoute,
  purchaseCredits: purchaseCreditsRoute,
  createSubscription: createSubscriptionRoute,
  getUserSubscription: getUserSubscriptionRoute,
};
