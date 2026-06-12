import { z } from "zod";

export const createMaterialSchema = z.object({
  doctorId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.string().optional(),
  fileType: z.enum(["video", "audio"]),
  tags: z.string().optional(), // Stored as JSON string
  metadata: z.string().optional(), // Stored as JSON string
  playlistId: z.string().optional(),
  isIndividual: z.boolean().default(true),
  // For uploading, we might need file data. The prompt mentions chunked/lazy.
  // The existing router uses Zod's `z.file()` which is a custom wrapper.
  // For now, let's keep it simple as the existing pattern.
  file: z.any().optional(), // Placeholder
});

export const updateMaterialSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  content: z.string().nullable().optional(),
  fileKey: z.string().optional(),
  fileType: z.enum(["video", "audio"]).optional(),
  tags: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  playlistId: z.string().nullable().optional(),
  isIndividual: z.boolean().optional(),
});

export const listMaterialsSchema = z.object({
  playlistId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createPlaylistSchema = z.object({
  doctorId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const updatePlaylistSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const listPlaylistsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const idSchema = z.object({
  id: z.string().min(1),
});
