"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Film, Search } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { Input } from "@/components/design/ui/input";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import { orpc } from "@/utils/orpc";

export default function MaterialsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: materials, isLoading } = useQuery(
    orpc.listPublicMaterials.queryOptions({ input: { page: 1, pageSize: 50 } })
  );

  const filtered = (materials ?? []).filter((m: any) =>
    search ? m.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 gap-lg px-lg pt-16">
        <View className="flex-row items-center justify-between">
          <Text className="font-serif text-hero text-primary">Videos</Text>
        </View>

        <Input
          className="py-3 pr-4"
          inputContainerClassName="rounded-xl bg-background-elevated"
          leftIcon={
            <Search className="text-foreground-placeholder" size={18} />
          }
          onChangeText={setSearch}
          placeholder="Search videos..."
          value={search}
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="font-sans text-body text-foreground-muted">
              Loading...
            </Text>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            contentContainerClassName="gap-md pb-32"
            data={filtered}
            keyExtractor={(item: any) => item.id}
            ListEmptyComponent={
              <View className="items-center justify-center py-16">
                <Film className="text-foreground-muted" size={40} />
                <Text className="mt-3 font-sans text-body text-foreground-muted">
                  No videos available
                </Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => (
              <Pressable
                className="rounded-2xl border border-border p-md"
                onPress={() =>
                  router.push({
                    pathname: "/(patient)/materials/[materialId]",
                    params: { materialId: item.id },
                  })
                }
              >
                <View className="h-36 items-center justify-center rounded-xl bg-background-subtle">
                  <Film className="text-foreground-muted" size={32} />
                </View>
                <View className="mt-3 gap-1">
                  <Text
                    className="font-sans text-body text-primary"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {item.doctorName && (
                    <Text className="font-sans text-caption text-foreground-muted">
                      {item.doctorName}
                    </Text>
                  )}
                  {item.description && (
                    <Text
                      className="font-sans text-caption text-foreground-secondary"
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      <ScreenBottomBar
        returnAction={{
          href: "/(patient)",
          icon: <ArrowLeft className="text-foreground" size={24} />,
        }}
      />
    </View>
  );
}
