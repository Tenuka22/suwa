import { z } from "zod";

export const hubVisibilitySchema = z.enum(["public", "unlisted", "private"]);
export const hubMaterialStatusSchema = z.enum([
  "uploading",
  "processing",
  "ready",
  "failed",
]);
export const hubUploadStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);
export const hubFileTypeSchema = z.enum(["video", "audio"]);

// --- Channel Schemas ---

export const createHubChannelSchema = z.object({
  name: z.string().trim().min(1).max(100),
  handle: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(
      /^[a-z0-9_-]+$/,
      "Handle can only contain lowercase letters, numbers, underscores, and hyphens"
    ),
  description: z.string().trim().max(500).optional(),
  isDefault: z.boolean().default(false),
});

export const updateHubChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

export const listHubChannelsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// --- Material Schemas (enhanced) ---

export const createMaterialSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  content: z.string().max(10_000).optional(),
  fileType: hubFileTypeSchema,
  channelId: z.string().optional(),
  visibility: hubVisibilitySchema.default("private"),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  playlistId: z.string().optional(),
  isIndividual: z.boolean().default(true),
});

export const updateMaterialSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  content: z.string().max(10_000).nullable().optional(),
  channelId: z.string().nullable().optional(),
  visibility: hubVisibilitySchema.optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).nullable().optional(),
  playlistId: z.string().nullable().optional(),
  isIndividual: z.boolean().optional(),
  thumbnailKey: z.string().nullable().optional(),
  durationSeconds: z.coerce.number().int().positive().nullable().optional(),
});

export const listMaterialsSchema = z.object({
  channelId: z.string().optional(),
  playlistId: z.string().optional(),
  visibility: hubVisibilitySchema.optional(),
  status: hubMaterialStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// --- Chunked Upload Schemas ---

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

export const initHubUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().min(1),
  totalSize: z.coerce.number().int().positive(),
  fileType: hubFileTypeSchema,
  title: z.string().trim().min(1).max(200).optional(),
  channelId: z.string().optional(),
  visibility: hubVisibilitySchema.default("private"),
  thumbnailDataBase64: z.string().min(1).optional(),
  thumbnailMimeType: z.string().min(1).optional(),
});

export const uploadHubChunkSchema = z.object({
  uploadId: z.string().min(1),
  chunkIndex: z.coerce.number().int().nonnegative(),
  chunkData: z.string().min(1), // Base64-encoded chunk data
});

export const completeHubUploadSchema = z.object({
  uploadId: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  channelId: z.string().optional(),
  playlistId: z.string().optional(),
  visibility: hubVisibilitySchema.optional(),
});

export const getHubUploadStatusSchema = z.object({
  uploadId: z.string().min(1),
});

// --- Playlist Schemas ---

export const createPlaylistSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  channelId: z.string().optional(),
});

export const updatePlaylistSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const listPlaylistsSchema = z.object({
  channelId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const idSchema = z.object({
  id: z.string().min(1),
});

export { CHUNK_SIZE };
