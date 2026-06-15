import { createDb, doctorProfiles, userSubscriptions } from "@doca/db";
import { env } from "@doca/env/server";
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

    if (sessionType === "subscription" && session.subscription && userId) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription.toString()
      );
      const now = new Date().toISOString();

      await db.insert(userSubscriptions).values({
        id: crypto.randomUUID(),
        userId,
        planId: "monthly",
        stripeSubscriptionId: subscription.id,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoiceObject = event.data.object;

    if ("subscription" in invoiceObject && invoiceObject.subscription) {
      const subscriptionId = invoiceObject.subscription.toString();
      const [userSubscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId))
        .limit(1);

      if (userSubscription) {
        const now = new Date().toISOString();

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
