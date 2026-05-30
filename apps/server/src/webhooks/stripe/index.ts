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

  // Handle subscription events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.metadata?.type === "subscription" && session.subscription) {
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType;
      
      if (userId && planType === "monthly_5_credits") {
        // Create subscription record
        const now = new Date().toISOString();
        await db.insert(userSubscriptions).values({
          id: crypto.randomUUID(),
          userId,
          stripeSubscriptionId: session.subscription.toString(),
          status: "active",
          currentPeriodStart: new Date(session.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(session.current_period_end * 1000).toISOString(),
          createdAt: now,
          updatedAt: now,
        });
        
        // Add initial 5 credits
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

  // Handle subscription renewal/webhook events
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    
    if (invoice.subscription) {
      // Find the subscription by stripe subscription id
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription.toString()))
        .limit(1);

      if (subscription) {
        const userId = subscription.userId;
        const now = new Date().toISOString();
        
        // Add 5 credits for the monthly renewal
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

        // Update subscription period
        await db
          .update(userSubscriptions)
          .set({
            currentPeriodStart: new Date(invoice.period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(invoice.period_end * 1000).toISOString(),
            updatedAt: now,
          })
          .where(eq(userSubscriptions.id, subscription.id));
      }
    }
  }

  // Handle subscription cancellation
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

  // Handle original payment intent events (for one-time purchases)
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

      if (existing) {
        await db
          .update(userCredits)
          .set({
            balance: newBalance,
            updatedAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
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
