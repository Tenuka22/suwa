"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Key, ShieldCheck, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { PatientTabScaffold } from "@/components/design/patient-tab-scaffold";
import { Button } from "@/components/design/ui/button";
import {
  ErrorDialog,
  useErrorDialog,
} from "@/components/design/ui/error-dialog";
import { Input } from "@/components/design/ui/input";
import { Skeleton } from "@/components/design/ui/skeleton";
import { ToggleGroup } from "@/components/design/ui/toggle-group";
import { showToast } from "@/components/design/ui/toast";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import {
  decryptData,
  encryptData,
  generateUserSecret,
  getStoredSecret,
  storeSecret,
} from "@/utils/privacy";
import { useErrorHandler } from "@/utils/use-error-handler";

type AgeCategory = "adult" | "child" | "teen" | "senior";
type Profession =
  | "other"
  | "student"
  | "teacher"
  | "employed"
  | "self_employed"
  | "unemployed"
  | "retired"
  | "healthcare_worker";

const ageCategoryItems: { label: string; value: AgeCategory }[] = [
  { label: "Children", value: "child" },
  { label: "Teenagers", value: "teen" },
  { label: "Adults", value: "adult" },
  { label: "Seniors", value: "senior" },
];

const professionItems: { label: string; value: Profession }[] = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "Employed", value: "employed" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Retired", value: "retired" },
  { label: "Healthcare", value: "healthcare_worker" },
  { label: "Other", value: "other" },
];

