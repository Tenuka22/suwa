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
  kv: KVNamespace,
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
  await kv.put(input.key, input.data, { metadata });
}

export async function readStoredFileRecord(
  kv: KVNamespace,
  key: string
): Promise<StoredFileRecord | null> {
  const { value, metadata } = await kv.getWithMetadata(key, { type: "arrayBuffer" });
  if (!value) {
    return null;
  }

  const meta = metadata as FileMetadata | undefined;
  const now = new Date().toISOString();

  return {
    createdAt: meta?.createdAt ?? now,
    data: new Uint8Array(value),
    key,
    mimeType: meta?.mimeType ?? "application/octet-stream",
    size: meta?.size ?? value.byteLength,
    updatedAt: meta?.updatedAt ?? now,
  };
}

export async function readStoredFile(
  kv: KVNamespace,
  key: string,
  fileName?: string
): Promise<File | null> {
  const record = await readStoredFileRecord(kv, key);
  if (!record) {
    return null;
  }

  return new File([record.data], fileName ?? key, {
    type: record.mimeType,
    lastModified: Date.parse(record.updatedAt),
  });
}

export async function deleteStoredFile(
  kv: KVNamespace,
  key: string
) {
  await kv.delete(key);
}
