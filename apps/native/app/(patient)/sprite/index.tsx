"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Droplet,
  Flame,
  Heart,
  Medal,
  Moon,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wind,
  Zap,
  Coffee,
  Cookie,
  Apple,
  Pizza,
  Cherry,
  Banana,
  GlassWater,
  IceCream,
  Sandwich,
  Cake,
  Egg,
  Soup,
  Fish,
  Carrot,
  Crown,
  Diamond,
  Gift,
  Star,
  Gem,
  Rocket,
  Ghost,
  Orbit,
  Palette,
  Lightbulb,
  HeartPulse,
  ShoppingBag,
} from "lucide-react-native";
import { useMemo, useRef, useState, useEffect } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { moodToAction } from "@/utils/mood";
import { playCollectSound, playSoftChime, playSuccessSound } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const ICON_COMPONENTS: Record<string, any> = {
  Apple, Cookie, Coffee, Droplet, Milk: Droplet, Pizza, Cherry, Banana,
  GlassWater, IceCream, Sandwich, Cake, Egg, Soup, Fish, Carrot,
  Crown, Diamond, Gift, Sparkles, Star, Gem, Trophy, Rocket,
  Ghost, Orbit, Palette, Lightbulb, HeartPulse, Medal, Flame,
  apple: Apple, pizza: Pizza, cake: Cake, water: GlassWater, coffee: Coffee, milk: Droplet
};

