import { completeOnboardingRoute } from "./routes/complete-onboarding";
import { getPatientProfileRoute } from "./routes/get-patient-profile";
import { getPatientMoodRoute } from "./routes/get-patient-mood";
import { ingestModelFeaturesRoute } from "./routes/ingest-model-features";
import { predictStressRoute } from "./routes/predict-stress";
import { setPatientMoodRoute } from "./routes/set-patient-mood";
import { putPrivacyDataRoute } from "./routes/put-privacy-data";
import { createSubscriptionRoute } from "./routes/subscription/create-subscription";
import { getUserSubscriptionRoute } from "./routes/subscription/get-user-subscription";
import { updatePatientProfileRoute } from "./routes/update-patient-profile";

export const patientRouter = {
  getPatientProfile: getPatientProfileRoute,
  getPatientMood: getPatientMoodRoute,
  completeOnboarding: completeOnboardingRoute,
  updatePatientProfile: updatePatientProfileRoute,
  putPrivacyData: putPrivacyDataRoute,
  ingestModelFeatures: ingestModelFeaturesRoute,
  predictStress: predictStressRoute,
  setPatientMood: setPatientMoodRoute,
  createSubscription: createSubscriptionRoute,
  getUserSubscription: getUserSubscriptionRoute,
};
