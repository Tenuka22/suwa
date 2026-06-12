import { doctorHubMaterials } from "@zen-doc/db";
import { createMaterialSchema } from "@zen-doc/db/schemas-types";
import { env } from "@zen-doc/env/server";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { eq } from "drizzle-orm";

export const createMaterialRoute = protectedProcedure
  .input(createMaterialSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    if (doctorId !== input.doctorId) {
      throw new Error("Forbidden");
    }

    const createdId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Simplistic handling for file as per prompt for now
    let fileKey = "";
    if (input.file) {
       fileKey = `doctor-materials/${doctorId}/${createdId}-${input.file.name || 'file'}`;
       // Simplified for now, following established pattern
       await env.DOCTOR_MATERIALS_KV.put(fileKey, await input.file.arrayBuffer());
    }

    await context.db.insert(doctorHubMaterials).values({
      id: createdId,
      doctorId,
      title: input.title,
      description: input.description ?? null,
      content: input.content ?? null,
      fileKey: fileKey || null,
      fileType: input.fileType,
      tags: input.tags ?? null,
      metadata: input.metadata ?? null,
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
