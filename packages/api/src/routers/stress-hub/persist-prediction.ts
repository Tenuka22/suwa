import { stressPredictions } from "@suwa/db";

export type PredictionRecord = Record<string, unknown>;

export function extractCombinedResult(
  results: Record<string, unknown> | null
): { predictedClass: string; probabilities: number[] } | null {
  if (!results) {
    return null;
  }
  const combined = results["0"] as
    | { prediction: string; probabilities: number[] }
    | undefined;
  if (!(combined?.prediction && combined?.probabilities)) {
    return null;
  }
  return {
    predictedClass: combined.prediction,
    probabilities: combined.probabilities,
  };
}

export async function persistPrediction(
  db: any,
  userId: string,
  results: Record<string, unknown> | null,
  sampleCount: number
): Promise<void> {
  if (!results) {
    return;
  }

  const combined = extractCombinedResult(results);
  const id = `${userId}_${Date.now()}`;

  await db.insert(stressPredictions).values({
    id,
    userId,
    prediction: JSON.stringify(results),
    predictedClass: combined?.predictedClass ?? null,
    probabilities: combined ? JSON.stringify(combined.probabilities) : null,
    sampleCount,
  });
}
