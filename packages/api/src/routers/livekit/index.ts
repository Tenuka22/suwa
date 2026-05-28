import { getTestLiveKitTokenRoute } from "./routes/get-test-token";
import { getLiveKitTokenRoute } from "./routes/get-token";

export const liveKitRouter = {
  getLiveKitToken: getLiveKitTokenRoute,
  getTestLiveKitToken: getTestLiveKitTokenRoute,
};
