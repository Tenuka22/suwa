import { z } from "zod";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const FACE_VIDEO_KV_PREFIX = "face-video:";

export const adminGetFaceVideoRoute = protectedProcedure
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const videoKvKey = `${FACE_VIDEO_KV_PREFIX}${input.userId}`;
    const data = await context.faceVideosKv.get(videoKvKey, {
      type: "arrayBuffer",
    });
    if (!data) {
      return null;
    }

    return new File([data], "face-video.webm", {
      type: "video/webm",
    });
  });
