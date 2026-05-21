import { protectedProcedure } from "../../../index";

export const privateDataRoute = protectedProcedure.handler(({ context }) => ({
  message: "This is private",
  userId: context.auth?.userId,
}));
