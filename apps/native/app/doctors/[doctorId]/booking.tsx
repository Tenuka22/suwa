import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Check, Clock, User } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";

function getBookingButtonText(
  isPending: boolean,
  credits: number,
  isAdmin: boolean
) {
  if (isPending) {
    return (
      <View className="flex-row items-center gap-2">
        <ActivityIndicator color="#09090b" size="small" />
        <Text className="font-bold font-sans text-base text-primary-foreground">
          Booking...
        </Text>
      </View>
    );
  }

  if (!isAdmin && credits < 1) {
    return (
      <Text className="font-bold font-sans text-base text-primary-foreground">
        Insufficient Credits
      </Text>
    );
  }

  if (isAdmin) {
    return (
      <Text className="font-bold font-sans text-base text-primary-foreground">
        Confirm Booking (Admin)
      </Text>
    );
  }

  return (
    <Text className="font-bold font-sans text-base text-primary-foreground">
      Confirm Booking (1 Credit)
    </Text>
  );
}

function PatientProfileForm({ onComplete }: { onComplete: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#fafafa" : "#09090b";
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!alias.trim()) {
      Alert.alert("Alias Required", "Please enter an alias to continue");
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.completeOnboarding.call({
        mode: "self",
        alias: alias.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onComplete();
    } catch (error) {
      Alert.alert(
        "Profile Creation Failed",
        error instanceof Error ? error.message : "Unable to create profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen contentClassName="gap-6 px-page py-page">
      <View className="gap-3">
        <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
          Create Profile
        </Text>
        <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
          Set up your patient profile to book sessions.
        </Text>
      </View>

      <Card className="gap-4">
        <View className="flex-row items-center gap-2">
          <User color={iconColor} size={16} />
          <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
            Patient Information
          </Text>
        </View>

        <View className="gap-3">
          <View className="gap-1">
            <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wide">
              Alias
            </Text>
            <TextInput
              className="rounded-lg border-2 border-border bg-background px-3 py-2 font-sans text-base text-foreground"
              onChangeText={setAlias}
              placeholder="Your anonymous alias"
              placeholderTextColor="#71717a"
              value={alias}
            />
          </View>

          <View className="gap-1">
            <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wide">
              Email (optional)
            </Text>
            <TextInput
              autoCapitalize="none"
              className="rounded-lg border-2 border-border bg-background px-3 py-2 font-sans text-base text-foreground"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor="#71717a"
              value={email}
            />
          </View>

          <View className="gap-1">
            <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wide">
              Phone (optional)
            </Text>
            <TextInput
              className="rounded-lg border-2 border-border bg-background px-3 py-2 font-sans text-base text-foreground"
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder="+1234567890"
              placeholderTextColor="#71717a"
              value={phone}
            />
          </View>
        </View>

        <Button
          disabled={isSubmitting}
          onPress={handleComplete}
          variant="primary"
        >
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#09090b" size="small" />
              <Text className="font-bold font-sans text-base text-primary-foreground">
                Creating...
              </Text>
            </View>
          ) : (
            <Text className="font-bold font-sans text-base text-primary-foreground">
              Create Profile
            </Text>
          )}
        </Button>
      </Card>
    </Screen>
  );
}

export default function BookingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#fafafa" : "#09090b";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { from, to } = useMemo(() => {
    const today = new Date();
    const from = today.toISOString();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const to = nextWeek.toISOString();
    return { from, to };
  }, []);

  const profileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      retry: 1,
    })
  );

  const slotsQuery = useQuery(
    orpc.getDoctorAvailableSlots.queryOptions({
      input: {
        doctorId: id ?? "",
        from,
        to,
      },
      enabled: !!id,
      retry: 1,
    })
  );

  const creditsQuery = useQuery(
    orpc.getUserCredits.queryOptions({
      retry: 1,
    })
  );

  const bookSessionMutation = useMutation({
    mutationFn: (input: { doctorId: string; scheduleEntryId: string }) =>
      orpc.bookSession.call(input),
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["doctor-slots"] });
        queryClient.invalidateQueries({ queryKey: ["patient-sessions"] });
        queryClient.invalidateQueries({ queryKey: ["user-credits"] });
        queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
      } catch (e) {
        console.error("Invalidation error:", e);
      }
      Alert.alert(
        "Booking Confirmed",
        "Your session has been booked successfully. This action cannot be undone.",
        [
          {
            text: "OK",
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            },
          },
        ]
      );
    },
    onError: (error: Error) => {
      Alert.alert(
        "Booking Failed",
        error.message || "Unable to book session"
      );
    },
  });

  const slots = slotsQuery.data?.slots ?? [];
  const credits = creditsQuery.data?.balance ?? 0;
  const isAdmin = creditsQuery.data?.isAdmin ?? false;
  const hasProfile = profileQuery.data?.isOnboardingComplete ?? false;

  const groupedSlots = slots.reduce<Record<string, typeof slots>>(
    (acc: Record<string, typeof slots>, slot) => {
      const date = new Date(slot.startAt);
      const dateKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(slot);
      return acc;
    },
    {}
  );

  const handleBookSession = () => {
    if (!selectedSlotId) {
      Alert.alert("Select a Time Slot", "Please select an available time slot");
      return;
    }

    Alert.alert(
      "Confirm Booking",
      "Once booked, this session cannot be cancelled or undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            bookSessionMutation.mutate({
              doctorId: id ?? "",
              scheduleEntryId: selectedSlotId,
            }),
        },
      ]
    );
  };

  if (!(hasProfile || isAdmin)) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <PatientProfileForm
          onComplete={() => {
            queryClient.invalidateQueries({
              queryKey: ["patient-profile"],
            });
          }}
        />
      </>
    );
  }

  const canBook = isAdmin || credits >= 1;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="flex-row items-center justify-between">
          <Button
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
            <View className="flex-row items-center gap-2">
              <ArrowLeft color={iconColor} size={16} />
              <Text className="font-bold font-sans text-foreground text-sm">
                Back
              </Text>
            </View>
          </Button>
        </View>

        <View className="gap-3">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            Book a Session
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Select an available time slot. Once booked, sessions cannot be
            cancelled.
          </Text>
        </View>

        <Card className="flex-row items-center justify-between gap-3 px-4 py-3">
          <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
            {isAdmin ? "Admin Access" : "Credits Available"}
          </Text>
          <View className="rounded-full bg-primary/10 px-3 py-1">
            <Text className="font-black font-sans text-lg text-primary">
              {isAdmin ? "∞" : credits}
            </Text>
          </View>
        </Card>

        {slots.length === 0 ? (
          <Card className="gap-3">
            <Calendar color={iconColor} size={24} />
            <Text className="font-bold font-sans text-base text-foreground">
              No available slots
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-sm">
              This doctor hasn't published any open time slots for the next 7
              days.
            </Text>
          </Card>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-4">
              {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                <Card className="gap-3" key={date}>
                  <View className="flex-row items-center gap-2">
                    <Calendar color={iconColor} size={16} />
                    <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
                      {date}
                    </Text>
                  </View>

                  <View className="gap-2">
                    {dateSlots.map((slot) => {
                      const startTime = new Date(slot.startAt);
                      const endTime = new Date(slot.endAt);
                      const timeLabel = `${startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
                      const isSelected = selectedSlotId === slot.id;

                      return (
                        <Card
                          className={`gap-2 ${isSelected ? "border-primary" : ""}`}
                          key={slot.id}
                          onPress={() => setSelectedSlotId(slot.id)}
                        >
                          <View className="flex-row items-center gap-2">
                            <Clock color={iconColor} size={14} />
                            <Text className="font-bold font-sans text-foreground text-sm">
                              {timeLabel}
                            </Text>
                          </View>

                          {isSelected && (
                            <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                              <Check color="#09090b" size={12} />
                              <Text className="font-bold text-[10px] text-primary uppercase tracking-wide">
                                Selected
                              </Text>
                            </View>
                          )}
                        </Card>
                      );
                    })}
                  </View>
                </Card>
              ))}

              <Button
                disabled={
                  !selectedSlotId || bookSessionMutation.isPending || !canBook
                }
                onPress={handleBookSession}
                variant="primary"
              >
                {getBookingButtonText(
                  bookSessionMutation.isPending,
                  credits,
                  isAdmin
                )}
              </Button>
            </View>
          </ScrollView>
        )}
      </Screen>
    </>
  );
}
