import { doctorHubMaterials } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { readStoredFile } from "../../../doctor-materials";
import { publicProcedure } from "../../../index";

export const getMaterialFileRoute = publicProcedure
  .input(z.object({ materialId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const [material] = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(eq(doctorHubMaterials.id, input.materialId))
      .limit(1);

    if (!material?.fileKey) {
      throw new Error("Material file not found");
    }

    const data = await readStoredFile(context.fileStorageBucket, material.fileKey, material.fileName ?? undefined);

    if (!data) {
      throw new Error("Material file not found in storage");
    }

    return data;
  });
