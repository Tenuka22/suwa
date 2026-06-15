"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, ShoppingBag, Moon, Apple, Pizza, Cake, Coffee, Droplet, GlassWater, Zap, ChevronRight } from "lucide-react-native";
import { ScrollView, Text, View, Pressable } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playBuySound, playErrorSound } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const SHOP_ITEMS = [
  { id: "apple", name: "Crisp Apple", cost: 50, icon: Apple, type: "food" },
  { id: "pizza", name: "Sprite Pizza", cost: 120, icon: Pizza, type: "food" },
  { id: "cake", name: "Birthday Cake", cost: 250, icon: Cake, type: "food" },
  { id: "water", name: "Pure Water", cost: 20, icon: GlassWater, type: "drink" },
  { id: "coffee", name: "Energy Brew", cost: 80, icon: Coffee, type: "drink" },
  { id: "milk", name: "Night Milk", cost: 100, icon: Droplet, type: "drink" },
];

export default function SpriteShopScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  
  const creditsQuery = useQuery(
    orpc.getMoonlightCredits.queryOptions({ queryKey: ["getMoonlightCredits"] })
  );
  
  const buyMutation = useMutation(
    orpc.buyItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getMoonlightCredits.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getInventory.key() });
        vibrate(30);
        playBuySound();
      },
      onError: (err: Error) => {
        playErrorSound();
        alert(err.message);
      }
    })
  );

  const credits = creditsQuery.data?.balance ?? 0;

  const handleBuy = (item: typeof SHOP_ITEMS[0]) => {
    if (credits < item.cost) {
      vibrate([10, 50, 10]);
      playErrorSound();
      return;
    }
    vibrate(20);
    buyMutation.mutate({ itemId: item.id, cost: item.cost });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-8 px-page py-12 pb-32"
        >
          {/* Header */}
          <View className="items-center gap-2">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-sm shadow-primary/20">
               <ShoppingBag color={colors.primary} size={32} />
            </View>
            <Text className="font-black font-sans text-4xl text-foreground text-center">
              Sprite Shop
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[250px]">
              Spend your hard-earned credits on treats for your Sprite.
            </Text>
          </View>

          {/* Credits Display */}
          <View className="bg-card border-2 border-border rounded-card p-5 flex-row items-center justify-between shadow-sm">
             <View className="flex-row items-center gap-2">
                <Moon color={colors.warning} size={24} />
                <Text className="font-black font-sans text-foreground text-xl">Your Balance</Text>
             </View>
             <Text className="font-black font-sans text-primary text-2xl">{credits}</Text>
          </View>

          {/* Items Grid */}
          <View className="flex-row flex-wrap gap-4 justify-between">
            {SHOP_ITEMS.map((item) => {
              const canAfford = credits >= item.cost;
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleBuy(item)}
                  disabled={buyMutation.isPending}
                  style={{ width: '47%' }}
                  className={`rounded-card border-2 p-5 gap-3 bg-card shadow-sm ${
                    !canAfford ? "opacity-50 border-border" : "border-primary/20 active:bg-primary/5"
                  }`}
                >
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                     <Icon color={colors.primary} size={28} />
                  </View>
                  <View className="gap-0.5">
                    <Text className="font-black font-sans text-foreground text-sm leading-tight">
                      {item.name}
                    </Text>
                    <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase">
                      {item.type}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 mt-2 bg-warning/10 px-3 py-1.5 rounded-full self-start">
                     <Moon color={colors.warning} size={12} />
                     <Text className="font-black font-sans text-warning text-xs">{item.cost}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Screen>

      <ScreenBottomBar>
        <View className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-background px-3 py-2">
          <Moon color={colors.warning} size={18} />
          <View>
            <Text className="font-black font-sans text-foreground text-sm leading-none">
              {credits}
            </Text>
            <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase tracking-tighter">
              Credits
            </Text>
          </View>
        </View>
        <Button
          className="h-12 flex-1 shadow-lg shadow-primary/20"
          href="/sprite/actions"
          icon={<ChevronRight color="#ffffff" size={16} />}
          variant="primary"
        >
          Daily Missions
        </Button>
        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            vibrate(15);
            router.back();
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