export default function SpriteScreen() {
  const router = useRouter();
  const colors = useThemeColor();

  useEffect(() => {
    playSoftChime();
  }, []);

  const [mascotPressed, setMascotPressed] = useState(false);
  const [droppedItem, setDroppedItem] = useState<{ iconName: string, rarity: string } | null>(null);
  const dropAnim = useRef(new Animated.Value(0)).current;

  const inventoryQuery = useQuery(
    orpc.getInventory.queryOptions({ queryKey: ["getInventory"] })
  );

  const feedMutation = useMutation(
    orpc.feedSprite.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: orpc.getInventory.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getSpriteCollection.key() });
        queryClient.invalidateQueries({ queryKey: orpc.getMoonlightCredits.key() });
        setDroppedItem(data.drop);
        vibrate(40);
        playSuccessSound();
        setTimeout(playCollectSound, 400);

        dropAnim.setValue(0);
        Animated.sequence([
          Animated.spring(dropAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
          Animated.delay(2000),
          Animated.timing(dropAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start(() => setDroppedItem(null));
      },
      onError: (err: Error) => {
        alert(err.message);
      }
    })
  );

  const handleFeed = (itemId: string) => {
    vibrate(20);
    feedMutation.mutate({ itemId });
  };

  const LEVELS = useMemo(() => [
    { name: "Bronze", min: 0, color: colors.warning },
    { name: "Silver", min: 500, color: colors.mutedForeground },
    { name: "Gold", min: 2000, color: colors.warning },
    { name: "Platinum", min: 5000, color: colors.mutedForeground },
    { name: "Diamond", min: 10000, color: colors.primary },
  ], [colors]);

  const spriteQuery = useQuery(
    orpc.getSpriteState.queryOptions({ queryKey: ["getSpriteState"] })
  );
  const creditsQuery = useQuery(
    orpc.getMoonlightCredits.queryOptions({ queryKey: ["getMoonlightCredits"] })
  );
  const historyQuery = useQuery(
    orpc.getWellnessHistory.queryOptions({ queryKey: ["getWellnessHistory"] })
  );
  const collectionQuery = useQuery(
    orpc.getSpriteCollection.queryOptions({ queryKey: ["getSpriteCollection"] })
  );

  const sprite = spriteQuery.data;
  const credits = creditsQuery.data;
  const { collection = [], catalog = {} } = collectionQuery.data ?? {};

  const totalPossibleItems = useMemo(() =>
    Object.values(catalog).reduce((acc: number, val: any) => acc + val.length, 0),
  [catalog]);
  const uniqueCollected = collection.length;

  const todayActions = useMemo(() =>
    historyQuery.data?.filter((a) => {
      const today = new Date().toISOString().split("T")[0];
      return a.completedAt.startsWith(today);
    }) ?? [],
  [historyQuery.data]);

  const totalEarned = credits?.totalEarned ?? 0;
  const currentLevel = useMemo(() => {
    return [...LEVELS].reverse().find(l => totalEarned >= l.min) ?? LEVELS[0];
  }, [totalEarned, LEVELS]);

  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel!) + 1];
  const levelProgress = nextLevel
    ? (totalEarned - currentLevel!.min) / (nextLevel.min - currentLevel!.min)
    : 1;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="bg-background"
        scrollClassName="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-page py-page pb-32"
        >

          {/* Header Area */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Medal color={colors.primary} size={24} />
              </View>
              <View>
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
                  Level {LEVELS.indexOf(currentLevel!) + 1}
                </Text>
                <Text className="font-black font-sans text-xl text-foreground tracking-tight">
                  {currentLevel?.name}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 rounded-full bg-warning/10 px-4 py-2 border border-warning/20">
              <Moon color={colors.warning} size={16} />
              <Text className="font-black font-sans text-warning text-lg">
                {credits?.balance ?? 0}
              </Text>
            </View>
          </View>

          {/* Level Progress */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase tracking-widest">
                Progress to {nextLevel?.name ?? "Max"}
              </Text>
              <Text className="font-bold font-sans text-primary text-[10px]">
                {Math.round(levelProgress * 100)}%
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted border border-border/50">
              <View
                className="h-full rounded-full bg-primary shadow-sm"
                style={{ width: `${levelProgress * 100}%` }}
              />
            </View>
          </View>

          {/* Mascot Display */}
          <View className="items-center justify-center py-4 relative">
             <View className="absolute h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

             {/* Dropped Item Animation */}
             {droppedItem && (
               <Animated.View
                 style={{
                   position: 'absolute',
                   top: 20,
                   zIndex: 50,
                   opacity: dropAnim,
                   transform: [
                     { translateY: dropAnim.interpolate({ inputRange: [0, 1], outputRange: [20, -60] }) },
                     { scale: dropAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }
                   ]
                 }}
                 className="items-center gap-2"
               >
                  <View
                    className={`h-20 w-20 items-center justify-center rounded-3xl border-4 shadow-xl ${
                      droppedItem.rarity === 'legendary' ? 'border-primary bg-primary/10' :
                      droppedItem.rarity === 'rare' ? 'border-warning bg-warning/10' :
                      'border-border bg-card'
                    }`}
                  >
                     {(() => {
                        const Icon = ICON_COMPONENTS[droppedItem.iconName] ?? Sparkles;
                        return <Icon color={
                          droppedItem.rarity === 'legendary' ? colors.primary :
                          droppedItem.rarity === 'rare' ? colors.warning :
                          colors.foreground
                        } size={40} />
                     })()}
                  </View>
                  <View className="bg-foreground rounded-full px-4 py-1">
                     <Text className="text-background font-black font-sans text-[10px] uppercase tracking-widest">
                       {droppedItem.rarity} Found!
                     </Text>
                  </View>
               </Animated.View>
             )}

            <Pressable
              className="h-72 w-72 items-center justify-center z-10"
              onPressIn={() => setMascotPressed(true)}
              onPressOut={() => setMascotPressed(false)}
            >
              <View
                className="items-center justify-center"
                style={{
                  transform: [
                    { translateY: mascotPressed ? 4 : 0 },
                    { scale: mascotPressed ? 0.96 : 1 },
                  ],
                }}
              >
                <SpriteAnimation
                  action={moodToAction(sprite?.mood ?? "idle")}
                  size="lg"
                />
              </View>
            </Pressable>

            {/* Status Overlays */}
            <View className="absolute bottom-0 right-4 bg-card border-2 border-border rounded-2xl p-3 shadow-sm z-20">
              <View className="flex-row items-center gap-2">
                <Heart color={colors.destructive} size={14} />
                <Text className="font-black font-sans text-foreground text-sm">
                  {sprite?.health ?? 100}%
                </Text>
              </View>
            </View>

            <View className="absolute bottom-0 left-4 bg-card border-2 border-border rounded-2xl p-3 shadow-sm z-20">
              <View className="flex-row items-center gap-2">
                <Zap color={colors.warning} size={14} />
                <Text className="font-black font-sans text-foreground text-sm uppercase">
                  {sprite?.mood ?? "idle"}
                </Text>
              </View>
            </View>
          </View>

          {/* Sprite Stats Card */}
          <View className="gap-3 rounded-card border-2 border-border bg-card p-4 shadow-sm">
              <View className="flex-row items-center gap-3">
                <View className="rounded-full bg-warning/15 p-3">
                  <Heart color={colors.destructive} size={18} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Sprite Status
                  </Text>
                  <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                    {sprite?.mood ?? "idle"} • Health {sprite?.health ?? 100}%
                  </Text>
                </View>
              </View>

              <View className="gap-4 py-2">
                {/* Mission Progress */}
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase tracking-wider">Missions Today</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{todayActions.length}/5</Text>
                  </View>
                  <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (todayActions.length / 5) * 100)}%` }}
                    />
                  </View>
                </View>

                {/* Collection Progress */}
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase tracking-wider">Gallery Progress</Text>
                    <Text className="font-black font-sans text-foreground text-[10px]">{uniqueCollected}/{totalPossibleItems}</Text>
                  </View>
                  <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-warning"
                      style={{ width: `${totalPossibleItems > 0 ? (uniqueCollected / totalPossibleItems) * 100 : 0}%` }}
                    />
                  </View>
                </View>
              </View>

              <View className="flex-row gap-2 mt-1">
                <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3 items-center">
                  <Text className="font-bold font-sans text-[8px] text-muted-foreground uppercase tracking-widest">Streak</Text>
                  <Text className="mt-1 font-black font-sans text-xl text-foreground">{sprite?.streakDays ?? 0}</Text>
                </View>
                <View className="flex-1 rounded-control border-2 border-border bg-background px-3 py-3 items-center">
                  <Text className="font-bold font-sans text-[8px] text-muted-foreground uppercase tracking-widest">Level</Text>
                  <Text className="mt-1 font-black font-sans text-xl text-foreground">{LEVELS.indexOf(currentLevel!) + 1}</Text>
                </View>
              </View>
          </View>

          {/* Collection Shortcut Card */}
          <Pressable
            onPress={() => router.push("/sprite/trophies")}
            className="rounded-card border-2 border-border bg-card p-5 shadow-sm overflow-hidden"
          >
             <View className="absolute -right-6 -bottom-6 opacity-5 rotate-12">
                <Trophy size={100} color={colors.foreground} />
             </View>
             <View className="flex-row items-center justify-between">
                <View className="gap-1">
                   <Text className="font-black font-sans text-foreground text-lg tracking-tight">Trophy Room</Text>
                   <Text className="font-bold font-sans text-muted-foreground text-xs uppercase">View your unique findings</Text>
                </View>
                <ChevronRight color={colors.mutedForeground} size={20} />
             </View>
          </Pressable>

          {/* Inventory Section */}
          <View className="gap-4">
             <View className="flex-row items-center justify-between px-1">
                <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
                  My Inventory
                </Text>
                <Pressable onPress={() => router.push("/sprite/shop")}>
                   <Text className="font-bold font-sans text-primary text-xs">+ Buy Food</Text>
                </Pressable>
             </View>

             <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerClassName="gap-4 px-1 w-full"
             >
                {inventoryQuery.data?.filter(i => i.quantity > 0).length === 0 && (
                   <View className="bg-card border-2 border-border border-dashed rounded-2xl p-6 items-center justify-center w-full">
                      <Text className="font-bold font-sans text-muted-foreground text-xs text-center">Your bag is empty! Go to the shop.</Text>
                   </View>
                )}
                {inventoryQuery.data?.filter(i => i.quantity > 0).map((item) => {
                   const Icon = ICON_COMPONENTS[item.itemId] ?? Apple;
                   return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleFeed(item.itemId)}
                        disabled={feedMutation.isPending}
                        className="bg-card border-2 border-border rounded-2xl p-4 gap-2 items-center w-24 active:bg-muted/30 shadow-sm"
                      >
                         <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon color={colors.primary} size={24} />
                         </View>
                         <Text className="font-bold font-sans text-foreground text-[10px] uppercase text-center" numberOfLines={1}>{item.itemId}</Text>
                         <View className="bg-primary px-2 py-0.5 rounded-full">
                            <Text className="text-white font-black text-[8px]">x{item.quantity}</Text>
                         </View>
                      </Pressable>
                   )
                })}
             </ScrollView>
          </View>

          {/* Weekly Streak */}
          <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Flame color={colors.warning} size={20} />
                <Text className="font-black font-sans text-foreground text-lg tracking-tight">
                  {sprite?.streakDays ?? 0} Day Streak
                </Text>
              </View>
              <Text className="font-bold font-sans text-warning text-xs uppercase tracking-widest">
                x2 Multiplier
              </Text>
            </View>
            <View className="flex-row justify-between">
              {WEEK_DAYS.map((day, i) => {
                const isActive = i < (sprite?.streakDays ?? 0) % 7;
                return (
                  <View key={i} className="items-center gap-2">
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? "border-warning bg-warning/10"
                          : "border-border bg-muted/50"
                      }`}
                    >
                      {isActive ? (
                        <Flame color={colors.warning} size={18} />
                      ) : (
                        <Text className="font-bold font-sans text-muted-foreground text-xs">{day}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Social Comparison Card */}
          <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
            <View className="flex-row items-center gap-2 mb-4">
              <Users color={colors.primary} size={20} />
              <Text className="font-black font-sans text-foreground text-lg tracking-tight">
                Social Impact
              </Text>
            </View>

            <View className="flex-row gap-4">
               <View className="flex-1 bg-muted/30 rounded-2xl p-4 items-center gap-1">
                 <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase">Avg. Student</Text>
                 <Text className="font-black font-sans text-foreground text-xl">185</Text>
               </View>
               <View className="flex-1 bg-primary/10 rounded-2xl p-4 items-center gap-1 border border-primary/20">
                 <Text className="font-bold font-sans text-primary text-[10px] uppercase">You</Text>
                 <Text className="font-black font-sans text-primary text-xl">200</Text>
               </View>
            </View>
            <Text className="mt-4 text-center font-bold font-sans text-muted-foreground text-xs">
              You are performing better than 75% of users!
            </Text>
          </View>

          {/* Level Path Card */}
          <View className="rounded-card border-2 border-primary/20 bg-primary/5 p-5 shadow-sm overflow-hidden pb-10">
             <View className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10" />
             <View className="flex-row items-center gap-2 mb-3">
                <Trophy color={colors.primary} size={20} />
                <Text className="font-black font-sans text-foreground text-lg tracking-tight">Level Path</Text>
             </View>
             <View className="flex-row items-center justify-between relative px-2">
                <View className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
                {[1, 2, 3, 4, 5].map((l) => {
                  const isCurrent = l === LEVELS.indexOf(currentLevel!) + 1;
                  const isPast = l < LEVELS.indexOf(currentLevel!) + 1;
                  return (
                    <View key={l} className="items-center gap-1">
                       <View className={`h-8 w-8 items-center justify-center rounded-full border-2 ${
                         isCurrent ? "bg-primary border-white shadow-md" :
                         isPast ? "bg-muted border-border" : "bg-card border-border"
                       }`}>
                          <Text className={`font-black text-[10px] ${isCurrent ? "text-white" : "text-muted-foreground"}`}>{l}</Text>
                       </View>
                    </View>
                  )
                })}
             </View>
             <Text className="mt-4 text-center font-bold font-sans text-primary text-[10px] uppercase tracking-wider">
                1,240 Credits away from Level 3
             </Text>
          </View>
        </ScrollView>
      </Screen>

      <ScreenBottomBar>
        <Pressable
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-background px-3"
          onPress={() => {
            vibrate(10);
            router.push("/sprite/shop");
          }}
        >
           <ShoppingBag color={colors.primary} size={18} />
           <Text className="font-black font-sans text-foreground text-xs uppercase">Shop</Text>
        </Pressable>
        <Pressable
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-background px-3"
          onPress={() => {
            vibrate(10);
            router.push("/sprite/leaderboard");
          }}
        >
           <Trophy color={colors.warning} size={18} />
           <Text className="font-black font-sans text-foreground text-xs uppercase">Rank</Text>
        </Pressable>
        <Button
          className="h-12 flex-1 shadow-lg shadow-primary/20"
          href="/sprite/actions"
          icon={<ChevronRight color="#ffffff" size={16} />}
          variant="primary"
        >
          Missions
        </Button>
        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
