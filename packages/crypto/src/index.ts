function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function importSecretKey(secretBase64: string): Promise<CryptoKey> {
  const keyData = base64ToBuffer(secretBase64);
  return crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function generateUserSecret(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return bufferToBase64(key);
}

export async function encryptUserData(
  data: Record<string, unknown>,
  secretBase64: string
): Promise<string> {
  const secretKey = await importSecretKey(secretBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    secretKey,
    encoded
  );

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  return bufferToBase64(result);
}

export async function decryptUserData(
  encryptedBase64: string,
  secretBase64: string
): Promise<Record<string, unknown> | null> {
  try {
    const secretKey = await importSecretKey(secretBase64);
    const encrypted = base64ToBuffer(encryptedBase64);

    const iv = encrypted.slice(0, 12);
    const data = encrypted.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      secretKey,
      data
    );

    const text = new TextDecoder().decode(decrypted);
    const parsed = JSON.parse(text);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey
  );

  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: JSON.stringify(privateKeyJwk),
  };
}

export async function deriveSharedKey(
  privateKeyJwkStr: string,
  publicKeyJwkStr: string
): Promise<string> {
  const privateKeyJwk = JSON.parse(privateKeyJwkStr) as JsonWebKey;
  const publicKeyJwk = JSON.parse(publicKeyJwkStr) as JsonWebKey;

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256
  );

  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      info: new TextEncoder().encode("session-key-v1"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  return bufferToBase64(new Uint8Array(rawKey));
}
