import { doctorHubMaterials } from "@suwa/db";
import { updateMaterialSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const updateMaterialRoute = protectedProcedure
  .input(updateMaterialSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const { id, ...rawData } = input;
    const timestamp = new Date().toISOString();

    const data: Record<string, unknown> = { updatedAt: timestamp };
    if (rawData.title !== undefined) {
      data.title = rawData.title;
    }
    if (rawData.description !== undefined) {
      data.description = rawData.description;
    }
    if (rawData.content !== undefined) {
      data.content = rawData.content;
    }
    if (rawData.channelId !== undefined) {
      data.channelId = rawData.channelId;
    }
    if (rawData.visibility !== undefined) {
      data.visibility = rawData.visibility;
    }
    if (rawData.playlistId !== undefined) {
      data.playlistId = rawData.playlistId;
    }
    if (rawData.isIndividual !== undefined) {
      data.isIndividual = rawData.isIndividual;
    }
    if (rawData.thumbnailKey !== undefined) {
      data.thumbnailKey = rawData.thumbnailKey;
    }
    if (rawData.durationSeconds !== undefined) {
      data.durationSeconds = rawData.durationSeconds;
    }
    if (rawData.tags !== undefined) {
      data.tags = rawData.tags ? JSON.stringify(rawData.tags) : null;
    }

    const result = await context.db
      .update(doctorHubMaterials)
      .set(data)
      .where(
        and(
          eq(doctorHubMaterials.id, id),
          eq(doctorHubMaterials.doctorId, doctorId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error("Material not found");
    }

    const updated = result[0]!;
    return {
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : null,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
    };
  });
