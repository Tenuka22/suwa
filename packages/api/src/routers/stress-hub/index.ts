import { acknowledgeDownloadRoute } from "./routes/acknowledge-download";
import { getStressDataRoute } from "./routes/get-stress-data";
import { ingestIoTDataRoute } from "./routes/ingest-iot-data";
import { startSimulationRoute } from "./routes/start-simulation";
import { stopSimulationRoute } from "./routes/stop-simulation";

import { subscribeStressStreamRoute } from "./routes/subscribe-stress-stream";

export const stressHubRouter = {
  ingestIoTData: ingestIoTDataRoute,
  getStressData: getStressDataRoute,
  acknowledgeStressDownload: acknowledgeDownloadRoute,
  startStressSimulation: startSimulationRoute,
  stopStressSimulation: stopSimulationRoute,
  subscribeStressStream: subscribeStressStreamRoute,

};
