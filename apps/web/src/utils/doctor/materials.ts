import { createIsomorphicFn } from "@tanstack/react-start";

import { orpc } from "@/utils/orpc";

export const getDoctorMaterialFile = createIsomorphicFn()
  .server(async (id: string) => orpc.getDoctorFile.call({ id }))
  .client(async (id: string) => orpc.getDoctorFile.call({ id }));
