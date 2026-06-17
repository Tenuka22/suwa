import { env } from "@suwa/env/server";
import { z } from "zod";
import { publicProcedure } from "../../../index";

const validWindowSizes = [120, 240, 360] as const;

export const predictStressRoute = publicProcedure
  .input(
    z.object({
      windowSamples: z
        .array(z.array(z.number().finite()).length(11))
        .refine(
          (a) => (validWindowSizes as readonly number[]).includes(a.length),
          { message: "windowSamples must have length 120, 240, or 360" }
        ),
    })
  )
  .handler(async ({ input }) => {
    const flattened = input.windowSamples.flat();

    const response = await fetch(`${env.STRESS_PREDICTOR_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ window_samples: flattened }),
    });

    if (!response.ok) {
      throw new Error(
        `Stress predictor returned ${response.status}: ${await response.text()}`
      );
    }

    const responseData = (await response.json()) as { results: number[] };
    return responseData.results;
  });
