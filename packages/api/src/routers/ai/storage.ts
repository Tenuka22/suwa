import type { KVNamespace } from "@cloudflare/workers-types";

export interface ChatSession {
  createdAt: number;
  id: string;
  lastAgent: string;
  messageCount: number;
  title: string;
  updatedAt: number;
  userId: string;
}

export interface ChatMessage {
  agent?: string;
  content: string;
  id: string;
  parentId?: string;
  role: "user" | "assistant" | "system" | "tool";
  sessionId: string;
  timestamp: number;
  toolCalls?: Array<{ name: string; args: unknown; id: string }>;
  toolResults?: Array<{ name: string; result: unknown; id: string }>;
}

const K = {
  sessionIndex: "ai:session:index",
  sessionMeta: (id: string) => `ai:session:${id}:meta`,
  sessionMsgs: (id: string) => `ai:session:${id}:messages`,
};

async function getIndex(kv: KVNamespace): Promise<string[]> {
  const raw = await kv.get(K.sessionIndex);
  return raw ? JSON.parse(raw) : [];
}

async function saveIndex(kv: KVNamespace, ids: string[]): Promise<void> {
  await kv.put(K.sessionIndex, JSON.stringify(ids.slice(0, 100)));
}

export async function createSession(
  kv: KVNamespace,
  session: ChatSession
): Promise<void> {
  await kv.put(K.sessionMeta(session.id), JSON.stringify(session));
  const index = await getIndex(kv);
  index.unshift(session.id);
  await saveIndex(kv, index);
}

export async function getSession(
  kv: KVNamespace,
  id: string
): Promise<ChatSession | null> {
  const raw = await kv.get(K.sessionMeta(id));
  return raw ? JSON.parse(raw) : null;
}

export async function updateSession(
  kv: KVNamespace,
  id: string,
  updates: Partial<ChatSession>
): Promise<void> {
  const session = await getSession(kv, id);
  if (!session) {
    return;
  }
  Object.assign(session, updates);
  await kv.put(K.sessionMeta(id), JSON.stringify(session));
}

export async function deleteSession(
  kv: KVNamespace,
  id: string
): Promise<void> {
  await kv.delete(K.sessionMeta(id));
  await kv.delete(K.sessionMsgs(id));
  const index = await getIndex(kv);
  await saveIndex(
    kv,
    index.filter((sid) => sid !== id)
  );
}

export async function listSessions(
  kv: KVNamespace,
  limit = 20,
  cursor?: number,
  userId?: string
): Promise<{ sessions: ChatSession[]; nextCursor?: number }> {
  const index = await getIndex(kv);
  if (index.length === 0) {
    return { sessions: [] };
  }
  const allSessions = (
    await Promise.all(index.map((id) => getSession(kv, id)))
  ).filter((s): s is ChatSession => s !== null);
  const filtered = userId
    ? allSessions.filter((s) => s.userId === userId)
    : allSessions;
  const start = cursor ?? 0;
  const batch = filtered.slice(start, start + limit);
  const nextCursor =
    start + limit < filtered.length ? start + limit : undefined;
  return { sessions: batch, nextCursor };
}

export async function getMessages(
  kv: KVNamespace,
  sessionId: string,
  limit = 50,
  before?: number
): Promise<ChatMessage[]> {
  const raw = await kv.get(K.sessionMsgs(sessionId));
  if (!raw) {
    return [];
  }
  const all: ChatMessage[] = JSON.parse(raw);
  if (before !== undefined) {
    const idx = all.findIndex((m) => m.timestamp === before);
    return idx >= 0
      ? all.slice(Math.max(0, idx - limit), idx)
      : all.slice(-limit);
  }
  return all.slice(-limit);
}

export async function addMessage(
  kv: KVNamespace,
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  const raw = await kv.get(K.sessionMsgs(sessionId));
  const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
  messages.push(message);
  await kv.put(K.sessionMsgs(sessionId), JSON.stringify(messages));
  await updateSession(kv, sessionId, {
    messageCount: messages.length,
    updatedAt: Date.now(),
  });
}

export async function addMessages(
  kv: KVNamespace,
  sessionId: string,
  newMessages: ChatMessage[]
): Promise<void> {
  if (newMessages.length === 0) {
    return;
  }
  const raw = await kv.get(K.sessionMsgs(sessionId));
  const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
  messages.push(...newMessages);
  await kv.put(K.sessionMsgs(sessionId), JSON.stringify(messages));
  await updateSession(kv, sessionId, {
    messageCount: messages.length,
    updatedAt: Date.now(),
  });
}

export async function forkSession(
  kv: KVNamespace,
  sessionId: string,
  messageId: string,
  newSessionId: string
): Promise<ChatSession | null> {
  const raw = await kv.get(K.sessionMsgs(sessionId));
  if (!raw) {
    return null;
  }
  const messages: ChatMessage[] = JSON.parse(raw);
  const forkIndex = messages.findIndex((m) => m.id === messageId);
  if (forkIndex < 0) {
    return null;
  }
  const forkedMessages = messages.slice(0, forkIndex + 1).map((m) => ({
    ...m,
    sessionId: newSessionId,
    id: crypto.randomUUID(),
  }));
  const original = await getSession(kv, sessionId);
  if (!original) {
    return null;
  }
  const newSession: ChatSession = {
    ...original,
    id: newSessionId,
    title: `${original.title} (fork)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: forkedMessages.length,
  };
  await kv.put(K.sessionMeta(newSessionId), JSON.stringify(newSession));
  await kv.put(K.sessionMsgs(newSessionId), JSON.stringify(forkedMessages));
  const index = await getIndex(kv);
  index.unshift(newSessionId);
  await saveIndex(kv, index);
  return newSession;
}
