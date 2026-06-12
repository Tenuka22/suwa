import type { RouterClient } from "@orpc/server";

import { adminRouter } from "./admin";
import { bookingRouter } from "./booking";
import { chatHttpRouter, chatWsRouter } from "./chat";
import { doctorRouter } from "./doctor";
import { doctorFilesRouter } from "./doctor-files";
import { doctorMaterialsRouter } from "./doctor-materials";
import { gamificationRouter } from "./gamification";
import { guardianRouter } from "./guardian";
import { liveKitRouter } from "./livekit";
import { patientRouter } from "./patient";
import { publicRouter } from "./public";
import { sessionAttendanceRouter } from "./session-attendance";
import { stressHubRouter } from "./stress-hub";

export const appRouter = {
  ...publicRouter,
  ...doctorRouter,
  ...doctorFilesRouter,
  ...doctorMaterialsRouter,
  ...adminRouter,
  ...bookingRouter,
  ...liveKitRouter,
  ...patientRouter,
  ...sessionAttendanceRouter,
  ...gamificationRouter,
  ...guardianRouter,
  ...stressHubRouter,
  ...chatHttpRouter,
};

export const wsAppRouter = {
  ...chatWsRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

export type WSAppRouter = typeof wsAppRouter;
export type WSAppRouterClient = RouterClient<typeof wsAppRouter>;