export default function ProfileScreen() {
  const [alias, setAlias] = useState("");
  const [ageCategory, setAgeCategory] = useState<AgeCategory>("adult");
  const [profession, setProfession] = useState<Profession>("other");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [_initialAlias, setInitialAlias] = useState("");
  const [_initialEmail, setInitialEmail] = useState("");
  const [_initialPhone, setInitialPhone] = useState("");
  const [_initialFullName, setInitialFullName] = useState("");
  const [_initialAddress, setInitialAddress] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const { handleError } = useErrorHandler();
  const { dialogProps } = useErrorDialog();
  const profileQuery = useQuery(orpc.getPatientProfile.queryOptions());

  useEffect(() => {
    getStoredSecret().then((secret) => {
      setHasKey(secret !== null);
    });
  }, []);

  useEffect(() => {
    const data = profileQuery.data;
    if (!data) {
      return;
    }

    setAlias(data.alias ?? "");
    setInitialAlias(data.alias ?? "");
    setAgeCategory((data.ageCategory as AgeCategory | undefined) ?? "adult");
    setProfession((data.profession as Profession | undefined) ?? "other");

    if (data._securedData) {
      getStoredSecret().then(async (secret) => {
        if (!(secret && data._securedData)) {
          return;
        }

        const decrypted = await decryptData(data._securedData, secret);
        if (decrypted) {
          setAgeCategory((decrypted.ageCategory as AgeCategory | undefined) ?? "adult");
          setProfession((decrypted.profession as Profession | undefined) ?? "other");
          setEmail((decrypted.email as string) ?? "");
          setPhone((decrypted.phone as string) ?? "");
          setFullName((decrypted.fullName as string) ?? "");
          setAddress((decrypted.address as string) ?? "");
          setInitialAlias(data.alias ?? "");
          setInitialEmail((decrypted.email as string) ?? "");
          setInitialPhone((decrypted.phone as string) ?? "");
          setInitialFullName((decrypted.fullName as string) ?? "");
          setInitialAddress((decrypted.address as string) ?? "");
        }
      });
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation(
    orpc.updatePatientProfile.mutationOptions({
      onError: (error) => handleError(error),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getPatientProfile.key(),
        });
        showToast({
          message: "Profile updated successfully.",
          title: "Saved",
          type: "success",
        });
        vibrate([40, 20, 40]);
      },
    })
  );

  const handleGenerateKey = async () => {
    const secret = generateUserSecret();
    await storeSecret(secret);
    setHasKey(true);
  };

  const handleSave = async () => {
    try {
      const secret = await getStoredSecret();
      if (!secret) {
        showToast({
          message: "Generate an encryption key first.",
          title: "No encryption key",
          type: "error",
        });
        return;
      }

      const _securedData = await encryptData(
        { address, ageCategory, email, fullName, phone, profession },
        secret
      );
      updateMutation.mutate({
        _securedData,
        alias: alias || undefined,
      });
    } catch (error) {
      handleError(error);
    }
  };

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 gap-xl bg-background px-lg pt-14">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </View>
    );
  }

  const showPersonalFields =
    hasKey === true ||
    profileQuery.data === null ||
    !profileQuery.data?._securedData;

  return (
    <PatientTabScaffold activeTab="profile">
      <Stack.Screen options={{ animation: "fade", headerShown: false }} />
      <View className="flex-1 gap-xxl bg-background px-lg pt-12 pb-xl">
        <View className="relative overflow-hidden rounded-[32px] bg-primary px-xl py-xxl">
          <View className="absolute -top-10 -right-8 h-36 w-36 rounded-full bg-accent/25" />
          <View className="gap-md">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <UserRound color="#fbf7f0" size={22} />
            </View>
            <View>
              <Text className="font-serif text-[34px] text-primary-foreground leading-tight">
                Your profile
              </Text>
              <Text className="mt-xs font-sans text-caption text-primary-foreground/70 leading-relaxed">
                Choose what Suwa knows. Your personal details stay protected.
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-lg">
          <View className="flex-row items-center gap-sm">
            <ShieldCheck color="#315b4d" size={19} />
            <Text className="font-serif text-[24px] text-foreground">
              Identity and privacy
            </Text>
          </View>
          <Input
            label="Alias"
            onChangeText={setAlias}
            placeholder="How should we call you?"
            value={alias}
          />
          <View className="gap-sm">
            <Text className="font-poppins-medium text-caption text-foreground">
              Age category
            </Text>
            <ToggleGroup
              items={ageCategoryItems}
              onValueChange={setAgeCategory}
              value={ageCategory}
            />
          </View>
          <View className="gap-sm">
            <Text className="font-poppins-medium text-caption text-foreground">
              Profession
            </Text>
            <ToggleGroup
              items={professionItems}
              onValueChange={setProfession}
              value={profession}
            />
          </View>

          {hasKey === false ? (
            <View className="gap-md rounded-3xl bg-accent-subtle p-lg">
              <Text className="font-poppins-medium text-accent text-subtitle">
                Turn on your privacy shield
              </Text>
              <Text className="font-sans text-foreground text-sm leading-relaxed">
                Generate a secure local key before saving personal details.
              </Text>
              <Button onPress={handleGenerateKey} size="sm">
                Generate key
              </Button>
            </View>
          ) : null}

          {hasKey === true ? (
            <View className="flex-row items-center gap-md rounded-2xl bg-primary-subtle px-lg py-md">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-background-elevated">
                <Key color="#315b4d" size={16} />
              </View>
              <View className="flex-1">
                <Text className="font-poppins-medium text-caption text-primary">
                  Privacy shield active
                </Text>
                <Text className="font-sans text-micro text-primary/70">
                  Personal details are encrypted locally
                </Text>
              </View>
            </View>
          ) : null}

          {showPersonalFields ? (
            <View className="gap-lg">
              <Input
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                optional
                value={email}
              />
              <Input
                keyboardType="phone-pad"
                label="Phone"
                onChangeText={setPhone}
                optional
                value={phone}
              />
              <Input
                label="Full name"
                onChangeText={setFullName}
                optional
                value={fullName}
              />
              <Input
                label="Address"
                onChangeText={setAddress}
                optional
                value={address}
              />
            </View>
          ) : null}
        </View>

        <Button
          disabled={updateMutation.isPending}
          onPress={handleSave}
          size="lg"
        >
          {updateMutation.isPending ? "Saving..." : "Save profile"}
        </Button>
      </View>
      <ErrorDialog {...dialogProps} />
    </PatientTabScaffold>
  );
}
