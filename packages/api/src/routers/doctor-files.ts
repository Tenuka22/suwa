import { doctorFiles } from "@zen-doc/db";
import { doctorProfiles } from "@zen-doc/db";
import { env } from "@zen-doc/env/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { Context as ApiContext } from "../context";
import { readDoctorMaterialFile } from "../doctor-materials";
import { protectedProcedure, publicProcedure } from "../index";

const doctorFileKindSchema = z.enum([
  "portrait",
  "qualification",
  "intro_video",
  "other",
]);

const doctorFileInputSchema = z.object({
  doctorId: z.string().min(1),
});

const createDoctorFileSchema = z.object({
  doctorId: z.string().min(1),
  fileKind: doctorFileKindSchema,
  caption: z.string().trim().max(280).optional(),
  file: z.file(),
});

const updateDoctorFileSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1).optional(),
  fileKind: doctorFileKindSchema.optional(),
  caption: z.string().trim().max(280).nullable().optional(),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
});

const fileKeySchema = z.object({
  id: z.string().min(1),
});

type UploadableFile = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  size: number;
  type: string;
};

async function canManageDoctorFiles(db: ApiContext["db"], doctorId: string) {
  const [profile] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, doctorId))
    .limit(1);

  return profile?.permanent ?? false;
}

async function listFilesForDoctor(db: ApiContext["db"], doctorId: string) {
  const rows = await db.select().from(doctorFiles).where(eq(doctorFiles.doctorId, doctorId));

  return rows.map((file) => ({
    ...file,
    isVideo: file.mimeType.startsWith("video/"),
  }));
}

export const doctorFilesRouter = {
  listDoctorFiles: publicProcedure
    .input(doctorFileInputSchema)
    .handler(async ({ context, input }) => listFilesForDoctor(context.db, input.doctorId)),

  myDoctorFiles: protectedProcedure.handler(async ({ context }) => {
    const doctorId = context.auth?.userId;
    if (!doctorId) {
      throw new Error("Missing user");
    }

    return listFilesForDoctor(context.db, doctorId);
  }),

  createDoctorFile: protectedProcedure
    .input(createDoctorFileSchema)
    .handler(async ({ context, input }) => {
      const currentUserId = context.auth?.userId;
      if (!currentUserId) {
        throw new Error("Missing user");
      }

      const allowed = await canManageDoctorFiles(context.db, currentUserId);
      if (!allowed || currentUserId !== input.doctorId) {
        throw new Error("Forbidden");
      }

      const timestamp = new Date().toISOString();
      const createdId = crypto.randomUUID();
      const file = input.file as UploadableFile;
      const fileKey = `doctor-files/${input.doctorId}/${createdId}-${file.name}`;

      await env.DOCTOR_MATERIALS_BUCKET.put(fileKey, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
        },
      });

      await context.db
        .insert(doctorFiles)
        .values({
          id: createdId,
          doctorId: input.doctorId,
          fileKey,
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
    }),

  updateDoctorFile: protectedProcedure
    .input(updateDoctorFileSchema)
    .handler(async ({ context, input }) => {
      const doctorId = context.auth?.userId;
      if (!doctorId) {
        throw new Error("Missing user");
      }

      const [file] = await context.db
        .select()
        .from(doctorFiles)
        .where(and(eq(doctorFiles.id, input.id), eq(doctorFiles.doctorId, doctorId)))
        .limit(1);

      if (!file) {
        throw new Error("Doctor file not found");
      }

      const timestamp = new Date().toISOString();
      await context.db
        .update(doctorFiles)
        .set({
          fileName: input.fileName ?? file.fileName,
          fileKind: input.fileKind ?? file.fileKind,
          caption: input.caption === undefined ? file.caption : input.caption,
          width: input.width === undefined ? file.width : input.width,
          height: input.height === undefined ? file.height : input.height,
          updatedAt: timestamp,
        })
        .where(eq(doctorFiles.id, input.id));

      const [updated] = await context.db
        .select()
        .from(doctorFiles)
        .where(eq(doctorFiles.id, input.id))
        .limit(1);

      if (!updated) {
        throw new Error("Doctor file not found after update");
      }

      return {
        ...updated,
        isVideo: updated.mimeType.startsWith("video/"),
      };
    }),

  deleteDoctorFile: protectedProcedure
    .input(fileKeySchema)
    .handler(async ({ context, input }) => {
      const doctorId = context.auth?.userId;
      if (!doctorId) {
        throw new Error("Missing user");
      }

      const [file] = await context.db
        .select()
        .from(doctorFiles)
        .where(and(eq(doctorFiles.id, input.id), eq(doctorFiles.doctorId, doctorId)))
        .limit(1);

      if (!file) {
        throw new Error("Doctor file not found");
      }

      await context.db.delete(doctorFiles).where(eq(doctorFiles.id, input.id));
      await env.DOCTOR_MATERIALS_BUCKET.delete(file.fileKey);

      return { ok: true };
    }),

  getDoctorFile: publicProcedure
    .input(fileKeySchema)
    .handler(async ({ context, input }) => {
      const [file] = await context.db
        .select()
        .from(doctorFiles)
        .where(eq(doctorFiles.id, input.id))
        .limit(1);

      if (!file) {
        throw new Error("Doctor file not found");
      }

      const doctorMaterialFile = await readDoctorMaterialFile({
        fileKey: file.fileKey,
        fileName: file.fileName,
        mimeType: file.mimeType,
      });

      if (!doctorMaterialFile) {
        throw new Error("Doctor file not found in bucket");
      }

      return doctorMaterialFile;
    }),
};
