import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import { doctorHubMaterials, hubUploadSessions } from "@suwa/db";

const UPLOAD_STATUSES = [
  "completed",
  "in_progress",
  "pending",
  "failed",
] as const;

export async function seedHubUploads(
  db: ReturnType<typeof createDb>,
  doctorIds: string[]
) {
  if (doctorIds.length === 0) {
    return { uploadSessions: 0 };
  }

  const existing = await db
    .select({ id: hubUploadSessions.id })
    .from(hubUploadSessions);

  if (existing.length > 0) {
    return { uploadSessions: 0 };
  }

  const materials = await db
    .select({
      id: doctorHubMaterials.id,
      doctorId: doctorHubMaterials.doctorId,
      fileName: doctorHubMaterials.fileName,
      mimeType: doctorHubMaterials.mimeType,
      size: doctorHubMaterials.size,
    })
    .from(doctorHubMaterials);

  if (materials.length === 0) {
    return { uploadSessions: 0 };
  }

  const uploads: Array<{
    id: string;
    doctorId: string;
    materialId: string;
    fileName: string;
    mimeType: string;
    totalSize: number;
    chunkSize: number;
    totalChunks: number;
    uploadedChunks: string;
    status: (typeof UPLOAD_STATUSES)[number];
    fileKey: string;
  }> = [];

  for (const material of materials) {
    if (faker.datatype.boolean(0.7)) {
      const chunkSize = 1_048_576; // 1MB
      const totalSize =
        material.size ?? faker.number.int({ min: 1_000_000, max: 50_000_000 });
      const totalChunks = Math.ceil(totalSize / chunkSize);
      const status = faker.helpers.arrayElement([
        "completed",
        "completed",
        "completed",
        "in_progress",
      ] as const);

      const uploadedChunks =
        status === "completed"
          ? JSON.stringify(Array.from({ length: totalChunks }, (_, i) => i))
          : status === "in_progress"
            ? JSON.stringify(
                Array.from(
                  {
                    length: faker.number.int({ min: 1, max: totalChunks - 1 }),
                  },
                  (_, i) => i
                )
              )
            : "[]";

      uploads.push({
        id: crypto.randomUUID(),
        doctorId: material.doctorId,
        materialId: material.id,
        fileName: material.fileName ?? "untitled.mp4",
        mimeType: material.mimeType ?? "video/mp4",
        totalSize,
        chunkSize,
        totalChunks,
        uploadedChunks,
        status,
        fileKey: `hub-uploads/${material.doctorId}/${material.id}/${material.fileName ?? "file"}`,
      });
    }
  }

  if (uploads.length > 0) {
    const BATCH_SIZE = 3;
    for (let i = 0; i < uploads.length; i += BATCH_SIZE) {
      await db
        .insert(hubUploadSessions)
        .values(uploads.slice(i, i + BATCH_SIZE));
    }
  }

  return { uploadSessions: uploads.length };
}
