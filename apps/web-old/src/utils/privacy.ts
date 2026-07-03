import {
  decryptUserData as decryptData,
  deriveSharedKey,
  generateKeyPair,
} from "@suwa/crypto";

const DOCTOR_SESSION_KEY_PREFIX = "doctor-session-keypair:";

export type SessionKeyPair = {
  publicKey: string;
  privateKey: string;
};

function getSessionStorageKey(sessionId: string): string {
  return `${DOCTOR_SESSION_KEY_PREFIX}${sessionId}`;
}

export function loadSessionKeyPair(sessionId: string): SessionKeyPair | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getSessionStorageKey(sessionId));
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const publicKeyEntry = Object.entries(parsed).find(
      ([key]) => key === "publicKey"
    );
    const privateKeyEntry = Object.entries(parsed).find(
      ([key]) => key === "privateKey"
    );

    const publicKey = publicKeyEntry?.[1];
    const privateKey = privateKeyEntry?.[1];

    if (typeof publicKey !== "string" || typeof privateKey !== "string") {
      return null;
    }

    return { publicKey, privateKey };
  } catch {
    return null;
  }
}

export function saveSessionKeyPair(
  sessionId: string,
  pair: SessionKeyPair
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getSessionStorageKey(sessionId),
    JSON.stringify(pair)
  );
}

export async function createSessionKeyPair(
  sessionId: string
): Promise<SessionKeyPair> {
  const pair = await generateKeyPair();
  saveSessionKeyPair(sessionId, pair);
  return pair;
}

export { decryptData, deriveSharedKey, generateKeyPair };
