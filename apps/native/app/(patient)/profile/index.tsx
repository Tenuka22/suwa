import { useClerk } from "@clerk/expo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Shield, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { CreditPurchase } from "@/components/ui/credit-purchase";
import { ErrorDialog, useErrorDialog } from "@/components/ui/error-dialog";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { useToast } from "@/components/ui/toast";
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

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "navigator" in window) {
    const nav = window.navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    nav.vibrate?.(pattern);
  }
}

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
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [initialGuardianEmail, setInitialGuardianEmail] = useState("");
  const [initialGuardianPhone, setInitialGuardianPhone] = useState("");

  const { signOut } = useClerk();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { showError, dialogProps } = useErrorDialog();

  const profileQuery = useQuery(orpc.getPatientProfile.queryOptions());

  useEffect(() => {
    const data = profileQuery.data;
    if (!data) {
      return;
    }

    setAlias(data.alias ?? "");
    setInitialAlias(data.alias ?? "");
    setGuardianEmail(data.guardianEmail ?? "");
    setGuardianPhone(data.guardianPhone ?? "");
    setInitialGuardianEmail(data.guardianEmail ?? "");
    setInitialGuardianPhone(data.guardianPhone ?? "");

    if (data._securedData) {
      getStoredSecret().then(async (secret) => {
        if (!secret) {
          setCorruptedData(true);
          return;
        }

        const decrypted = await decryptData(data._securedData!, secret);

        if (decrypted) {
          const decryptedEmail = (decrypted.email as string) ?? "";
          const decryptedPhone = (decrypted.phone as string) ?? "";
          const decryptedFullName = (decrypted.fullName as string) ?? "";
          const decryptedAddress = (decrypted.address as string) ?? "";
          setEmail(decryptedEmail);
          setPhone(decryptedPhone);
          setFullName(decryptedFullName);
          setAddress(decryptedAddress);
          setInitialEmail(decryptedEmail);
          setInitialPhone(decryptedPhone);
          setInitialFullName(decryptedFullName);
          setInitialAddress(decryptedAddress);
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

  const handleSave = async () => {
    try {
      let secret = await getStoredSecret();
      if (!secret) {
        secret = generateUserSecret();
        await storeSecret(secret);
      }

      const _securedData = await encryptData(
        { email, phone, fullName, address },
        secret
      );

      const guardianChanged =
        guardianEmail !== initialGuardianEmail ||
        guardianPhone !== initialGuardianPhone;

      updateMutation.mutate({
        alias: alias || undefined,
        _securedData,
        ...(guardianChanged
          ? {
              guardianEmail: guardianEmail || null,
              guardianPhone: guardianPhone || null,
            }
          : {}),
      });
    } catch (err) {
      handleError(err);
    }
  };

  const handleFindGuardian = () => {
    updateMutation.mutate({
      guardianEmail: guardianEmail || undefined,
      guardianPhone: guardianPhone || undefined,
    });
  };

  const handleRemoveGuardian = () => {
    updateMutation.mutate({
      guardianEmail: null,
      guardianPhone: null,
    });
  };

  const handleRecreateSecret = async () => {
    setCorruptedData(false);
    const secret = generateUserSecret();
    await storeSecret(secret);

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
    address !== initialAddress ||
    guardianEmail !== initialGuardianEmail ||
    guardianPhone !== initialGuardianPhone;

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
            <Field
              label="Display Name"
              onChangeText={(text) => {
                setAlias(text);
              }}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={alias}
            />

            {corruptedData && (
              <View className="gap-3 rounded-lg border-2 border-destructive bg-destructive/10 p-4">
                <Text className="font-bold font-sans text-destructive text-sm">
                  Your encrypted data could not be decrypted
                </Text>
                <Text className="font-normal font-sans text-destructive/80 text-xs">
                  This can happen if your device secret was lost or changed.
                  Please re-enter your information below to create a new secret.
                </Text>
                <Button onPress={handleRecreateSecret} variant="secondary">
                  Generate new secret & re-enter data
                </Button>
              </View>
            )}

            <Field
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

            <Field
              keyboardType="phone-pad"
              label="Phone"
              onChangeText={(text) => {
                setPhone(text);
              }}
              placeholder="Phone number"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
            />

            <Field
              label="Full Name"
              onChangeText={(text) => {
                setFullName(text);
              }}
              placeholder="Your full name"
              placeholderTextColor={colors.mutedForeground}
              value={fullName}
            />

            <Field
              label="Address"
              onChangeText={(text) => {
                setAddress(text);
              }}
              placeholder="Your address"
              placeholderTextColor={colors.mutedForeground}
              value={address}
            />

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
          <View className="items-center gap-2 border-border border-b-2 px-card py-4">
            <Shield color={colors.primary} size={22} />
            <Text className="font-black font-sans text-foreground text-lg tracking-tight">
              Guardian
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            {profileQuery.data?.guardianUserId ? (
              <View className="gap-2 rounded-lg bg-muted p-4">
                <Text className="font-bold font-sans text-foreground text-sm">
                  Guardian assigned
                </Text>
                <Text className="font-normal font-sans text-muted-foreground text-xs">
                  {profileQuery.data.guardianEmail}
                </Text>
                <Button
                  className="mt-2"
                  disabled={updateMutation.isPending}
                  onPress={handleRemoveGuardian}
                  variant="secondary"
                >
                  Remove guardian
                </Button>
              </View>
            ) : (
              <>
                <Field
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Guardian Email"
                  onChangeText={setGuardianEmail}
                  placeholder="guardian@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={guardianEmail}
                />
                <Field
                  keyboardType="phone-pad"
                  label="Guardian Phone"
                  onChangeText={setGuardianPhone}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={colors.mutedForeground}
                  value={guardianPhone}
                />
                <Button
                  disabled={
                    updateMutation.isPending ||
                    !(guardianEmail || guardianPhone)
                  }
                  onPress={handleFindGuardian}
                  variant="secondary"
                >
                  Find guardian
                </Button>
              </>
            )}
          </View>
        </View>

        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="border-border border-b-2 px-card py-4">
            <Text className="font-black font-sans text-foreground text-lg tracking-tight">
              Credits
            </Text>
          </View>
          <View className="px-card py-card">
            <CreditPurchase />
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
              disabled={!changed || updateMutation.isPending}
              onPress={handleSave}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </View>
          <Pressable
            className="aspect-square h-12 items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
            onPress={handleBack}
          >
            <ArrowLeft color="#ffffff" size={16} />
          </Pressable>
        </View>
      </ScreenBottomBar>
      <ErrorDialog {...dialogProps} />
    </>
  );
}
