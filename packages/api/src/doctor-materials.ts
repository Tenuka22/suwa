import type { Context } from "./context";

export interface StoredFileInput {
  data: ArrayBuffer | Uint8Array;
  key: string;
  mimeType: string;
}

export interface StoredFileRecord {
  createdAt: string;
  data: Uint8Array;
  key: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

export function arrayBufferToBase64(data: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(data);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function putStoredFile(
  bucket: Context["fileStorageBucket"],
  input: StoredFileInput
): Promise<void> {
  await bucket.put(input.key, input.data, {
    httpMetadata: {
      contentType: input.mimeType,
    },
  });
}

export async function readStoredFileRecord(
  bucket: Context["fileStorageBucket"],
  key: string
): Promise<StoredFileRecord | null> {
  const object = await bucket.get(key);
  if (!object) {
    return null;
  }

  const uploadedAt = object.uploaded.toISOString();

  return {
    createdAt: uploadedAt,
    data: new Uint8Array(await object.arrayBuffer()),
    key,
    mimeType: object.httpMetadata?.contentType ?? "application/octet-stream",
    size: object.size,
    updatedAt: uploadedAt,
  };
}

export async function readStoredFile(
  bucket: Context["fileStorageBucket"],
  key: string,
  fileName?: string
): Promise<File | null> {
  const record = await readStoredFileRecord(bucket, key);
  if (!record) {
    return null;
  }

  return new File([record.data], fileName ?? key, {
    type: record.mimeType,
    lastModified: Date.parse(record.updatedAt),
  });
}

export async function deleteStoredFile(
  bucket: Context["fileStorageBucket"],
  key: string
) {
  await bucket.delete(key);
}
