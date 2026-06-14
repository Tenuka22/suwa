'use client';

import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  MapPin,
  Play,
  Sparkles,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";

import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";
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
          className="flex-row items-center gap-2 rounded-card border-[3px] border-border bg-muted px-3 py-2.5"
          key={i}
        >
          <Text className="min-w-[40px] font-black font-sans text-foreground text-xs uppercase tracking-tight">
            {DAY_NAMES[slot.dayOfWeek]}
          </Text>
          <Clock color={colors.foreground} size={12} strokeWidth={2.5} />
          <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
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
    <View className="relative" style={{ overflow: "visible" }}>
      <View
        className="absolute inset-0 rounded-card bg-border"
        style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
      />
      <View className="gap-4 rounded-card border-[3px] border-border bg-card p-card">
        <View className="flex-row items-center gap-2">
          <Sparkles color="#000" size={16} strokeWidth={2.5} />
          <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
            Select Plan
          </Text>
        </View>
        <View className="gap-2">
          {plans.map((plan) => (
            <Pressable
              className={`rounded-card border-[3px] p-3 ${
                plan.id === selectedPlanId
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
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
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function IntroVideoPreview({
  fileId,
  onPress,
}: {
  fileId: string;
  onPress: () => void;
}) {
  const previewUrl = useDoctorMaterialPreviewUrl(fileId);
  const colors = useThemeColor();

  return (
    <Pressable onPress={onPress}>
      <View className="h-24 w-40 overflow-hidden rounded-card border-[3px] border-border bg-muted">
        {previewUrl ? (
          <View className="h-full w-full">
            <Image
              className="h-full w-full"
              source={{ uri: previewUrl }}
              style={{ resizeMode: "cover" }}
            />
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/90">
                <Play
                  color={colors.foreground}
                  fill={colors.foreground}
                  size={18}
                  strokeWidth={2.5}
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Play color={colors.mutedForeground} size={24} strokeWidth={2} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function VideoModal({
  fileId,
  onClose,
}: {
  fileId: string | null;
  onClose: () => void;
}) {
  const previewUrl = useDoctorMaterialPreviewUrl(fileId);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={fileId !== null}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/80"
        onPress={onClose}
      >
        <Pressable className="w-full max-w-lg px-6">
          <View className="overflow-hidden rounded-2xl border-2 border-white/20 bg-muted">
            {previewUrl ? (
              <View>
                <Image
                  className="h-80 w-full"
                  source={{ uri: previewUrl }}
                  style={{ resizeMode: "contain" }}
                />
                <View className="absolute inset-0 items-center justify-center">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-white/90">
                    <Play
                      color="#000"
                      fill="#000"
                      size={28}
                      strokeWidth={2.5}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="h-80 w-full items-center justify-center">
                <ActivityIndicator size="large" />
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function BookingScreen() {
  const colors = useThemeColor();
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
    "select" | "processing" | "error" | "done"
  >("select");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoFileId, setVideoFileId] = useState<string | null>(null);

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

  const availabilityQuery = useQuery(
    orpc.getDoctorWeeklyAvailability.queryOptions({
      input: { doctorId: id ?? "" },
      enabled: !!id,
    })
  );

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

  const plans = plansQuery.data?.plans ?? [];

  const selectedPlan = plans.find(
    (p: { id: string; durationMinutes: number }) => p.id === selectedPlanId
  );

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
  const doctor = doctorQuery.data?.profile;
  const files = doctorQuery.data?.files ?? [];
  const availability = (availabilityQuery.data?.slots ?? []) as Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;

  const introVideoFile = files.find((f) => f.fileKind === "intro_video");
  const portraitId = doctorQuery.data?.portrait?.id ?? null;

  const bookMutation = useMutation(
    orpc.bookSession.mutationOptions({
      onSuccess: async () => {
        setBookingStep("done");
        setTimeout(() => {
          router.replace("/appointments?bookingSuccess=true");
        }, 1500);
      },
      onError: (err: Error) => {
        handleError(err);
        setErrorMessage(err.message);
        setBookingStep("error");
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

  if (bookingStep === "error") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center px-page py-page">
          <View className="relative" style={{ overflow: "visible" }}>
            <View
              className="absolute inset-0 rounded-card bg-border"
              style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
            />
            <View className="items-center gap-6 overflow-hidden rounded-card border-[3px] border-border bg-card px-8 py-12">
              <View className="absolute -top-6 -right-6 h-16 w-16 rotate-12 border-[5px] border-destructive/20" />
              <View className="rounded-full border-2 border-destructive/30 bg-destructive/20 p-4">
                <X color={colors.destructive} size={32} />
              </View>
              <Text className="text-center font-black font-sans text-2xl text-foreground uppercase tracking-tight">
                Booking Failed
              </Text>
              <Text className="max-w-[280px] text-center font-medium font-sans text-muted-foreground text-sm leading-relaxed">
                {errorMessage ??
                  "An unexpected error occurred. Please try again."}
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
            </View>
          </View>
        </Screen>
      </>
    );
  }

  if (bookingStep === "done") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center px-page py-page">
          <View className="relative" style={{ overflow: "visible" }}>
            <View
              className="absolute inset-0 rounded-card bg-border"
              style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
            />
            <View className="items-center gap-6 overflow-hidden rounded-card border-[3px] border-border bg-card px-8 py-12">
              <View className="absolute -top-6 -right-6 h-16 w-16 rotate-12 border-[5px] border-emerald-500/20" />
              <View className="rounded-full border-2 border-emerald-500/30 bg-emerald-500/20 p-4">
                <Check color={colors.success} size={32} />
              </View>
              <Text className="text-center font-black font-sans text-2xl text-foreground uppercase tracking-tight">
                Request Sent!
              </Text>
              <Text className="max-w-[280px] text-center font-medium font-sans text-muted-foreground text-sm leading-relaxed">
                Your session request has been sent. The doctor will review and
                respond shortly.
              </Text>
              <ActivityIndicator size="small" />
            </View>
          </View>
        </Screen>
      </>
    );
  }

  const isLoading =
    plansQuery.isLoading ||
    slotsQuery.isLoading ||
    doctorQuery.isLoading ||
    availabilityQuery.isLoading;

  const canBook =
    !!(selectedSlot && selectedPlanId) && bookingStep !== "processing";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page pb-28">
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <View className="relative" style={{ overflow: "visible" }}>
              <View
                className="absolute inset-0 rounded-card bg-border"
                style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
              />
              <View className="items-center gap-4 rounded-card border-[3px] border-border bg-card px-8 py-10">
                <ActivityIndicator color={colors.primary} size="large" />
                <Text className="font-black font-sans text-muted-foreground text-xs uppercase tracking-widest">
                  Loading booking details...
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-8">
              {doctor && (
                <View className="relative" style={{ overflow: "visible" }}>
                  <View
                    className="absolute inset-0 rounded-card bg-border"
                    style={{
                      transform: [{ translateX: 6 }, { translateY: 6 }],
                    }}
                  />
                  <View className="gap-4 rounded-card border-[3px] border-border bg-card p-card">
                    <View className="flex-row items-start gap-4">
                      <View className="h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-secondary">
                        <Text className="font-black font-sans text-foreground text-lg">
                          {getInitials(doctor.displayName ?? "Dr")}
                        </Text>
                      </View>
                      <View className="flex-1 gap-0.5">
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
                        <Text className="mt-1 font-medium font-sans text-foreground text-sm leading-relaxed">
                          {doctor.headline ?? "Licensed medical practitioner."}
                        </Text>
                      </View>
                      {introVideoFile && (
                        <IntroVideoPreview
                          fileId={introVideoFile.id}
                          onPress={() => setVideoFileId(introVideoFile.id)}
                        />
                      )}
                    </View>
                  </View>
                </View>
              )}

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

              <View className="relative" style={{ overflow: "visible" }}>
                <View
                  className="absolute inset-0 rounded-card bg-border"
                  style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                />
                <View className="gap-4 rounded-card border-[3px] border-border bg-card p-card">
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
                      const isToday =
                        day.toDateString() === today.toDateString();
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
                </View>
              </View>

              {selectedPlanId && selectedDate && (
                <View className="relative" style={{ overflow: "visible" }}>
                  <View
                    className="absolute inset-0 rounded-card bg-border"
                    style={{
                      transform: [{ translateX: 6 }, { translateY: 6 }],
                    }}
                  />
                  <View className="gap-4 rounded-card border-[3px] border-border bg-card p-card">
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
                  </View>
                </View>
              )}

              {selectedPlanId && selectedDate && slots.length > 0 && (
                <View className="relative" style={{ overflow: "visible" }}>
                  <View
                    className="absolute inset-0 rounded-card bg-border"
                    style={{
                      transform: [{ translateX: 6 }, { translateY: 6 }],
                    }}
                  />
                  <View className="gap-4 rounded-card border-[3px] border-border bg-card p-card">
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
                        const isSelected =
                          selectedSlot?.startAt === slot.startAt;
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
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </Screen>

      <VideoModal fileId={videoFileId} onClose={() => setVideoFileId(null)} />

      <ScreenBottomBar>
        <View className="flex-1 items-center justify-center px-2">
          {selectedPlanId && selectedSlot ? (
            <Text
              className="text-center font-bold font-sans text-foreground text-xs uppercase tracking-wider"
              numberOfLines={1}
            >
              {formatTime(new Date(selectedSlot.startAt))} -{" "}
              {formatTime(new Date(selectedSlot.endAt))}
            </Text>
          ) : selectedPlanId ? (
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Select a date & time
            </Text>
          ) : (
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              Select a plan to continue
            </Text>
          )}
        </View>

        <Button className="flex-1" disabled={!canBook} onPress={handleBook}>
          {bookingStep === "processing" ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            "REQUEST APPOINTMENT"
          )}
        </Button>

        <IconButton
          icon={ArrowLeft}
          iconSize={20}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/doctors");
            }
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
