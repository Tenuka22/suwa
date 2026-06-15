"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, Trophy, Medal, Sparkles, Droplet, Apple, Cookie, Coffee, 
  Pizza, Cherry, Banana, GlassWater, IceCream, Sandwich, Cake, Egg, 
  Soup, Fish, Carrot, Crown, Diamond, Gift, Star, Gem, Rocket, Ghost, 
  Orbit, Palette, Lightbulb, HeartPulse, Flame, ChevronRight, Moon, 
  Lock, Zap, Target
} from "lucide-react-native";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useEffect, useMemo } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playCollectSound } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const ICON_COMPONENTS: Record<string, any> = {
  Apple, Cookie, Coffee, Droplet, Milk: Droplet, Pizza, Cherry, Banana,
  GlassWater, IceCream, Sandwich, Cake, Egg, Soup, Fish, Carrot,
  Crown, Diamond, Gift, Sparkles, Star, Gem, Trophy, Rocket,
  Ghost, Orbit, Palette, Lightbulb, HeartPulse, Medal, Flame
};

const RARITY_CONFIG = {
  common: { label: "Common", color: "#94a3b8", bg: "bg-slate-100" },
  uncommon: { label: "Uncommon", color: "#10b981", bg: "bg-emerald-100" },
  rare: { label: "Rare", color: "#3b82f6", bg: "bg-blue-100" },
  legendary: { label: "Legendary", color: "#a855f7", bg: "bg-purple-100" }
};

const COLLECTOR_RANKS = [
  { min: 0, label: "Novice Scavenger" },
  { min: 5, label: "Apprentice Guardian" },
  { min: 10, label: "Dedicated Collector" },
  { min: 20, label: "Master Seeker" },
  { min: 30, label: "Grand Guardian" },
];

