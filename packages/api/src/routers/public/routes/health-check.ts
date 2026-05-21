import { publicProcedure } from "../../../index";

export const healthCheckRoute = publicProcedure.handler(() => "OK");
