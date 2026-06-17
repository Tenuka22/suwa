import { userSubscriptions } from "@suwa/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../../hooks";
import { protectedProcedure } from "../../../../index";
import { getStripe } from "../../../booking/stripe-utils";

export const createSubscriptionRoute = protectedProcedure
  .input(
    z.object({
      planType: z.enum(["monthly"]),
      returnUrl: z.string().url().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const stripe = getStripe();
    const [existingSubscription] = await context.db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (existingSubscription) {
      throw new Error("You already have an active subscription for this month");
    }

    const amount = 5000;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "subscription",
        userId,
        planType: input.planType,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      sessionId: paymentIntent.id,
    };
  });
