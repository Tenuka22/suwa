import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  MapPin,
  Sparkles,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

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
    hour12: true,
    minute: "2-digit",
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AvailabilityInfo({
  availability,
}: {
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  const colors = useThemeColor();
  if (availability.length === 0) {
    return (
      <Text className="py-2 text-center text-muted-foreground text-sm">
        No availability set
      </Text>
    );
  }
  return (
    <View className="gap-1.5">
      {availability.map((slot, i) => (
        <View
          className="flex-row items-center gap-2 rounded-lg border border-border/50 bg-muted/5 px-3 py-2"
          key={i}
        >
          <Text className="min-w-[40px] font-bold text-foreground text-xs">
            {DAY_NAMES[slot.dayOfWeek]}
          </Text>
          <Clock color={colors.mutedForeground} size={12} />
          <Text className="font-medium text-muted-foreground text-xs">
            {slot.startTime} - {slot.endTime}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PlanSelection({
  plans,
  selectedPlanId,
  onSelectPlan,
}: {
  onSelectPlan: (planId: string) => void;
  plans: {
    durationMinutes: number;
    id: string;
    name: string;
  }[];
  selectedPlanId: string | null;
}) {
  if (plans.length === 0) {
    return null;
  }

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <Sparkles color="#000" size={16} strokeWidth={2.5} />
        <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
          Select Plan
        </Text>
      </View>
      <View className="gap-2">
        {plans.map((plan) => (
          <Card
            className={
              plan.id === selectedPlanId
                ? "border-primary bg-primary/10"
                : "bg-background"
            }
            key={plan.id}
            onPress={() => onSelectPlan(plan.id)}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-black font-sans text-foreground text-sm">
                {plan.name}
              </Text>
              <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5">
                <Clock color="#a22a2a" size={10} strokeWidth={2.5} />
                <Text className="font-bold font-sans text-primary text-xs">
                  {plan.durationMinutes} min
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Card>
  );
}

export default function BookingScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    startAt: string;
    endAt: string;
  } | null>(null);
  const [bookingStep, setBookingStep] = useState<
    "select" | "processing" | "error" | "done"
  >("select");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["doctor-plans", id],
    queryFn: () => orpc.getDoctorPlans.call({ doctorId: id ?? "" }),
    enabled: !!id,
  });

  const doctorQuery = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => orpc.getDoctor.call({ doctorId: id ?? "" }),
    enabled: !!id,
  });

  const availabilityQuery = useQuery({
    queryKey: ["doctor-availability", id],
    queryFn: () =>
      orpc.getDoctorWeeklyAvailability.call({ doctorId: id ?? "" }),
    enabled: !!id,
  });

  const today = useMemo(() => new Date(), []);
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
    queryKey: ["doctor-slots", id, fromDate, selectedPlanId],
    queryFn: () => {
      if (!(fromDate && toDate && selectedPlanId)) {
        throw new Error("Missing required selections");
      }
      const plan = plans.find(
        (p: { id: string; durationMinutes: number }) => p.id === selectedPlanId
      );
      return orpc.getDoctorAvailableSlots.call({
        doctorId: id ?? "",
        from: fromDate,
        to: toDate,
        durationMinutes: plan?.durationMinutes ?? 30,
      });
    },
    enabled: !!id && !!selectedDate && !!selectedPlanId,
  });

  const slots = (slotsQuery.data?.slots ?? []) as Array<{
    startAt: string;
    endAt: string;
    available: boolean;
  }>;
  const filteredSlots = slots.filter((slot) => {
    if (!selectedDate) {
      return true;
    }

    const slotStart = new Date(slot.startAt);
    const isToday = slotStart.toDateString() === new Date().toDateString();

    if (!isToday) {
      return true;
    }

    return slotStart.getTime() > Date.now();
  });
  const plans = plansQuery.data?.plans ?? [];
  const doctor = doctorQuery.data?.profile;
  const availability = (availabilityQuery.data?.slots ?? []) as Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  const selectedPlan = plans.find(
    (p: { id: string }) => p.id === selectedPlanId
  );

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!(selectedSlot && id && selectedPlanId)) {
        throw new Error("Missing required selections");
      }
      const result = await orpc.bookSession.call({
        doctorId: id,
        planId: selectedPlanId,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
      });
      if (!result.ok) {
        throw new Error("Booking failed");
      }
      return result;
    },
    onSuccess: async () => {
      setBookingStep("done");
      setTimeout(() => {
        router.replace("/appointments?bookingSuccess=true");
      }, 1500);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setBookingStep("error");
    },
  });

  const handleBook = useCallback(() => {
    if (!(selectedSlot && selectedPlanId)) {
      return;
    }
    setBookingStep("processing");
    bookMutation.mutate();
  }, [bookMutation, selectedSlot, selectedPlanId]);

  const next7Days = getNext7Days();

  if (bookingStep === "error") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center gap-6 px-page py-page">
          <View className="rounded-full bg-destructive/20 p-4">
            <X color={colors.destructive} size={32} />
          </View>
          <Text className="text-center font-black text-2xl text-foreground">
            Booking Failed
          </Text>
          <Text className="max-w-[300px] text-center text-muted-foreground text-sm">
            {errorMessage ?? "An unexpected error occurred. Please try again."}
          </Text>
          <Button
            onPress={() => {
              setBookingStep("select");
              setErrorMessage(null);
            }}
            variant="primary"
          >
            Try Again
          </Button>
        </Screen>
      </>
    );
  }

  if (bookingStep === "done") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center gap-6 px-page py-page">
          <View className="rounded-full bg-success/20 p-4">
            <Check color={colors.success} size={32} />
          </View>
          <Text className="text-center font-black text-2xl text-foreground">
            Request Sent!
          </Text>
          <Text className="max-w-[300px] text-center text-muted-foreground text-sm">
            Your session request has been sent. The doctor will review and
            respond shortly.
          </Text>
          <ActivityIndicator size="small" />
        </Screen>
      </>
    );
  }

  const isLoading =
    plansQuery.isLoading ||
    slotsQuery.isLoading ||
    doctorQuery.isLoading ||
    availabilityQuery.isLoading;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="flex-row items-center justify-between">
          <Button
            icon={<ArrowLeft color={colors.foreground} size={16} />}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            size="sm"
            variant="secondary"
          >
            Back
          </Button>
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
            Request Session
          </Text>
          <View style={{ width: 80 }} />
        </View>

        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-8">
              {doctor && (
                <Card className="gap-4">
                  <View className="flex-row items-center gap-4">
                    <View className="h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-secondary">
                      <Text className="font-black font-sans text-foreground text-lg">
                        {getInitials(doctor.displayName ?? "Dr")}
                      </Text>
                    </View>
                    <View className="flex-1 justify-center gap-0.5">
                      <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
                        {doctor.displayName}
                      </Text>
                      {doctor.location && (
                        <View className="flex-row items-center gap-1">
                          <MapPin
                            color={colors.mutedForeground}
                            size={12}
                            strokeWidth={2.5}
                          />
                          <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                            {doctor.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
                    {doctor.headline ?? "Licensed medical practitioner."}
                  </Text>
                </Card>
              )}

              <Card className="gap-4">
                <View className="flex-row items-center gap-2">
                  <Clock
                    color={colors.foreground}
                    size={16}
                    strokeWidth={2.5}
                  />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    Weekly Availability
                  </Text>
                </View>
                <AvailabilityInfo availability={availability} />
              </Card>

              <PlanSelection
                onSelectPlan={(planId) => {
                  setSelectedPlanId(planId);
                  setSelectedSlot(null);
                }}
                plans={plans.map((p) => ({
                  durationMinutes: p.durationMinutes,
                  id: p.id,
                  name: p.name,
                }))}
                selectedPlanId={selectedPlanId}
              />

              <Card className="gap-4">
                <View className="flex-row items-center gap-2">
                  <Calendar
                    color={colors.foreground}
                    size={16}
                    strokeWidth={2.5}
                  />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    Select Date
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {next7Days.map((day) => {
                    const isSelected =
                      selectedDate?.toDateString() === day.toDateString();
                    const isToday = day.toDateString() === today.toDateString();
                    return (
                      <Button
                        key={day.toISOString()}
                        onPress={() => {
                          setSelectedDate(day);
                          setSelectedSlot(null);
                        }}
                        size="sm"
                        variant={isSelected ? "primary" : "secondary"}
                      >
                        {isToday ? "Today" : formatDate(day)}
                      </Button>
                    );
                  })}
                </View>
              </Card>

              {selectedPlanId && selectedDate && slots.length > 0 && (
                <Card className="gap-4">
                  <View className="flex-row items-center gap-2">
                    <Clock
                      color={colors.foreground}
                      size={16}
                      strokeWidth={2.5}
                    />
                    <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                      Available Times
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {filteredSlots.map((slot, i) => {
                      const isSelected = selectedSlot?.startAt === slot.startAt;
                      return (
                        <Button
                          disabled={!slot.available}
                          key={i}
                          onPress={() => setSelectedSlot(slot)}
                          size="sm"
                          variant={isSelected ? "primary" : "secondary"}
                        >
                          {`${formatTime(new Date(slot.startAt))} - ${formatTime(new Date(slot.endAt))}`}
                        </Button>
                      );
                    })}
                  </View>
                </Card>
              )}

              <Button
                disabled={
                  !(selectedSlot && selectedPlanId) ||
                  bookingStep === "processing"
                }
                onPress={handleBook}
                variant="primary"
              >
                {bookingStep === "processing" ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="font-bold font-sans text-primary-foreground text-sm uppercase tracking-wider">
                    Request Appointment
                  </Text>
                )}
              </Button>
            </View>
          </ScrollView>
        )}
      </Screen>
    </>
  );
}
