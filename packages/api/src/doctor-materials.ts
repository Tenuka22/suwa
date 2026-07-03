/// <reference types="@cloudflare/workers-types" />

interface FileMetadata {
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

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
  bucket: R2Bucket,
  input: StoredFileInput
): Promise<void> {
  const size = input.data instanceof ArrayBuffer
    ? input.data.byteLength
    : input.data.byteLength;
  const now = new Date().toISOString();
  const metadata: FileMetadata = {
    mimeType: input.mimeType,
    size,
    createdAt: now,
    updatedAt: now,
  };
  await bucket.put(input.key, input.data, {
    customMetadata: {
      createdAt: metadata.createdAt,
      size: String(metadata.size),
      updatedAt: metadata.updatedAt,
    },
    httpMetadata: {
      contentType: metadata.mimeType,
    },
  });
}

export async function readStoredFileRecord(
  bucket: R2Bucket,
  key: string
): Promise<StoredFileRecord | null> {
  const object = await bucket.get(key);
  if (!object) {
    return null;
  }

  const value = await object.arrayBuffer();
  const meta = object.customMetadata;
  const now = new Date().toISOString();
  const updatedAt = object.uploaded?.toISOString() ?? meta?.updatedAt ?? now;

  return {
    createdAt: meta?.createdAt ?? updatedAt,
    data: new Uint8Array(value),
    key,
    mimeType: object.httpMetadata?.contentType ?? "application/octet-stream",
    size: object.size,
    updatedAt,
  };
}

export async function readStoredFile(
  bucket: R2Bucket,
  key: string,
  fileName?: string
): Promise<File | null> {
  const record = await readStoredFileRecord(bucket, key);
  if (!record) {
    return null;
  }

  const fileData = new ArrayBuffer(record.data.byteLength);
  new Uint8Array(fileData).set(record.data);

  return new File([fileData], fileName ?? key, {
    type: record.mimeType,
    lastModified: Date.parse(record.updatedAt),
  });
}

export async function deleteStoredFile(
  bucket: R2Bucket,
  key: string
) {
  await bucket.delete(key);
}
