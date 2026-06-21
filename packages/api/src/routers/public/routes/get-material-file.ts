import { doctorHubMaterials } from "@suwa/db";
import { env } from "@suwa/env/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
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

    const data = await env.DOCTOR_MATERIALS_KV.get(material.fileKey, {
      type: "arrayBuffer",
    });

    if (!data) {
      throw new Error("Material file not found in storage");
    }

    return new File([data], material.fileName ?? "file", {
      type: material.mimeType ?? "application/octet-stream",
    });
  });
