import { myFaceEmbeddingRoute } from "./routes/get-face-embedding";
import { myFaceVideoRoute } from "./routes/get-face-video";
import { doctorProfileRoute } from "./routes/profile";
import { profileStatsRoute } from "./routes/profile-stats";
import { saveFaceEmbeddingRoute } from "./routes/save-face-embedding";
import { saveDoctorProfileRoute } from "./routes/save-profile";
import { doctorStatsRoute } from "./routes/stats";
import { payoutStatusRoute } from "./routes/payout-status";
import { requestPayoutRoute } from "./routes/request-payout";

export const doctorRouter = {
  doctorProfile: doctorProfileRoute,
  saveDoctorProfile: saveDoctorProfileRoute,
  doctorStats: doctorStatsRoute,
  profileStats: profileStatsRoute,
  saveFaceEmbedding: saveFaceEmbeddingRoute,
  myFaceVideo: myFaceVideoRoute,
  myFaceEmbedding: myFaceEmbeddingRoute,
  payoutStatus: payoutStatusRoute,
  requestPayout: requestPayoutRoute,
};
