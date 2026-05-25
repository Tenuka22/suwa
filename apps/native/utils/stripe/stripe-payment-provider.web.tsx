import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { env } from "@zen-doc/env/native";

const stripePromise = loadStripe(env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface PaymentSheetResult {
  error?: { message: string; code?: string };
}

interface PaymentSheetContextValue {
  initPaymentSheet: (params: {
    paymentIntentClientSecret: string;
    merchantDisplayName?: string;
  }) => Promise<PaymentSheetResult>;
  presentPaymentSheet: () => Promise<PaymentSheetResult>;
}

type ResolveFn = (result: PaymentSheetResult) => void;

const PaymentSheetContext = createContext<PaymentSheetContextValue | null>(
  null
);

function PaymentSheetModal({
  clientSecret,
  onResolve,
  onDismiss,
}: {
  clientSecret: string;
  onResolve: ResolveFn;
  onDismiss: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!(stripe && elements)) {
      return;
    }

    setPaying(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setPaying(false);
      onResolve({
        error: { message: error.message ?? "", code: error.type },
      });
      return;
    }

    onResolve({});
  }, [stripe, elements, onResolve]);

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 420,
        gap: 20,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Complete Payment
      </Text>

      <PaymentElement />

      <View style={{ gap: 8 }}>
        <Pressable
          disabled={!stripe || paying}
          onPress={handleConfirm}
          style={{
            backgroundColor: !stripe || paying ? "#94a3b8" : "#3b82f6",
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
          }}
        >
          {paying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Pay Now
            </Text>
          )}
        </Pressable>

        {paying ? null : (
          <Pressable
            onPress={onDismiss}
            style={{ padding: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#64748b", fontSize: 14 }}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PaymentSheetProviderInner({ children }: PropsWithChildren) {
  const [isPresenting, setIsPresenting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const resolveRef = useRef<ResolveFn | null>(null);

  const initPaymentSheet = useCallback(
    (params: {
      paymentIntentClientSecret: string;
      merchantDisplayName?: string;
    }): Promise<PaymentSheetResult> => {
      setClientSecret(params.paymentIntentClientSecret);
      return Promise.resolve({ error: undefined });
    },
    []
  );

  const presentPaymentSheet = useCallback((): Promise<PaymentSheetResult> => {
    setIsPresenting(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setIsPresenting(false);
    setClientSecret(null);
    resolveRef.current?.({ error: { message: "Canceled", code: "Canceled" } });
    resolveRef.current = null;
  }, []);

  const handleResolve = useCallback((result: PaymentSheetResult) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const value = useMemo<PaymentSheetContextValue>(
    () => ({ initPaymentSheet, presentPaymentSheet }),
    [initPaymentSheet, presentPaymentSheet]
  );

  return (
    <PaymentSheetContext.Provider value={value}>
      {children}
      {isPresenting && clientSecret ? (
        <Modal
          animationType="slide"
          onRequestClose={handleDismiss}
          transparent
          visible
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <Elements options={{ clientSecret }} stripe={stripePromise}>
              <PaymentSheetModal
                clientSecret={clientSecret}
                onDismiss={handleDismiss}
                onResolve={(result) => {
                  setIsPresenting(false);
                  setClientSecret(null);
                  handleResolve(result);
                }}
              />
            </Elements>
          </View>
        </Modal>
      ) : null}
    </PaymentSheetContext.Provider>
  );
}

export function StripePaymentProvider({ children }: PropsWithChildren) {
  return <PaymentSheetProviderInner>{children}</PaymentSheetProviderInner>;
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
