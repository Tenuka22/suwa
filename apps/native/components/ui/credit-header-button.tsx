import { useMutation, useQuery } from "@tanstack/react-query";
import { CREDIT_PRICE_CENTS, TAX_RATE } from "@zen-doc/pricing";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { usePaymentSheet } from "@/utils/stripe";

const CREDIT_OPTIONS = [1, 5, 10, 20] as const;

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreditHeaderButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [selectedCredits, setSelectedCredits] = useState<
    (typeof CREDIT_OPTIONS)[number]
  >(CREDIT_OPTIONS[0]);
  const creditQuery = useQuery(orpc.getUserCredits.queryOptions());
  const paymentSheet = usePaymentSheet();

  const purchaseMutation = useMutation(
    orpc.purchaseCredits.mutationOptions({
      onSuccess: async (result) => {
        if (!result.clientSecret) {
          throw new Error("Stripe did not return a payment sheet secret");
        }

        const initResult = await paymentSheet.initPaymentSheet({
          paymentIntentClientSecret: result.clientSecret,
          merchantDisplayName: "Zen Doc",
        });
        if (initResult.error) {
          throw new Error(
            initResult.error.message ?? "Unable to start payment"
          );
        }

        const presentResult = await paymentSheet.presentPaymentSheet();
        if (presentResult.error) {
          throw new Error(
            presentResult.error.message ?? "Unable to complete payment"
          );
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

  const handleBuyCredits = () => {
    setPurchaseError(null);

    const mutationOptions: { credits: (typeof CREDIT_OPTIONS)[number]; returnUrl?: string } = {
      credits: selectedCredits,
    };

    if (typeof window !== "undefined") {
      mutationOptions.returnUrl = window.location.href;
    }

    purchaseMutation.mutate(mutationOptions);
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
          `${creditQuery.data?.balance ?? 0} Credits`
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
              Add credits to your account.
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

            {selectedCredits ? (
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
              disabled={purchaseMutation.isPending}
              onPress={handleBuyCredits}
            >
              {purchaseMutation.isPending
                ? "Processing..."
                : "Continue to payment"}
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
