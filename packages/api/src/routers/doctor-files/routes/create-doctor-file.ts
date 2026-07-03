import { doctorFiles } from "@suwa/db";
import { createDoctorFileSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";
import {
  base64ToUint8Array,
  putStoredFile,
} from "../../../doctor-materials";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { canManageDoctorFiles, type UploadableFile } from "../file-utils";

export const createDoctorFileRoute = protectedProcedure
  .input(createDoctorFileSchema)
  .handler(async ({ context, input }) => {
    const { userId: currentUserId } = requireAuth(context);

    const allowed = await canManageDoctorFiles(context.db, currentUserId);
    if (!allowed || currentUserId !== input.doctorId) {
      throw new Error("Forbidden");
    }

    const timestamp = new Date().toISOString();
    const createdId = crypto.randomUUID();
    const file = input.file as UploadableFile;
    const fileKey = `doctor-files/${input.doctorId}/${createdId}-${file.name}`;
    const thumbnailKey = input.thumbnailDataBase64
      ? `${fileKey}.thumbnail.jpg`
      : null;

    await putStoredFile(context.fileStorageBucket, {
      key: fileKey,
      data: await file.arrayBuffer(),
      mimeType: file.type || "application/octet-stream",
    });

    if (thumbnailKey && input.thumbnailDataBase64) {
      await putStoredFile(context.fileStorageBucket, {
        key: thumbnailKey,
        data: base64ToUint8Array(input.thumbnailDataBase64),
        mimeType: input.thumbnailMimeType ?? "image/jpeg",
      });
    }

    await context.db.insert(doctorFiles).values({
      id: createdId,
      doctorId: input.doctorId,
      fileKey,
      thumbnailKey,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileKind: input.fileKind,
      caption: input.caption ?? null,
      size: file.size,
      width: null,
      height: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const [created] = await context.db
      .select()
      .from(doctorFiles)
      .where(eq(doctorFiles.id, createdId))
      .limit(1);

    if (!created) {
      throw new Error("Doctor file not found after create");
    }

    return {
      ...created,
      isVideo: created.mimeType.startsWith("video/"),
    };
  });
