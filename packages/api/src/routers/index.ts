import type { RouterClient } from "@orpc/server";

import { adminRouter } from "./admin";
import { doctorFilesRouter } from "./doctor-files";
import { bookingRouter } from "./booking";
import { doctorRouter } from "./doctor";
import { patientRouter } from "./patient";
import { publicRouter } from "./public";

export const appRouter = {
  ...publicRouter,
  ...doctorRouter,
  ...doctorFilesRouter,
  ...adminRouter,
  ...bookingRouter,
  ...patientRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
