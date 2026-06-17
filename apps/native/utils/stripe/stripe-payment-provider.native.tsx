"use client";

import { APP_DISPLAY_NAME_SPACE } from "@suwa/app-info";
import { env } from "@suwa/env/native";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

interface PaymentSheetResult {
  error?: { code?: string; message?: string };
}

interface PaymentSheetContextValue {
  initPaymentSheet: (params: {
    paymentIntentClientSecret: string;
    merchantDisplayName?: string;
    amount?: number;
    currency?: string;
  }) => Promise<PaymentSheetResult>;
  presentPaymentSheet: () => Promise<PaymentSheetResult>;
}

type ResolveFn = (result: PaymentSheetResult) => void;

const PaymentSheetContext = createContext<PaymentSheetContextValue | null>(
  null
);

function PaymentSheetProviderInner({ children }: PropsWithChildren) {
  const stripe = useStripe();
  const [isPresenting, setIsPresenting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const resolveRef = useRef<ResolveFn | null>(null);

  const initPaymentSheet = useCallback(
    async (params: {
      paymentIntentClientSecret: string;
      merchantDisplayName?: string;
    }): Promise<PaymentSheetResult> => {
      const result = await stripe.initPaymentSheet({
        paymentIntentClientSecret: params.paymentIntentClientSecret,
        merchantDisplayName:
          params.merchantDisplayName ?? APP_DISPLAY_NAME_SPACE,
      });
      if (result.error) {
        return {
          error: { message: result.error.message, code: result.error.code },
        };
      }
      setClientSecret(params.paymentIntentClientSecret);
      return {};
    },
    [stripe]
  );

  const presentPaymentSheet =
    useCallback(async (): Promise<PaymentSheetResult> => {
      const result = await stripe.presentPaymentSheet();
      if (result.error) {
        return {
          error: { message: result.error.message, code: result.error.code },
        };
      }
      return {};
    }, [stripe]);

  return (
    <PaymentSheetContext.Provider
      value={{ initPaymentSheet, presentPaymentSheet }}
    >
      {children}
    </PaymentSheetContext.Provider>
  );
}

export function StripePaymentProvider({ children }: PropsWithChildren) {
  return (
    <StripeProvider publishableKey={env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
      <PaymentSheetProviderInner>{children}</PaymentSheetProviderInner>
    </StripeProvider>
  );
}

export function usePaymentSheet(): PaymentSheetContextValue {
  const ctx = useContext(PaymentSheetContext);
  if (!ctx) {
    throw new Error(
      "usePaymentSheet must be used within StripePaymentProvider"
    );
  }
  return ctx;
}
