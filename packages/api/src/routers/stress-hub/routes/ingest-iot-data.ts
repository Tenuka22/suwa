import { z } from "zod";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { persistPrediction } from "../persist-prediction";
import { RedisSampleStore } from "../redis-sample-store";
import {
  getRedis,
  runPrediction,
  type StoredPrediction,
  saveBundle,
} from "../simulation";
import { stressPublisher } from "../stress-publisher";

export const ingestIoTDataRoute = protectedProcedure
  .input(
    z.object({
      deviceId: z.string().min(1),
      samples: z
        .array(
          z.object({
            sample: z.array(z.number().finite()).length(5),
            timestamp: z.number().finite(),
          })
        )
        .min(1)
        .max(100),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const redis = getRedis();
    const store = new RedisSampleStore(redis);

    let windowsCompleted = 0;

    for (const sample of input.samples) {
      const ready = await store.addSample(userId, sample);
      if (!ready) {
        continue;
      }

      const windowSamples = await store.popWindow(userId);
      if (!windowSamples) {
        continue;
      }

      const sampleArrays = windowSamples.map((s) => s.sample);
      const windowStart = windowSamples[0]?.timestamp ?? Date.now();

      let storedPrediction: StoredPrediction | null = null;

      const prediction = await runPrediction(sampleArrays);
      if (prediction) {
        storedPrediction = {
          predictedClass: prediction.predictedClass,
          probabilities: prediction.probabilities,
          sampleCount: windowSamples.length,
          timestamp: Date.now(),
          windowStart,
        };

        await persistPrediction(
          context.db,
          userId,
          {
            results: {
              "0": {
                prediction: prediction.predictedClass,
                probabilities: prediction.probabilities,
              },
            },
          } as Record<string, unknown>,
          windowSamples.length
        );
      }

      await saveBundle(redis, userId, windowSamples, storedPrediction);
      windowsCompleted++;

      await stressPublisher.publish(userId, {
        type: "bundle",
        data: {
          bundleId: `bundle_${Date.now()}_${windowsCompleted}`,
          samples: windowSamples,
          prediction: storedPrediction,
          createdAt: Date.now(),
        },
      });
    }

    const buf = await store.getBuffer(userId);
    const total = buf?.totalSamples ?? 0;
    const buffered = buf?.buffered ?? 0;

    await stressPublisher.publish(userId, {
      type: "progress",
      buffered,
      totalSamples: total,
    });

    return {
      ingested: input.samples.length,
      totalSamples: total,
      buffered,
      windowsCompleted,
    };
  });
