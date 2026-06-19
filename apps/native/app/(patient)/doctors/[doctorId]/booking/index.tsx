"use client";

import { APP_DISPLAY_NAME_SPACE } from "@suwa/app-info";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Clock, Sparkles } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/design/ui/button";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { orpc } from "@/utils/orpc";
import { usePaymentSheet } from "@/utils/stripe";
import { useErrorHandler } from "@/utils/use-error-handler";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getNext7Days(): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BookingScreen() {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    startAt: string;
    endAt: string;
  } | null>(null);
  const [bookingStep, setBookingStep] = useState<
    "select" | "processing" | "done"
  >("select");

  const plansQuery = useQuery(
    orpc.getDoctorPlans.queryOptions({
      input: { doctorId: id ?? "" },
      enabled: !!id,
    })
  );
  const doctorQuery = useQuery(
    orpc.getDoctor.queryOptions({
      input: { doctorId: id ?? "" },
      enabled: !!id,
    })
  );
  const doctor = doctorQuery.data?.profile;
  const portraitId = doctorQuery.data?.portrait?.id ?? null;
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(portraitId);
  const plans = plansQuery.data?.plans ?? [];

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const fromDate = useMemo(() => selectedDate?.toISOString(), [selectedDate]);
  const toDate = useMemo(() => {
    if (!selectedDate) {
      return;
    }
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }, [selectedDate]);

  const slotsQuery = useQuery({
    ...orpc.getDoctorAvailableSlots.queryOptions({
      input: {
        doctorId: id ?? "",
        from: fromDate ?? "",
        to: toDate ?? "",
        durationMinutes: selectedPlan?.durationMinutes ?? 30,
      },
    }),
    enabled: !!id && !!selectedDate && !!selectedPlanId,
  });

  const slots = (slotsQuery.data?.slots ?? []) as Array<{
    startAt: string;
    endAt: string;
    available: boolean;
  }>;
  const filteredSlots = slots.filter((slot) => {
    if (!slot.available) {
      return false;
    }
    const slotStart = new Date(slot.startAt);
    if (slotStart.toDateString() !== new Date().toDateString()) {
      return true;
    }
    return slotStart.getTime() > Date.now();
  });

  const paymentSheet = usePaymentSheet();
  const cancelSessionMutation = useMutation(
    orpc.cancelSession.mutationOptions()
  );

  const bookMutation = useMutation(
    orpc.bookSession.mutationOptions({
      onSuccess: async (result) => {
        const clientSecret = result.clientSecret;
        if (!clientSecret) {
          throw new Error("No payment client secret returned");
        }

        const initResult = await paymentSheet.initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: APP_DISPLAY_NAME_SPACE,
        });
        if (initResult.error) {
          cancelSessionMutation.mutate({ sessionId: result.sessionId });
          throw new Error(
            initResult.error.message ?? "Unable to open payment sheet"
          );
        }

        const presentResult = await paymentSheet.presentPaymentSheet();
        if (presentResult.error) {
          cancelSessionMutation.mutate({ sessionId: result.sessionId });
          throw new Error(
            presentResult.error.message ?? "Payment authorization failed"
          );
        }

        setBookingStep("done");
        setTimeout(() => router.replace("/appointments"), 1500);
      },
      onError: (err: Error) => {
        handleError(err);
        setBookingStep("select");
      },
    })
  );

  const handleBook = useCallback(() => {
    if (!(selectedSlot && selectedPlanId && id)) {
      return;
    }
    setBookingStep("processing");
    bookMutation.mutate({
      doctorId: id,
      planId: selectedPlanId,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
    });
  }, [bookMutation, selectedSlot, selectedPlanId, id]);

  const next7Days = getNext7Days();
  const canBook =
    !!(selectedSlot && selectedPlanId) && bookingStep !== "processing";

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-xl bg-background px-lg pt-lg pb-32">
          {/* Header */}
          <View className="mt-sm flex-row items-center gap-md">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background-elevated shadow-sm"
              onPress={() => router.back()}
            >
              <ArrowLeft className="text-primary" size={20} />
            </Pressable>
            <View>
              <Text className="font-serif text-hero text-primary leading-tight">
                Book
              </Text>
              <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
                Consultation
              </Text>
            </View>
          </View>

          {/* Doctor Info */}
          <View className="flex-row items-center gap-lg rounded-3xl border border-border/50 bg-background-subtle/50 p-lg">
            <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-background-elevated">
              {portraitPreviewUrl ? (
                <Image
                  className="h-full w-full"
                  resizeMode="cover"
                  source={{ uri: portraitPreviewUrl }}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="font-serif text-foreground-muted text-lg">
                    {doctor?.displayName?.[0] ?? "D"}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-serif text-primary text-title">
                {doctor?.displayName}
              </Text>
              <Text className="font-sans text-caption text-foreground-secondary">
                {doctor?.headline}
              </Text>
            </View>
          </View>

          {/* Plans */}
          <View className="gap-md">
            <View className="flex-row items-center gap-sm">
              <Sparkles className="text-primary" size={20} />
              <Text className="font-serif text-primary text-title">
                Select Plan
              </Text>
            </View>
            <View className="gap-md">
              {plans.map((plan) => (
                <Pressable
                  className={`rounded-2xl border p-lg ${plan.id === selectedPlanId ? "border-primary bg-primary/5" : "border-border bg-background-elevated"}`}
                  key={plan.id}
                  onPress={() => {
                    setSelectedPlanId(plan.id);
                    setSelectedSlot(null);
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-md">
                      <Text className="font-serif text-foreground text-subtitle">
                        {plan.name}
                      </Text>
                      <View className="rounded-full bg-primary-subtle px-md py-xxs">
                        <Text className="font-bold font-sans text-micro text-primary uppercase">
                          {plan.durationMinutes} min
                        </Text>
                      </View>
                    </View>
                    <Text className="font-serif text-accent text-title">
                      ${(plan.priceCents / 100).toFixed(0)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date Selection */}
          {selectedPlanId && (
            <View className="gap-md">
              <View className="flex-row items-center gap-sm">
                <Calendar className="text-primary" size={20} />
                <Text className="font-serif text-primary text-title">
                  Select Date
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-sm">
                {next7Days.map((day) => {
                  const isToday =
                    day.toDateString() === new Date().toDateString();
                  const isSelected =
                    selectedDate?.toDateString() === day.toDateString();
                  return (
                    <Pressable
                      className={`rounded-2xl px-lg py-md ${isSelected ? "bg-primary" : "bg-background-elevated shadow-sm"}`}
                      key={day.toISOString()}
                      onPress={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                      }}
                    >
                      <Text
                        className={`font-sans font-semibold text-caption ${isSelected ? "text-primary-foreground" : "text-foreground"}`}
                      >
                        {isToday ? "Today" : formatDate(day)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Time Slots */}
          {selectedPlanId && selectedDate && filteredSlots.length > 0 && (
            <View className="gap-md">
              <View className="flex-row items-center gap-sm">
                <Clock className="text-primary" size={20} />
                <Text className="font-serif text-primary text-title">
                  Available Times
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-sm">
                {filteredSlots.map((slot, i) => {
                  const isSelected = selectedSlot?.startAt === slot.startAt;
                  return (
                    <Pressable
                      className={`rounded-2xl px-lg py-md ${isSelected ? "bg-primary" : "bg-background-elevated shadow-sm"}`}
                      key={i}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text
                        className={`font-sans font-semibold text-caption ${isSelected ? "text-primary-foreground" : "text-foreground"}`}
                      >
                        {formatTime(new Date(slot.startAt))}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View className="absolute right-0 bottom-0 left-0 flex-row items-center gap-lg border-border border-t bg-background-elevated/90 px-lg py-md">
        {selectedSlot ? (
          <View className="flex-1">
            <Text className="font-sans text-body text-foreground">
              {formatDate(new Date(selectedSlot.startAt))} at{" "}
              {formatTime(new Date(selectedSlot.startAt))}
            </Text>
          </View>
        ) : (
          <Text className="flex-1 font-sans text-body text-foreground-muted">
            Select a date and time
          </Text>
        )}
        <Button disabled={!canBook} onPress={handleBook} size="lg">
          {bookingStep === "processing" ? (
            <ActivityIndicator color="#faf7f2" />
          ) : (
            "Book Now"
          )}
        </Button>
      </View>
    </View>
  );
}
