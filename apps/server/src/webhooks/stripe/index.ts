import {
  createDb,
  creditTransactions,
  doctorProfiles,
  userCredits,
  userSubscriptions,
} from "@zen-doc/db";
import { env } from "@zen-doc/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import Stripe from "stripe";

export const stripeApp = new Hono();

stripeApp.post("/", async (c) => {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
  const db = createDb();
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.text("Missing signature", 400);
  }

  const body = await c.req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return c.text("Webhook Error", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionType = session.metadata?.type;
    const userId = session.metadata?.userId;

    if (sessionType === "credit_topup" && userId) {
      const creditsToAdd = Number.parseInt(
        session.metadata?.credits ?? "0",
        10
      );
      if (creditsToAdd > 0) {
        const [existing] = await db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1);

        const now = new Date().toISOString();
        const newBalance = existing
          ? existing.balance + creditsToAdd
          : creditsToAdd;

        if (existing) {
          await db
            .update(userCredits)
            .set({
              balance: newBalance,
              updatedAt: now,
            })
            .where(eq(userCredits.userId, userId));
        } else {
          await db.insert(userCredits).values({
            userId,
            balance: creditsToAdd,
          });
        }

        await db.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId,
          amount: creditsToAdd,
          type: "purchase",
          createdAt: now,
        });
      }
    }

    if (sessionType === "subscription" && session.subscription) {
      const planType = session.metadata?.planType;

      if (userId && planType === "monthly_5_credits") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription.toString()
        );
        const now = new Date().toISOString();

        await db.insert(userSubscriptions).values({
          id: crypto.randomUUID(),
          userId,
          planId: "monthly_5_credits",
          stripeSubscriptionId: subscription.id,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });

        const [existingCredits] = await db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1);

        if (existingCredits) {
          await db
            .update(userCredits)
            .set({
              balance: existingCredits.balance + 5,
              updatedAt: now,
            })
            .where(eq(userCredits.userId, userId));
        } else {
          await db.insert(userCredits).values({
            userId,
            balance: 5,
          });
        }

        await db.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId,
          amount: 5,
          type: "subscription_renewal",
          createdAt: now,
        });
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoiceObject = event.data.object;

    if ("subscription" in invoiceObject && invoiceObject.subscription) {
      const subscriptionId = invoiceObject.subscription.toString();
      await stripe.subscriptions.retrieve(subscriptionId);
      const [userSubscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId))
        .limit(1);

      if (userSubscription) {
        const userId = userSubscription.userId;
        const now = new Date().toISOString();

        const [existingCredits] = await db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1);

        if (existingCredits) {
          await db
            .update(userCredits)
            .set({
              balance: existingCredits.balance + 5,
              updatedAt: now,
            })
            .where(eq(userCredits.userId, userId));
        } else {
          await db.insert(userCredits).values({
            userId,
            balance: 5,
          });
        }

        await db.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId,
          amount: 5,
          type: "subscription_renewal",
          createdAt: now,
        });

        await db
          .update(userSubscriptions)
          .set({
            updatedAt: now,
          })
          .where(eq(userSubscriptions.id, userSubscription.id));
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const [userSubscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
      .limit(1);

    if (userSubscription) {
      await db
        .update(userSubscriptions)
        .set({
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userSubscriptions.id, userSubscription.id));
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId;
    const creditsToAdd = Number.parseInt(
      paymentIntent.metadata?.credits ?? "0",
      10
    );

    if (userId && creditsToAdd > 0) {
      const [existing] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      const newBalance = existing
        ? existing.balance + creditsToAdd
        : creditsToAdd;

      const now = new Date().toISOString();

      if (existing) {
        await db
          .update(userCredits)
          .set({
            balance: newBalance,
            updatedAt: now,
          })
          .where(eq(userCredits.userId, userId));
      } else {
        await db.insert(userCredits).values({
          userId,
          balance: creditsToAdd,
        });
      }

      await db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId,
        amount: creditsToAdd,
        type: "purchase",
        createdAt: now,
      });
    }
  }

  if (
    event.type === "account.updated" ||
    event.type === "account.application.authorized"
  ) {
    const account = event.data.object as Stripe.Account;
    const stripeAccountId = account.id;

    const enabled = account.details_submitted && account.charges_enabled;

    await db
      .update(doctorProfiles)
      .set({
        stripeAccountEnabled: enabled,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(doctorProfiles.stripeAccountId, stripeAccountId));
  }

  return c.text("OK");
});
