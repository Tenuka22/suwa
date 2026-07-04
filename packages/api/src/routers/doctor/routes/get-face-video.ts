import { z } from "zod";
import { arrayBufferToBase64, readStoredFileRecord } from "../../../doctor-materials";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const FACE_VIDEO_PREFIX = "face-video:";

export const myFaceVideoRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId } = requireAuth(context);

    const record = await readStoredFileRecord(
      context.faceVideosBucket,
      `${FACE_VIDEO_PREFIX}${userId}`
    );
    if (!record) {
      return null;
    }

    return {
      data: arrayBufferToBase64(record.data),
      mimeType: record.mimeType,
    };
  });
