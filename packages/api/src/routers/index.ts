import type { RouterClient } from "@orpc/server";

import { adminRouter } from "./admin";
import { bookingRouter } from "./booking";
import { doctorRouter } from "./doctor";
import { publicRouter } from "./public";

export const appRouter = {
  ...publicRouter,
  ...doctorRouter,
  ...adminRouter,
  ...bookingRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
