import { z } from "zod";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const ingestModelFeaturesSchema = z.object({
  sample: z.array(z.number().finite()).length(5),
  timestamp: z.number().finite().optional(),
});

interface StoredFeatureSample {
  sample: number[];
  timestamp: number;
}

function kvKey(userId: string): string {
  return `model-features:${userId}`;
}

export const ingestModelFeaturesRoute = protectedProcedure
  .input(ingestModelFeaturesSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const featureCount = 5;
    const triggerWindowLength = 360;

    if (input.sample.length !== featureCount) {
      throw new Error(`Expected ${featureCount} features per sample`);
    }

    const now = input.timestamp ?? Date.now();
    const storageKey = kvKey(userId);
    const previous = await context.modelFeaturesKv.get<StoredFeatureSample[]>(
      storageKey,
      "json"
    );
    const records = previous ?? [];

    records.push({
      sample: input.sample,
      timestamp: now,
    });

    const windowedRecords = records.slice(-triggerWindowLength);
    await context.modelFeaturesKv.put(
      storageKey,
      JSON.stringify(windowedRecords)
    );

    return {
      created: true,
      windowSize: windowedRecords.length,
      requiredWindowSize: triggerWindowLength,
    };
  });
