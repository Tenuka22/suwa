'use client';

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CREDIT_PRICE_CENTS,
  MONTHLY_PLAN_AMOUNT_CENTS,
  MONTHLY_PLAN_CREDITS,
  MONTHLY_PLAN_TYPE,
  TAX_RATE,
} from "@zen-doc/pricing";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { orpc } from "@/utils/orpc";
import { usePaymentSheet } from "@/utils/stripe";
import { Button } from "./button";
import { ErrorDialog, useErrorDialog } from "./error-dialog";

const CREDIT_OPTIONS = [1, 5, 10, 20] as const;

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface CreditPurchaseProps {
  forPatientUserId?: string;
}

export function CreditPurchase({ forPatientUserId }: CreditPurchaseProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<
    (typeof CREDIT_OPTIONS)[number]
  >(CREDIT_OPTIONS[0]);
  const [selectedOffer, setSelectedOffer] = useState<
    "credits" | "subscription"
  >("credits");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { showError, dialogProps } = useErrorDialog();
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
        setPurchaseError(null);
        setModalVisible(false);
        setShowSuccessDialog(true);
      },
      onError: (error) => {
        setPurchaseError(
          error instanceof Error ? error.message : "Unable to buy credits"
        );
        showError(
          "Payment Failed",
          error instanceof Error ? error.message : "Unable to buy credits",
          [
            { label: "Try Again", onPress: handleBuyCredits },
            { label: "Cancel", variant: "secondary", onPress: () => {} },
          ]
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
        setPurchaseError(null);
        setModalVisible(false);
        setShowSuccessDialog(true);
      },
      onError: (error) => {
        setPurchaseError(
          error instanceof Error
            ? error.message
            : "Unable to create subscription"
        );
        showError(
          "Payment Failed",
          error instanceof Error
            ? error.message
            : "Unable to create subscription",
          [
            { label: "Try Again", onPress: handleSubscribe },
            { label: "Cancel", variant: "secondary", onPress: () => {} },
          ]
        );
      },
    })
  );

  const handleBuyCredits = () => {
    setPurchaseError(null);

    purchaseMutation.mutate({
      credits: selectedCredits,
      returnUrl:
        typeof window === "undefined" ? undefined : window.location.href,
      patientUserId: forPatientUserId,
    });
  };

  const handleSubscribe = () => {
    setPurchaseError(null);

    subscriptionMutation.mutate({
      planType: MONTHLY_PLAN_TYPE,
      returnUrl:
        typeof window === "undefined" ? undefined : window.location.href,
    } as const);
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
      return `${creditQuery.data?.balance ?? 0} Credits (Subscribed)`;
    }

    return `${creditQuery.data?.balance ?? 0} Credits`;
  };

  const isPending =
    purchaseMutation.isPending || subscriptionMutation.isPending;

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
          <View className="relative w-full" style={{ maxHeight: 500 }}>
            <View
              className="absolute inset-0 rounded-card bg-border"
              style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
            />
            <ScrollView
              className="rounded-card border-2 border-border bg-card"
              contentContainerClassName="gap-section p-card"
              showsVerticalScrollIndicator
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-bold font-sans text-foreground text-xl">
                    Buy Credits
                  </Text>
                </View>
                <Pressable
                  className="rounded-control border-2 border-border bg-card px-2 py-1"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="font-bold text-foreground text-sm">X</Text>
                </Pressable>
              </View>

              <Text className="font-normal font-sans text-muted-foreground text-sm">
                Choose a one-time credit pack or a monthly subscription.
              </Text>

              {subscriptionQuery.data?.status === "active" ? null : (
                <View className="flex-row gap-2 rounded-card border-2 border-border bg-muted/20 p-1">
                  <Pressable
                    className={`flex-1 rounded-card px-3 py-2 ${
                      selectedOffer === "credits"
                        ? "bg-primary"
                        : "bg-transparent"
                    }`}
                    onPress={() => setSelectedOffer("credits")}
                  >
                    <Text
                      className={`text-center font-sans font-semibold text-sm ${
                        selectedOffer === "credits"
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      Credits
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 rounded-card px-3 py-2 ${
                      selectedOffer === "subscription"
                        ? "bg-primary"
                        : "bg-transparent"
                    }`}
                    onPress={() => setSelectedOffer("subscription")}
                  >
                    <Text
                      className={`text-center font-sans font-semibold text-sm ${
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
                <View>
                  <Text className="font-bold font-sans text-foreground text-sm">
                    Buy credits
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {CREDIT_OPTIONS.map((amount) => {
                      const isSelected = selectedCredits === amount;
                      const subtotal = amount * CREDIT_PRICE_CENTS;
                      const total = subtotal + Math.round(subtotal * TAX_RATE);
                      return (
                        <Pressable
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
                  <Text className="font-bold font-sans text-foreground text-sm">
                    Monthly Subscription
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-normal font-sans text-muted-foreground text-xs">
                      Credits per month:
                    </Text>
                    <Text className="font-normal font-sans text-foreground text-xs">
                      {MONTHLY_PLAN_CREDITS} credits
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-normal font-sans text-muted-foreground text-xs">
                      Cost per month:
                    </Text>
                    <Text className="font-normal font-sans text-foreground text-xs">
                      {formatPrice(MONTHLY_PLAN_AMOUNT_CENTS)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-normal font-sans text-muted-foreground text-xs">
                      Effective cost per credit:
                    </Text>
                    <Text className="font-normal font-sans text-foreground text-xs">
                      {formatPrice(
                        Math.round(
                          MONTHLY_PLAN_AMOUNT_CENTS / MONTHLY_PLAN_CREDITS
                        )
                      )}
                    </Text>
                  </View>
                  <View className="mt-1 border-border border-t pt-1">
                    <Text className="font-bold font-sans text-foreground text-xs">
                      You save 33% vs buying separately
                    </Text>
                  </View>
                </View>
              ) : null}

              {selectedOffer === "credits" ? (
                <View className="gap-1 rounded-card border-2 border-border bg-muted/30 p-card">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-normal font-sans text-muted-foreground text-xs">
                      Subtotal ({selectedCredits} ×{" "}
                      {formatPrice(CREDIT_PRICE_CENTS)})
                    </Text>
                    <Text className="font-normal font-sans text-foreground text-xs">
                      {formatPrice(selectedCredits * CREDIT_PRICE_CENTS)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-normal font-sans text-muted-foreground text-xs">
                      Tax ({(TAX_RATE * 100).toFixed(0)}%)
                    </Text>
                    <Text className="font-normal font-sans text-foreground text-xs">
                      {formatPrice(
                        Math.round(
                          selectedCredits * CREDIT_PRICE_CENTS * TAX_RATE
                        )
                      )}
                    </Text>
                  </View>
                  <View className="mt-1 border-border border-t pt-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-bold font-sans text-foreground text-sm">
                        Total
                      </Text>
                      <Text className="font-bold font-sans text-base text-foreground">
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
                <Text className="font-normal font-sans text-destructive text-sm">
                  {purchaseError}
                </Text>
              ) : null}

              <Button
                className="w-full"
                disabled={isPending}
                onPress={
                  selectedOffer === "subscription"
                    ? handleSubscribe
                    : handleBuyCredits
                }
              >
                {isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  getButtonText()
                )}
              </Button>

              <Button
                className="mt-3 w-full"
                onPress={() => setModalVisible(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowSuccessDialog(false)}
        statusBarTranslucent
        transparent
        visible={showSuccessDialog}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-page">
          <View className="w-full max-w-sm overflow-hidden rounded-card border-2 border-border bg-card p-6">
            <Text className="text-center font-black font-sans text-foreground text-xl">
              Purchase Complete
            </Text>
            <Text className="mt-2 text-center font-normal font-sans text-muted-foreground text-sm leading-5">
              Credits have been added to your account.
            </Text>
            <View className="mt-4">
              <Button
                onPress={() => {
                  setShowSuccessDialog(false);
                  setModalVisible(false);
                }}
              >
                Done
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <ErrorDialog {...dialogProps} />
    </>
  );
}
