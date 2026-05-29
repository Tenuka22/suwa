import { CREDIT_PRICE_CENTS, TAX_RATE } from "@zen-doc/pricing";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../../booking/stripe-utils";

const DEFAULT_CREDIT_QUANTITY = 1;
const DEFAULT_RETURN_URL = "https://zen-doc.app";

export const purchaseCreditsRoute = protectedProcedure
  .input(
    z.object({
      credits: z.number().int().positive().default(DEFAULT_CREDIT_QUANTITY),
      returnUrl: z.string().url().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const stripe = getStripe();
    const subtotalCents = input.credits * CREDIT_PRICE_CENTS;
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const amount = subtotalCents + taxCents;

     const session = await stripe.checkout.sessions.create({
       mode: "payment",
       line_items: [
         {
           price_data: {
             currency: "usd",
             product_data: {
               name: `${input.credits} credit top-up`,
             },
             unit_amount: amount,
           },
           quantity: 1,
         },
       ],
       payment_intent_data: {
         metadata: {
           type: "credit_topup",
           userId,
           credits: String(input.credits),
         },
       },
       return_url: input.returnUrl ?? DEFAULT_RETURN_URL,
     });

    return {
      clientSecret: session.client_secret,
      amount,
      subtotalCents,
      taxCents,
      credits: input.credits,
    };
  });
