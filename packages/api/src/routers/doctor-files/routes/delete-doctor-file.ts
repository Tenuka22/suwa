import { doctorFiles } from "@suwa/db";
import { fileKeySchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { deleteStoredFile } from "../../../doctor-materials";
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
    await deleteStoredFile(context.fileStorageBucket, file.fileKey);
    if (file.thumbnailKey) {
      await deleteStoredFile(context.fileStorageBucket, file.thumbnailKey);
    }

    return { ok: true };
  });
