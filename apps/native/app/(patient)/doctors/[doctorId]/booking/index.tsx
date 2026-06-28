"use client";

import { APP_DISPLAY_NAME_SPACE } from "@suwa/app-info";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/design/ui/button";
import { Reveal } from "@/components/design/ui/reveal";
import { Skeleton } from "@/components/design/ui/skeleton";
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

interface BookingPlan {
  durationMinutes: number;
  id: string;
  name: string;
  priceCents: number;
}

interface BookingSlot {
  available: boolean;
  endAt: string;
  startAt: string;
}

function PlanPicker({
  onSelect,
  plans,
  selectedPlanId,
}: {
  onSelect: (planId: string) => void;
  plans: BookingPlan[];
  selectedPlanId: string | null;
}) {
  return (
    <View className="gap-md">
      <View className="flex-row items-center gap-sm">
        <Sparkles className="text-primary" size={20} />
        <Text className="font-serif text-foreground text-title">
          1. Select a consultation
        </Text>
      </View>
      <View className="gap-md">
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              className={`rounded-3xl border p-lg ${isSelected ? "border-primary bg-primary-subtle" : "border-border bg-background-elevated"}`}
              key={plan.id}
              onPress={() => onSelect(plan.id)}
            >
              <View className="flex-row items-center justify-between gap-md">
                <View className="flex-1 flex-row items-center gap-md">
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border ${isSelected ? "border-primary bg-primary" : "border-border"}`}
                  >
                    {isSelected ? <Check color="#fbf7f0" size={14} /> : null}
                  </View>
                  <View className="flex-1 gap-xs">
                    <Text className="font-poppins-medium text-caption text-foreground">
                      {plan.name}
                    </Text>
                    <Text className="font-sans text-foreground-muted text-micro">
                      {plan.durationMinutes} minutes
                    </Text>
                  </View>
                </View>
                <Text className="font-serif text-accent text-title">
                  {formatPrice(plan.priceCents)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DayPicker({
  days,
  onSelect,
  selectedDate,
  visible,
}: {
  days: Date[];
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Reveal className="gap-md" delay={40}>
      <View className="flex-row items-center gap-sm">
        <Calendar className="text-primary" size={20} />
        <Text className="font-serif text-foreground text-title">
          2. Pick a day
        </Text>
      </View>
      <ScrollView
        contentContainerClassName="gap-sm"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {days.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected =
            selectedDate?.toDateString() === day.toDateString();
          return (
            <Pressable
              className={`min-w-24 items-center rounded-2xl border px-lg py-md ${isSelected ? "border-primary bg-primary" : "border-border bg-background-elevated"}`}
              key={day.toISOString()}
              onPress={() => onSelect(day)}
            >
              <Text
                className={`font-poppins-medium text-caption ${isSelected ? "text-primary-foreground" : "text-foreground"}`}
              >
                {isToday ? "Today" : formatDate(day)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Reveal>
  );
}

function TimePicker({
  isPending,
  onSelect,
  selectedSlot,
  slots,
  visible,
}: {
  isPending: boolean;
  onSelect: (slot: BookingSlot) => void;
  selectedSlot: BookingSlot | null;
  slots: BookingSlot[];
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  if (isPending) {
    return (
      <View className="gap-md">
        <Skeleton className="h-7 w-36" />
        <View className="flex-row gap-sm">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
        </View>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View className="rounded-2xl bg-background-subtle px-lg py-xl">
        <Text className="text-center font-sans text-caption text-foreground-muted">
          No open times for this day. Try another date.
        </Text>
      </View>
    );
  }

  return (
    <Reveal className="gap-md" delay={40}>
      <View className="flex-row items-center gap-sm">
        <Clock className="text-primary" size={20} />
        <Text className="font-serif text-foreground text-title">
          3. Pick a time
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-sm">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.startAt === slot.startAt;
          return (
            <Pressable
              className={`rounded-2xl border px-lg py-md ${isSelected ? "border-primary bg-primary" : "border-border bg-background-elevated"}`}
              key={slot.startAt}
              onPress={() => onSelect(slot)}
            >
              <Text
                className={`font-poppins-medium text-caption ${isSelected ? "text-primary-foreground" : "text-foreground"}`}
              >
                {formatTime(new Date(slot.startAt))}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Reveal>
  );
}

function BookingFooter({
  bookingStep,
  bottomPadding,
  canBook,
  onBook,
  selectedSlot,
}: {
  bookingStep: "done" | "processing" | "select";
  bottomPadding: number;
  canBook: boolean;
  onBook: () => void;
  selectedSlot: BookingSlot | null;
}) {
  const selectionLabel = selectedSlot
    ? `${formatDate(new Date(selectedSlot.startAt))} at ${formatTime(new Date(selectedSlot.startAt))}`
    : "Select a consultation, day, and time";

  return (
    <View
      className="absolute right-0 bottom-0 left-0 flex-row items-center gap-lg border-border border-t bg-background-elevated px-lg pt-md"
      style={{ paddingBottom: bottomPadding }}
    >
      <Text
        className={`flex-1 text-caption ${selectedSlot ? "font-poppins-medium text-foreground" : "font-sans text-foreground-muted"}`}
      >
        {selectionLabel}
      </Text>
      <Button disabled={!canBook} onPress={onBook} size="lg">
        {bookingStep === "processing" ? (
          <ActivityIndicator color="#faf7f2" />
        ) : (
          "Confirm booking"
        )}
      </Button>
    </View>
  );
}

export default function BookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { handleError } = useErrorHandler();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
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

  const fromDate = useMemo(() => {
    if (!selectedDate) return;
    return new Date(
      Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      )
    ).toISOString();
  }, [selectedDate]);
  const toDate = useMemo(() => {
    if (!selectedDate) return;
    return new Date(
      Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate() + 1
      )
    ).toISOString();
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

  const slots = (slotsQuery.data?.slots ?? []) as BookingSlot[];
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
        setTimeout(() => router.replace("/appointments"), 2200);
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

  if (doctorQuery.isPending || plansQuery.isPending) {
    return (
      <View className="flex-1 gap-xl bg-background px-lg pt-14">
        <Skeleton className="h-11 w-11 rounded-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </View>
    );
  }

  if (bookingStep === "done") {
    return (
      <View className="flex-1 items-center justify-center gap-huge bg-background px-huge">
        <Reveal className="items-center gap-xl" delay={40}>
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-subtle">
            <CheckCircle2 color="#315b4d" size={48} strokeWidth={1.8} />
          </View>
          <View className="items-center gap-sm">
            <Text className="text-center font-serif text-[38px] text-foreground">
              You&apos;re booked
            </Text>
            <Text className="text-center font-sans text-body text-foreground-secondary leading-relaxed">
              Your consultation request is ready. We&apos;re taking you to your
              appointments.
            </Text>
          </View>
        </Reveal>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-xxl bg-background px-lg pt-12 pb-40">
          {/* Header */}
          <View className="flex-row items-center gap-md">
            <Pressable
              accessibilityLabel="Go back"
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background-elevated shadow-sm"
              onPress={() => router.back()}
            >
              <ArrowLeft className="text-primary" size={20} />
            </Pressable>
            <View>
              <Text className="font-serif text-[32px] text-primary leading-tight">
                Choose a time
              </Text>
              <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
                Book consultation - 3 quick steps
              </Text>
            </View>
          </View>

          {/* Doctor Info */}
          <Reveal delay={40}>
            <View className="flex-row items-center gap-lg rounded-3xl bg-primary px-lg py-lg">
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
              <View className="flex-1 gap-xs">
                <Text className="font-serif text-primary-foreground text-title">
                  {doctor?.displayName}
                </Text>
                <Text
                  className="font-sans text-caption text-primary-foreground/70"
                  numberOfLines={2}
                >
                  {doctor?.headline ?? "Private consultation on Suwa"}
                </Text>
              </View>
            </View>
          </Reveal>

          <PlanPicker
            onSelect={(planId) => {
              setSelectedPlanId(planId);
              setSelectedDate(null);
              setSelectedSlot(null);
            }}
            plans={plans}
            selectedPlanId={selectedPlanId}
          />
          <DayPicker
            days={next7Days}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
            }}
            selectedDate={selectedDate}
            visible={Boolean(selectedPlanId)}
          />
          <TimePicker
            isPending={slotsQuery.isPending}
            onSelect={setSelectedSlot}
            selectedSlot={selectedSlot}
            slots={filteredSlots}
            visible={Boolean(selectedPlanId && selectedDate)}
          />
        </View>
      </ScrollView>

      <BookingFooter
        bookingStep={bookingStep}
        bottomPadding={Math.max(insets.bottom, 12)}
        canBook={canBook}
        onBook={handleBook}
        selectedSlot={selectedSlot}
      />
    </View>
  );
}
