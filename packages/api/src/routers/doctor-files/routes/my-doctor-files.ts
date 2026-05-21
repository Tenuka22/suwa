import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { listFilesForDoctor } from "../file-utils";

export const myDoctorFilesRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);
    return listFilesForDoctor(context.db, doctorId);
  }
);
