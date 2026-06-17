import { env } from "@suwa/env/server";
import { TAX_RATE } from "@suwa/pricing";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = env.STRIPE_SECRET_KEY;
    stripeInstance = new Stripe(key, {
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripeInstance;
}

export function getPayoutAmount(priceCents: number): {
  total: number;
  platformFee: number;
  doctorNet: number;
} {
  const tax = Math.round(priceCents * TAX_RATE);
  const total = priceCents + tax;
  const platformFee = tax;
  const doctorNet = priceCents;
  return { total, platformFee, doctorNet };
}

export function createDirectChargePaymentIntent(params: {
  amount: number;
  platformFee: number;
  doctorNet: number;
  stripeAccountId: string;
  doctorId: string;
  patientId: string;
  sessionId: string;
  description: string;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: "usd",
    transfer_data: {
      destination: params.stripeAccountId,
    },
    application_fee_amount: params.platformFee,
    description: params.description,
    metadata: {
      sessionId: params.sessionId,
      doctorId: params.doctorId,
      patientId: params.patientId,
      platformFee: String(params.platformFee),
      doctorNet: String(params.doctorNet),
    },
  });
}

export function refundPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
}

export function createHoldPaymentIntent(params: {
  amount: number;
  patientId: string;
  doctorId: string;
  sessionId: string;
  description: string;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: "usd",
    capture_method: "manual",
    automatic_payment_methods: {
      enabled: true,
    },
    description: params.description,
    metadata: {
      sessionId: params.sessionId,
      doctorId: params.doctorId,
      patientId: params.patientId,
      type: "session_hold",
    },
  });
}

export function capturePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.capture(paymentIntentId);
}

export function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
}
