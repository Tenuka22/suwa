import { doctorFiles } from "@zen-doc/db";
import { fileKeySchema } from "@zen-doc/db/schemas-types";
import { env } from "@zen-doc/env/server";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const deleteDoctorFileRoute = protectedProcedure
  .input(fileKeySchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const [file] = await context.db
      .select()
      .from(doctorFiles)
      .where(
        and(eq(doctorFiles.id, input.id), eq(doctorFiles.doctorId, doctorId))
      )
      .limit(1);

    if (!file) {
      throw new Error("Doctor file not found");
    }

    await context.db.delete(doctorFiles).where(eq(doctorFiles.id, input.id));
    await env.DOCTOR_MATERIALS_BUCKET.delete(file.fileKey);

    return { ok: true };
  });
