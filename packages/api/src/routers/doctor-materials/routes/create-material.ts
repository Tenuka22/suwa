import { doctorHubMaterials } from "@suwa/db";
import { createMaterialSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const createMaterialRoute = protectedProcedure
  .input(createMaterialSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const createdId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await context.db.insert(doctorHubMaterials).values({
      id: createdId,
      doctorId,
      channelId: input.channelId ?? null,
      title: input.title,
      description: input.description ?? null,
      content: input.content ?? null,
      fileKey: null,
      thumbnailKey: null,
      fileType: input.fileType,
      fileName: null,
      mimeType: null,
      size: null,
      durationSeconds: null,
      visibility: input.visibility,
      status: "uploading",
      tags: input.tags ? JSON.stringify(input.tags) : null,
      metadata: null,
      playlistId: input.playlistId ?? null,
      isIndividual: input.isIndividual,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const [created] = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(eq(doctorHubMaterials.id, createdId))
      .limit(1);

    return created;
  });
