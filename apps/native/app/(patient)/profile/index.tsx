"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { BookOpen, Home, Key, MessageCircle, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/design/ui/button";
import {
  ErrorDialog,
  useErrorDialog,
} from "@/components/design/ui/error-dialog";
import { Input } from "@/components/design/ui/input";
import { ScreenTabBar } from "@/components/design/ui/screen-tab-bar";
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

export default function ProfileScreen() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
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

    if (data._securedData) {
      getStoredSecret().then(async (secret) => {
        if (!(secret && data._securedData)) {
          return;
        }

        const decrypted = await decryptData(data._securedData, secret);
        if (decrypted) {
          setEmail((decrypted.email as string) ?? "");
          setPhone((decrypted.phone as string) ?? "");
          setFullName((decrypted.fullName as string) ?? "");
          setAddress((decrypted.address as string) ?? "");
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
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getPatientProfile.key(),
        });
        showToast({
          type: "success",
          title: "Saved",
          message: "Profile updated successfully.",
        });
        vibrate([40, 20, 40]);
      },
      onError: (err) => handleError(err),
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
          type: "error",
          title: "No encryption key",
          message: "Generate an encryption key first.",
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

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator className="text-primary" size="large" />
      </View>
    );
  }

  const showPersonalFields =
    hasKey === true ||
    profileQuery.data === null ||
    !profileQuery.data?._securedData;

  return (
    <ScreenTabBar
      tabs={[
        {
          icon: <Home className="text-foreground" size={20} />,
          label: "Home",
          onPress: () => router.push("/(patient)"),
        },
        {
          icon: <MessageCircle className="text-foreground" size={20} />,
          label: "Doctors",
          onPress: () => router.push("/(patient)/doctors"),
        },
        {
          icon: <BookOpen className="text-foreground" size={20} />,
          label: "Health",
          onPress: () => router.push("/(patient)/health-hub"),
        },
        {
          active: true,
          icon: <User className="text-primary-foreground" size={20} />,
          label: "Profile",
          onPress: () => router.push("/(patient)/profile"),
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-8 px-8 pt-20">
            <View className="gap-6">
              <Text className="font-serif text-display text-foreground leading-none">
                Profile
              </Text>
              <View className="h-1 w-12 bg-accent" />
            </View>

            <View className="gap-4">
              <Input
                label="Alias"
                onChangeText={setAlias}
                placeholder="How should we call you?"
                value={alias}
              />

              {hasKey === false && (
                <View className="gap-4 rounded-xl border-2 border-accent bg-accent-subtle p-6">
                  <Text className="font-sans font-semibold text-accent text-subtitle">
                    Encryption Required
                  </Text>
                  <Text className="font-sans text-foreground text-sm leading-relaxed">
                    Generate a local key to secure your personal data.
                  </Text>
                  <Button onPress={handleGenerateKey} size="sm">
                    Generate Key
                  </Button>
                </View>
              )}

              {hasKey === true && (
                <View className="flex-row items-center gap-2 rounded-full bg-primary-subtle px-4 py-3">
                  <Key className="text-primary" size={14} />
                  <Text className="font-medium font-sans text-primary text-xs">
                    Privacy Shield Active
                  </Text>
                </View>
              )}

              {showPersonalFields && (
                <View className="gap-4">
                  <Input
                    autoCapitalize="none"
                    keyboardType="email-address"
                    label="Email"
                    onChangeText={setEmail}
                    value={email}
                  />
                  <Input
                    keyboardType="phone-pad"
                    label="Phone"
                    onChangeText={setPhone}
                    value={phone}
                  />
                  <Input
                    label="Full Name"
                    onChangeText={setFullName}
                    value={fullName}
                  />
                  <Input
                    label="Address"
                    onChangeText={setAddress}
                    value={address}
                  />
                </View>
              )}
            </View>

            <Button onPress={handleSave} size="lg">
              Save Profile
            </Button>
          </View>
        </ScrollView>
      </View>

      <ErrorDialog {...dialogProps} />
    </ScreenTabBar>
  );
}
