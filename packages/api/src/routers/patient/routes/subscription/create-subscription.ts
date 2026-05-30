import {
  userSubscriptions,
  userCredits,
} from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../../booking/stripe-utils";

export const createSubscriptionRoute = protectedProcedure
  .input(
    z.object({
      planType: z.enum(["monthly_5_credits"]), // $50/month for 5 credits
      returnUrl: z.string().url().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const stripe = getStripe();
    const returnUrl = input.returnUrl ?? "https://zen-doc.app";

    // Check if user already has an active subscription for this month
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

    // Define the subscription plan: $50/month for 5 credits
    // This would typically be a Price ID in Stripe, but for simplicity we'll create it dynamically
    const planName = "ZenDoc Monthly Plan - 5 Credits";
    const planDescription = "5 credits per month for $50.00";
    const amount = 5000; // $50.00 in cents

    // Create a Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
              description: planDescription,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "subscription",
        userId,
        planType: input.planType,
        creditsPerMonth: "5", // 5 credits per month
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  });