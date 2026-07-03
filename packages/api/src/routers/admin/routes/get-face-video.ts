import { z } from "zod";
import { readStoredFile } from "../../../doctor-materials";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const FACE_VIDEO_PREFIX = "face-video:";

export const adminGetFaceVideoRoute = protectedProcedure
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    return readStoredFile(
      context.faceVideosBucket,
      `${FACE_VIDEO_PREFIX}${input.userId}`,
      "face-video.webm"
    );
  });
