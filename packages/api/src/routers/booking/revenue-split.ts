export const DOCTOR_REVENUE_SHARE = 0.8;

export function splitSessionRevenue(amountCents: number): {
  doctorEarnedCents: number;
  platformFeeCents: number;
} {
  const doctorEarnedCents = Math.round(amountCents * DOCTOR_REVENUE_SHARE);
  return {
    doctorEarnedCents,
    platformFeeCents: amountCents - doctorEarnedCents,
  };
}
