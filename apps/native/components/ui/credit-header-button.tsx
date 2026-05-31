import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CREDIT_PRICE_CENTS,
  MONTHLY_PLAN_AMOUNT_CENTS,
  MONTHLY_PLAN_CREDITS,
  MONTHLY_PLAN_TYPE,
  TAX_RATE,
} from "@zen-doc/pricing";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { usePaymentSheet } from "@/utils/stripe";

const CREDIT_OPTIONS = [1, 5, 10, 20] as const;
const SUBSCRIPTION_CREDITS = MONTHLY_PLAN_CREDITS;

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreditHeaderButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [selectedCredits, setSelectedCredits] = useState<
    (typeof CREDIT_OPTIONS)[number]
  >(CREDIT_OPTIONS[0]);
  const [selectedOffer, setSelectedOffer] = useState<
    "credits" | "subscription"
  >("credits");
  const creditQuery = useQuery(orpc.getUserCredits.queryOptions());
  const subscriptionQuery = useQuery(orpc.getUserSubscription.queryOptions());
  const paymentSheet = usePaymentSheet();

  const purchaseMutation = useMutation(
    orpc.purchaseCredits.mutationOptions({
      onSuccess: async (result) => {
        if (!result.clientSecret) {
          throw new Error("Stripe did not return a payment client secret");
        }

        const initResult = await paymentSheet.initPaymentSheet({
          paymentIntentClientSecret: result.clientSecret,
          merchantDisplayName: "Zen Doc",
        });

        if (initResult.error) {
          throw new Error(
            initResult.error.message ?? "Unable to open payment sheet"
          );
        }

        const presentResult = await paymentSheet.presentPaymentSheet();
        if (presentResult.error) {
          throw new Error(presentResult.error.message ?? "Payment failed");
        }

        await creditQuery.refetch();
        setModalVisible(false);
        setPurchaseError(null);
      },
      onError: (error) => {
        setPurchaseError(
          error instanceof Error ? error.message : "Unable to buy credits"
        );
      },
    })
  );

  const subscriptionMutation = useMutation(
    orpc.createSubscription.mutationOptions({
      onSuccess: async (result) => {
        if (!result.clientSecret) {
          throw new Error("Stripe did not return a payment client secret");
        }

        const initResult = await paymentSheet.initPaymentSheet({
          paymentIntentClientSecret: result.clientSecret,
          merchantDisplayName: "Zen Doc",
        });

        if (initResult.error) {
          throw new Error(
            initResult.error.message ?? "Unable to open payment sheet"
          );
        }

        const presentResult = await paymentSheet.presentPaymentSheet();
        if (presentResult.error) {
          throw new Error(presentResult.error.message ?? "Payment failed");
        }

        await creditQuery.refetch();
        await subscriptionQuery.refetch();
        setModalVisible(false);
        setPurchaseError(null);
      },
      onError: (error) => {
        setPurchaseError(
          error instanceof Error
            ? error.message
            : "Unable to create subscription"
        );
      },
    })
  );

  const handleBuyCredits = () => {
    setPurchaseError(null);

    const mutationOptions = {
      credits: selectedCredits,
      returnUrl:
        typeof window === "undefined" ? undefined : window.location.href,
    };

    purchaseMutation.mutate(mutationOptions);
  };

  const handleSubscribe = () => {
    setPurchaseError(null);

    const mutationOptions = {
      planType: MONTHLY_PLAN_TYPE,
      returnUrl:
        typeof window === "undefined" ? undefined : window.location.href,
    } as const;

    subscriptionMutation.mutate(mutationOptions);
  };

  const getButtonText = () => {
    if (purchaseMutation.isPending || subscriptionMutation.isPending) {
      return "Processing...";
    }

    if (selectedOffer === "subscription") {
      return "Subscribe now";
    }

    return "Continue to payment";
  };

  const renderCreditButtonText = () => {
    if (subscriptionQuery.data?.status === "active") {
      return (
        <>
          {creditQuery.data?.balance ?? 0} Credits{" "}
          <Text className="text-muted-foreground text-xs">(Subscribed)</Text>
        </>
      );
    }

    return `${creditQuery.data?.balance ?? 0} Credits`;
  };

  return (
    <>
      <Button
        onPress={() => setModalVisible(true)}
        size="sm"
        variant="secondary"
      >
        {creditQuery.isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          renderCreditButtonText()
        )}
      </Button>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View className="flex-1 justify-center bg-black/50 p-6">
          <Card>
            <View className="flex-row items-start justify-between">
              <Text className="font-bold font-sans text-foreground text-xl">
                Buy Credits
              </Text>
              <Pressable
                accessibilityRole="button"
                className="rounded-control border-2 border-border bg-card px-2 py-1"
                onPress={() => setModalVisible(false)}
              >
                <Text className="font-bold text-foreground text-sm">X</Text>
              </Pressable>
            </View>

            <Text className="text-muted-foreground text-sm">
              Choose a one-time credit pack or a monthly subscription.
            </Text>

            {subscriptionQuery.data?.status === "active" ? null : (
              <View className="flex-row gap-2 rounded-card border-2 border-border bg-muted/20 p-1">
                <Pressable
                  accessibilityRole="button"
                  className={`flex-1 rounded-card px-3 py-2 ${
                    selectedOffer === "credits"
                      ? "bg-primary"
                      : "bg-transparent"
                  }`}
                  onPress={() => setSelectedOffer("credits")}
                >
                  <Text
                    className={`text-center font-semibold ${
                      selectedOffer === "credits"
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    Credits
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className={`flex-1 rounded-card px-3 py-2 ${
                    selectedOffer === "subscription"
                      ? "bg-primary"
                      : "bg-transparent"
                  }`}
                  onPress={() => setSelectedOffer("subscription")}
                >
                  <Text
                    className={`text-center font-semibold ${
                      selectedOffer === "subscription"
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    Subscription
                  </Text>
                </Pressable>
              </View>
            )}

            {selectedOffer === "credits" ? (
              <View className="space-y-3">
                <Text className="font-sans text-bold text-foreground">
                  Buy credits
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CREDIT_OPTIONS.map((amount) => {
                    const isSelected = selectedCredits === amount;
                    const subtotal = amount * CREDIT_PRICE_CENTS;
                    const total = subtotal + Math.round(subtotal * TAX_RATE);
                    return (
                      <Pressable
                        accessibilityRole="button"
                        className={`flex-1 rounded-card border-2 p-card ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border bg-card"
                        }`}
                        key={amount}
                        onPress={() => setSelectedCredits(amount)}
                      >
                        <Text
                          className={`text-center font-bold font-sans text-lg ${
                            isSelected
                              ? "text-primary-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {amount}
                        </Text>
                        <Text
                          className={`text-center font-sans text-sm ${
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatPrice(total)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {selectedOffer === "subscription" &&
            subscriptionQuery.data?.status !== "active" ? (
              <View className="gap-1 rounded-card border-2 border-border bg-muted/30 p-card">
                <Text className="font-sans text-bold text-foreground">
                  Monthly Subscription
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-sm">
                    Credits per month:
                  </Text>
                  <Text className="text-foreground text-sm">
                    {SUBSCRIPTION_CREDITS} credits
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-sm">
                    Cost per month:
                  </Text>
                  <Text className="text-foreground text-sm">
                    {formatPrice(MONTHLY_PLAN_AMOUNT_CENTS)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-sm">
                    Effective cost per credit:
                  </Text>
                  <Text className="text-foreground text-sm">
                    {formatPrice(
                      Math.round(
                        MONTHLY_PLAN_AMOUNT_CENTS / SUBSCRIPTION_CREDITS
                      )
                    )}
                  </Text>
                </View>
                <View className="mt-1 border-border border-t pt-1">
                  <Text className="font-sans text-bold text-foreground">
                    You save 33% vs buying separately
                  </Text>
                </View>
              </View>
            ) : null}

            {selectedOffer === "credits" ? (
              <View className="gap-1 rounded-card border-2 border-border bg-muted/30 p-card">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-sm">
                    Subtotal ({selectedCredits} ×{" "}
                    {formatPrice(CREDIT_PRICE_CENTS)})
                  </Text>
                  <Text className="text-foreground text-sm">
                    {formatPrice(selectedCredits * CREDIT_PRICE_CENTS)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-sm">
                    Tax ({(TAX_RATE * 100).toFixed(0)}%)
                  </Text>
                  <Text className="text-foreground text-sm">
                    {formatPrice(
                      Math.round(
                        selectedCredits * CREDIT_PRICE_CENTS * TAX_RATE
                      )
                    )}
                  </Text>
                </View>
                <View className="mt-1 border-border border-t pt-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-foreground text-sm">
                      Total
                    </Text>
                    <Text className="font-bold text-base text-foreground">
                      {formatPrice(
                        selectedCredits * CREDIT_PRICE_CENTS +
                          Math.round(
                            selectedCredits * CREDIT_PRICE_CENTS * TAX_RATE
                          )
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {purchaseError ? (
              <Text className="text-destructive text-sm">{purchaseError}</Text>
            ) : null}

            <Button
              className="w-full"
              disabled={
                purchaseMutation.isPending || subscriptionMutation.isPending
              }
              onPress={
                selectedOffer === "subscription"
                  ? handleSubscribe
                  : handleBuyCredits
              }
            >
              {getButtonText()}
            </Button>

            <Button
              className="mt-3 w-full"
              onPress={() => setModalVisible(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </Card>
        </View>
      </Modal>
    </>
  );
}
