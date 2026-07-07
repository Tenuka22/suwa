export const PLATFORM_FEE_PERCENT = 20;

export const PLATFORM_FEE_MULTIPLIER = 1 + PLATFORM_FEE_PERCENT / 100;

export function calculateCheckoutAmount(priceCents: number): number {
  return Math.round(priceCents * PLATFORM_FEE_MULTIPLIER);
}

export function splitSessionRevenue(amountCents: number): {
  doctorEarnedCents: number;
  platformFeeCents: number;
} {
  return {
    doctorEarnedCents: amountCents,
    platformFeeCents: Math.round(amountCents * PLATFORM_FEE_PERCENT / 100),
  };
}
