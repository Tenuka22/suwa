import { doctorFiles } from "@zen-doc/db";
import { updateDoctorFileSchema } from "@zen-doc/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const updateDoctorFileRoute = protectedProcedure
  .input(updateDoctorFileSchema)
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

    const timestamp = new Date().toISOString();
    await context.db
      .update(doctorFiles)
      .set({
        fileName: input.fileName ?? file.fileName,
        fileKind: input.fileKind ?? file.fileKind,
        caption: input.caption === undefined ? file.caption : input.caption,
        width: input.width === undefined ? file.width : input.width,
        height: input.height === undefined ? file.height : input.height,
        updatedAt: timestamp,
      })
      .where(eq(doctorFiles.id, input.id));

    const [updated] = await context.db
      .select()
      .from(doctorFiles)
      .where(eq(doctorFiles.id, input.id))
      .limit(1);

    if (!updated) {
      throw new Error("Doctor file not found after update");
    }

    return {
      ...updated,
      isVideo: updated.mimeType.startsWith("video/"),
    };
  });
