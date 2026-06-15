"use client";

import { useClerk } from "@clerk/expo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Key, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { ErrorDialog, useErrorDialog } from "@/components/ui/error-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { useToast } from "@/components/ui/toast";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import {
  decryptData,
  encryptData,
  generateUserSecret,
  getStoredSecret,
  storeSecret,
} from "@/utils/privacy";
import { useThemeColor } from "@/utils/theme";
import { useErrorHandler } from "@/utils/use-error-handler";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColor();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [corruptedData, setCorruptedData] = useState(false);
  const [initialAlias, setInitialAlias] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [initialAddress, setInitialAddress] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const { signOut } = useClerk();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { showError, dialogProps } = useErrorDialog();

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

    if (data._securedData) {
      getStoredSecret().then(async (secret) => {
        if (!secret) {
          setCorruptedData(true);
          return;
        }

        const decrypted = await decryptData(data._securedData!, secret);

        if (decrypted) {
          setEmail((decrypted.email as string) ?? "");
          setPhone((decrypted.phone as string) ?? "");
          setFullName((decrypted.fullName as string) ?? "");
          setAddress((decrypted.address as string) ?? "");
          setInitialEmail((decrypted.email as string) ?? "");
          setInitialPhone((decrypted.phone as string) ?? "");
          setInitialFullName((decrypted.fullName as string) ?? "");
          setInitialAddress((decrypted.address as string) ?? "");
          setCorruptedData(false);
        } else {
          setCorruptedData(true);
        }
      });
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation(
    orpc.updatePatientProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getPatientProfile.key(),
        });
        toast({
          type: "success",
          title: "Saved",
          message: "Profile updated successfully.",
        });
        vibrate([40, 20, 40]);
      },
      onError: (err) => handleError(err),
    })
  );

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const noProfile = profileQuery.data === null;
  const hasNoEncryptedData =
    profileQuery.data && !profileQuery.data._securedData;

  const handleGenerateKey = async () => {
    const secret = generateUserSecret();
    await storeSecret(secret);
    setHasKey(true);
  };

  const handleSave = async () => {
    try {
      const secret = await getStoredSecret();
      if (!secret) {
        toast({
          type: "error",
          title: "No encryption key",
          message:
            "Generate an encryption key first before saving personal information.",
        });
        return;
      }

      const _securedData = await encryptData(
        { email, phone, fullName, address },
        secret
      );

      updateMutation.mutate({
        alias: alias || undefined,
        _securedData,
      });
    } catch (err) {
      handleError(err);
    }
  };

  const handleRecreateSecret = async () => {
    setCorruptedData(false);
    const secret = generateUserSecret();
    await storeSecret(secret);
    setHasKey(true);

    if (profileQuery.data?._securedData) {
      const decrypted = await decryptData(
        profileQuery.data._securedData,
        secret
      );

      if (decrypted) {
        setEmail((decrypted.email as string) ?? "");
        setPhone((decrypted.phone as string) ?? "");
        setFullName((decrypted.fullName as string) ?? "");
        setAddress((decrypted.address as string) ?? "");
      }
    }
  };

  const handleBack = () => {
    vibrate(15);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const changed =
    alias !== initialAlias ||
    email !== initialEmail ||
    phone !== initialPhone ||
    fullName !== initialFullName ||
    address !== initialAddress;

  const showPersonalFields = hasKey === true || hasNoEncryptedData || noProfile;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page pb-24">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="items-center gap-2 border-border border-b-2 px-card py-6">
            <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted">
              <User color={colors.mutedForeground} size={28} />
            </View>
            <Text className="font-black font-sans text-2xl text-foreground tracking-tight">
              Profile
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            <Input
              label="Display Name"
              onChangeText={(text) => {
                setAlias(text);
              }}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={alias}
            />

            {noProfile && (
              <View className="gap-3 rounded-lg border-2 border-amber-500 bg-amber-500/10 p-4">
                <Text className="font-bold font-sans text-amber-600 text-sm">
                  Profile not found
                </Text>
                <Text className="font-normal font-sans text-amber-600/80 text-xs">
                  You don't have a profile entry yet. Please enter your details
                  and save to create one.
                </Text>
              </View>
            )}

            {hasNoEncryptedData && !noProfile && (
              <View className="gap-3 rounded-lg border-2 border-primary bg-primary/10 p-4">
                <Text className="font-bold font-sans text-primary text-sm">
                  Encrypted data missing
                </Text>
                <Text className="font-normal font-sans text-primary/80 text-xs">
                  Your profile exists, but your personal information (Email,
                  Phone, etc.) hasn't been encrypted and stored yet. Please fill
                  them in and save.
                </Text>
              </View>
            )}

            {corruptedData && !noProfile && (
              <View className="gap-3 rounded-lg border-2 border-destructive bg-destructive/10 p-4">
                <Text className="font-bold font-sans text-destructive text-sm">
                  Decryption failed
                </Text>
                <Text className="font-normal font-sans text-destructive/80 text-xs">
                  Your encrypted data could not be decrypted with your device's
                  current secret. This happens if the secret was lost. Please
                  re-enter your information.
                </Text>
              </View>
            )}

            {hasKey === false && (
              <View className="gap-3 rounded-lg border-2 border-primary bg-primary/10 p-4">
                <Text className="font-bold font-sans text-primary text-sm">
                  Encryption Key Required
                </Text>
                <Text className="font-normal font-sans text-primary/80 text-xs">
                  Generate a local encryption key to secure your personal
                  information before entering it.
                </Text>
                <Button onPress={handleGenerateKey} variant="primary">
                  Generate Encryption Key
                </Button>
              </View>
            )}

            {hasKey === true && (
              <View className="flex-row items-center gap-2 rounded-lg bg-success/10 px-4 py-3">
                <Key color="#22c55e" size={14} />
                <Text className="font-medium font-sans text-success text-xs">
                  Encryption key configured
                </Text>
              </View>
            )}

            {showPersonalFields && (
              <>
                <Input
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={(text) => {
                    setEmail(text);
                  }}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                />

                <Input
                  keyboardType="phone-pad"
                  label="Phone"
                  onChangeText={(text) => {
                    setPhone(text);
                  }}
                  placeholder="Phone number"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                />

                <Input
                  label="Full Name"
                  onChangeText={(text) => {
                    setFullName(text);
                  }}
                  placeholder="Your full name"
                  placeholderTextColor={colors.mutedForeground}
                  value={fullName}
                />

                <Input
                  label="Address"
                  onChangeText={(text) => {
                    setAddress(text);
                  }}
                  placeholder="Your address"
                  placeholderTextColor={colors.mutedForeground}
                  value={address}
                />
              </>
            )}

            {updateMutation.isSuccess && (
              <Text className="font-bold font-sans text-sm text-success">
                Profile updated successfully!
              </Text>
            )}

            {updateMutation.isError && (
              <Text className="font-bold font-sans text-destructive text-sm">
                Failed to update profile. Please try again.
              </Text>
            )}
          </View>
        </View>

        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="flex-row items-center gap-3 border-border border-b-2 px-card py-4">
            <Calendar color={colors.primary} size={20} />
            <Text className="font-black font-sans text-foreground text-lg tracking-tight">
              Appointments
            </Text>
          </View>
          <View className="px-card py-card">
            <Text className="font-medium font-sans text-muted-foreground text-sm leading-relaxed">
              View and manage your booked therapy sessions.
            </Text>
            <View className="mt-4">
              <Button
                className="w-full"
                href="/appointments"
                icon={<Calendar color="#ffffff" size={16} />}
              >
                My Appointments
              </Button>
            </View>
          </View>
        </View>

        <View className="overflow-hidden rounded-card border-2 border-destructive/30 bg-card">
          <View className="px-card py-card">
            <Button
              className="flex-row items-center justify-center gap-2"
              onPress={() =>
                showError("Sign Out", "Are you sure you want to sign out?", [
                  { label: "Cancel", variant: "secondary", onPress: () => {} },
                  { label: "Sign Out", onPress: () => signOut() },
                ])
              }
              variant="secondary"
            >
              <Text className="font-bold font-sans text-destructive text-sm">
                Sign Out
              </Text>
            </Button>
          </View>
        </View>
      </Screen>
      <ScreenBottomBar>
        <View className="flex-1 flex-row items-center gap-2">
          <View className="flex-1">
            <Button
              disabled={
                !changed || updateMutation.isPending || hasKey === false
              }
              onPress={handleSave}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </View>
          <IconButton icon={ArrowLeft} iconSize={16} onPress={handleBack} />
        </View>
      </ScreenBottomBar>
      <ErrorDialog {...dialogProps} />
    </>
  );
}
