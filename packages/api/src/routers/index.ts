import type { RouterClient } from "@orpc/server";

import { adminRouter } from "./admin";
import { aiRouter } from "./ai";
import { bookingRouter } from "./booking";
import { doctorRouter } from "./doctor";
import { doctorFilesRouter } from "./doctor-files";
import { doctorMaterialsRouter } from "./doctor-materials";


import { hubChannelsRouter } from "./hub-channels";
import { hubUploadRouter } from "./hub-upload";
import { liveKitRouter } from "./livekit";
import { patientRouter } from "./patient";
import { publicRouter } from "./public";
import { sessionAttendanceRouter } from "./session-attendance";
import { stressHubRouter } from "./stress-hub";
import { tenantRouter } from "./tenant";

export const appRouter = {
  ...publicRouter,
  ...doctorRouter,
  ...doctorFilesRouter,
  ...doctorMaterialsRouter,
  ...hubChannelsRouter,
  ...hubUploadRouter,
  ...adminRouter,
  ...bookingRouter,
  ...liveKitRouter,
  ...patientRouter,
  ...sessionAttendanceRouter,


  ...stressHubRouter,
  ...tenantRouter,
  ai: aiRouter,
};

export const wsAppRouter = {};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
