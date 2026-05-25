import type { RouterClient } from "@orpc/server";

import { adminRouter } from "./admin";
import { bookingRouter } from "./booking";
import { doctorRouter } from "./doctor";
import { doctorFilesRouter } from "./doctor-files";
import { liveKitRouter } from "./livekit";
import { patientRouter } from "./patient";
import { publicRouter } from "./public";

export const appRouter = {
  ...publicRouter,
  ...doctorRouter,
  ...doctorFilesRouter,
  ...adminRouter,
  ...bookingRouter,
  ...liveKitRouter,
  ...patientRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
