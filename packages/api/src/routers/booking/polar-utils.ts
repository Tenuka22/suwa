import { Polar } from "@polar-sh/sdk";
import { env } from "@suwa/env/server";

let polarInstance: Polar | null = null;
let bookingProductId: string | null = null;

export function getPolar(): Polar {
  if (!polarInstance) {
    polarInstance = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: (env.POLAR_SERVER as "sandbox" | "production") ?? "production",
    });
  }

  return polarInstance;
}

const BOOKING_PRODUCT_NAME = "Session Booking";

async function getOrCreateBookingProduct(): Promise<string> {
  if (bookingProductId) return bookingProductId;

  const polar = getPolar();
  const existing = await polar.products.list({ query: BOOKING_PRODUCT_NAME } as any);
  const items = (existing as any).items ?? [];
  if (items.length > 0) {
    bookingProductId = items[0].id;
    return bookingProductId!;
  }

  const product = await polar.products.create({
    name: BOOKING_PRODUCT_NAME,
    description: "One-time payment for a doctor consultation session",
    prices: [{ amountType: "fixed", priceCurrency: "usd", priceAmount: 0 }],
  } as any);

  bookingProductId = (product as any).id;
  return bookingProductId!;
}

export async function createCheckoutSession(params: {
  amount?: number;
  customerExternalId: string;
  metadata: Record<string, string | number | boolean>;
  successUrl?: string;
  returnUrl?: string;
}): Promise<{ id: string; url: string }> {
  const polar = getPolar();
  const productId = await getOrCreateBookingProduct();
  const result = await polar.checkouts.create({
    products: [productId],
    amount: params.amount,
    externalCustomerId: params.customerExternalId,
    metadata: params.metadata,
    successUrl: params.successUrl,
    returnUrl: params.returnUrl,
  } as any);

  const checkout = (result as any).checkout ?? result;
  return {
    id: checkout.id,
    url: checkout.url,
  };
}

export async function refundOrder(orderId: string, amount: number): Promise<string> {
  const polar = getPolar();
  const result = await polar.refunds.create({
    orderId,
    reason: "customer_request",
    amount,
  } as any);

  const refund = (result as any).refund ?? result;
  return refund.id;
}
