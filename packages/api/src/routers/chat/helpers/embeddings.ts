import { doctorProfiles } from "@doca/db";
import type { ClerkRequestContext } from "../../../context";

export interface DoctorEmbedding {
  doctorId: string;
  embedding: number[];
  text: string;
}

export async function generateDoctorEmbedding(
  _doctorId: string,
  text: string,
  context: ClerkRequestContext
): Promise<number[]> {
  const response = (await context.env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text,
  })) as { result?: { shape: number[]; data?: number[][] } };

  return response.result?.data?.[0] ?? [];
}

export async function storeDoctorEmbedding(
  doctorId: string,
  embedding: DoctorEmbedding,
  context: ClerkRequestContext
): Promise<void> {
  const key = `doctor:embeddings:${doctorId}`;
  await context.chatMessagesKv.put(key, JSON.stringify(embedding));
}

export async function getDoctorEmbedding(
  doctorId: string,
  context: ClerkRequestContext
): Promise<DoctorEmbedding | null> {
  const key = `doctor:embeddings:${doctorId}`;
  const data = await context.chatMessagesKv.get(key);
  return data ? JSON.parse(data) : null;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export async function searchSimilarDoctors(
  query: string,
  context: ClerkRequestContext,
  limit = 5
): Promise<string[]> {
  const queryEmbedding = await generateDoctorEmbedding("query", query, context);

  const doctors = await context.db.select().from(doctorProfiles);

  const results: Array<{ doctorId: string; score: number }> = [];

  for (const doctor of doctors) {
    const embedding = await getDoctorEmbedding(doctor.userId, context);
    if (embedding?.embedding) {
      const score = cosineSimilarity(queryEmbedding, embedding.embedding);
      results.push({ doctorId: doctor.userId, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.doctorId);
}