export default function TrophyRoomScreen() {
  const colors = useThemeColor();
  const router = useRouter();

  useEffect(() => {
    playCollectSound();
  }, []);

  const collectionQuery = useQuery(
    orpc.getSpriteCollection.queryOptions({ queryKey: ["getSpriteCollection"] })
  );
  const creditsQuery = useQuery(
    orpc.getMoonlightCredits.queryOptions({ queryKey: ["getMoonlightCredits"] })
  );

  const { collection = [], catalog = {} } = collectionQuery.data ?? {};
  const credits = creditsQuery.data;

  // Flatten catalog and mark as collected/locked
  const gallery = useMemo(() => {
    if (!catalog || Object.keys(catalog).length === 0) return [];
    
    const items: any[] = [];
    Object.entries(catalog).forEach(([rarity, iconNames]: [string, any]) => {
      iconNames.forEach((iconName: string) => {
        const collectedItem = collection.find((c: any) => c.iconName === iconName);
        items.push({
          iconName,
          rarity,
          isCollected: !!collectedItem,
          count: collectedItem?.count ?? 0,
        });
      });
    });
    return items;
  }, [collection, catalog]);

  const stats = useMemo(() => {
    const total = gallery.length;
    const collected = gallery.filter(i => i.isCollected).length;
    const legendary = gallery.filter(i => i.rarity === 'legendary' && i.isCollected).length;
    const totalItems = gallery.reduce((acc, i) => acc + i.count, 0);
    const rank = [...COLLECTOR_RANKS].reverse().find(r => collected >= r.min) ?? COLLECTOR_RANKS[0];
    
    return { total, collected, legendary, totalItems, rank, progress: total > 0 ? collected / total : 0 };
  }, [gallery]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-8 px-page py-12 pb-40"
        >
          {/* Header */}
          <View className="items-center gap-3">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border-2 border-primary/20 shadow-xl shadow-primary/20">
               <Trophy color={colors.primary} size={40} />
            </View>
            <View className="items-center">
              <Text className="font-black font-sans text-4xl text-foreground text-center tracking-tight">
                Guardian Gallery
              </Text>
              <Text className="text-center font-medium font-sans text-muted-foreground text-sm max-w-[280px]">
                Your growing collection of items found while caring for your Sprite.
              </Text>
            </View>
          </View>

          {/* Completion Progress Card */}
          <View className="rounded-card border-2 border-border bg-card p-6 shadow-sm overflow-hidden relative">
             <View className="absolute -right-4 -top-4 opacity-5">
                <Target size={120} color={colors.primary} />
             </View>
             
             <View className="flex-row items-start justify-between mb-4">
                <View className="gap-1">
                   <Text className="font-bold font-sans text-primary text-[10px] uppercase tracking-[0.2em]">{stats.rank?.label}</Text>
                   <Text className="font-black font-sans text-foreground text-3xl">
                      {stats.collected}<Text className="text-muted-foreground text-lg">/{stats.total}</Text>
                   </Text>
                   <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase tracking-widest">Treasures Found</Text>
                </View>
                <View className="items-end gap-1">
                   <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      <Text className="font-black font-sans text-primary text-sm">{Math.round(stats.progress * 100)}%</Text>
                   </View>
                   <Text className="font-bold font-sans text-muted-foreground text-[8px] uppercase tracking-widest">Completion</Text>
                </View>
             </View>

             <View className="h-3 overflow-hidden rounded-full bg-muted border border-border/50">
                <View
                  className="h-full rounded-full bg-primary shadow-sm"
                  style={{ width: `${stats.progress * 100}%` }}
                />
             </View>

             <View className="flex-row items-center gap-4 mt-6">
                <View className="flex-1 bg-warning/10 rounded-2xl p-3 border border-warning/20 items-center gap-1">
                   <Zap color={colors.warning} size={14} />
                   <Text className="font-black font-sans text-warning text-xs">Findings: {stats.totalItems}</Text>
                </View>
                <View className="flex-1 bg-accent/10 rounded-2xl p-3 border border-accent/20 items-center gap-1">
                   <Sparkles color={colors.accent} size={14} />
                   <Text className="font-black font-sans text-accent text-xs">Legendary: {stats.legendary}</Text>
                </View>
             </View>
          </View>

          {/* Gallery Sections */}
          {['legendary', 'rare', 'uncommon', 'common'].map((rarity) => {
            const items = gallery.filter(i => i.rarity === rarity);
            if (items.length === 0) return null;
            const config = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];

            return (
              <View key={rarity} className="gap-4">
                <View className="flex-row items-center gap-2 px-1">
                   <Sparkles color={config.color} size={16} />
                   <Text style={{ color: config.color }} className="font-black font-sans text-sm uppercase tracking-widest">
                     {config.label} Items
                   </Text>
                </View>

                <View className="flex-row flex-wrap gap-3">
                  {items.map((item) => {
                    const Icon = ICON_COMPONENTS[item.iconName] ?? Sparkles;
                    return (
                      <View key={item.iconName} className="w-[22%] items-center gap-1.5">
                         <View 
                           className={`h-16 w-16 items-center justify-center rounded-2xl border-2 shadow-sm ${
                             !item.isCollected ? 'bg-muted/30 border-border border-dashed' :
                             rarity === 'legendary' ? 'border-purple-400 bg-purple-50' :
                             rarity === 'rare' ? 'border-blue-400 bg-blue-50' :
                             'border-border bg-card'
                           }`}
                         >
                            {item.isCollected ? (
                              <Icon color={item.isCollected ? config.color : colors.mutedForeground} size={28} />
                            ) : (
                              <Lock color={colors.mutedForeground} size={16} opacity={0.3} />
                            )}
                            
                            {item.count > 1 && (
                               <View className="absolute -top-2 -right-2 bg-foreground rounded-full h-5 w-5 items-center justify-center border-2 border-background">
                                  <Text className="text-background font-black text-[8px]">x{item.count}</Text>
                               </View>
                            )}
                         </View>
                         <Text 
                           numberOfLines={1} 
                           className={`font-bold font-sans text-[8px] uppercase text-center ${item.isCollected ? 'text-foreground' : 'text-muted-foreground opacity-40'}`}
                         >
                           {item.isCollected ? item.iconName : '???'}
                         </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Screen>

      <ScreenBottomBar>
        <View className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border-2 border-border bg-background px-3 py-2">
          <Moon color={colors.warning} size={18} />
          <View>
            <Text className="font-black font-sans text-foreground text-sm leading-none">
              {credits?.balance ?? 0}
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
