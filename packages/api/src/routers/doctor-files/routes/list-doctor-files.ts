import { doctorFileInputSchema } from "@suwa/db/schemas-types";
import { publicProcedure } from "../../../index";
import { listFilesForDoctor } from "../file-utils";

export const listDoctorFilesRoute = publicProcedure
  .input(doctorFileInputSchema)
  .handler(async ({ context, input }) =>
    listFilesForDoctor(context.db, input.doctorId)
  );
