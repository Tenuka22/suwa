import { env } from "@zen-doc/env/server";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = env.STRIPE_SECRET_KEY;
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export const SESSION_PAYOUT_AMOUNT = 5000; // $50.00 in cents
