import { doctorHubMaterials, doctorProfiles } from "@suwa/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../../../index";

export const listPublicMaterialsRoute = publicProcedure
  .input(
    z
      .object({
        doctorId: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
      .default({ page: 1, pageSize: 20 })
  )
  .handler(async ({ context, input }) => {
    const conditions = [
      eq(doctorHubMaterials.visibility, "public"),
      eq(doctorHubMaterials.status, "ready"),
      eq(doctorHubMaterials.fileType, "video"),
      isNotNull(doctorHubMaterials.fileKey),
    ];
    if (input.doctorId) {
      conditions.push(eq(doctorHubMaterials.doctorId, input.doctorId));
    }

    const materials = await context.db
      .select({
        material: doctorHubMaterials,
        doctorName: doctorProfiles.displayName,
      })
      .from(doctorHubMaterials)
      .leftJoin(
        doctorProfiles,
        eq(doctorHubMaterials.doctorId, doctorProfiles.userId)
      )
      .where(and(...conditions))
      .orderBy(doctorHubMaterials.createdAt)
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);

    return materials.map(({ material, doctorName }) => ({
      ...material,
      tags: material.tags ? JSON.parse(material.tags) : null,
      metadata: material.metadata ? JSON.parse(material.metadata) : null,
      doctorName,
    }));
  });
