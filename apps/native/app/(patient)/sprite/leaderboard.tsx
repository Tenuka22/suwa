"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Medal,
  Moon,
  Trophy,
  Users,
} from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { vibrate } from "@/utils/haptics";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function SpriteLeaderboardScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const leaderboardQuery = useQuery(
    orpc.getLeaderboard.queryOptions({ queryKey: ["getLeaderboard"] })
  );
  const creditsQuery = useQuery(
    orpc.getMoonlightCredits.queryOptions({ queryKey: ["getMoonlightCredits"] })
  );

  const leaderboard = leaderboardQuery.data?.leaderboard ?? [];
  const currentUserRank = leaderboardQuery.data?.currentUserRank;
  const credits = creditsQuery.data;

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
          {/* Header */}
          <View className="items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 border-2 border-warning/20 shadow-sm shadow-warning/20">
               <Trophy color={colors.warning} size={32} />
            </View>
            <View className="items-center">
              <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
                Global Ranking
              </Text>
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-widest">
                Top Sprite Guardians
              </Text>
            </View>
          </View>

          {/* Top 3 Podium Mockup Layout */}
          <View className="flex-row items-end justify-center gap-4 py-4">
             {/* Rank 2 */}
             {leaderboard[1] && (
               <View className="items-center gap-2 flex-1">
                  <View className="h-12 w-12 rounded-full bg-muted border-2 border-border items-center justify-center">
                     <Text className="font-black text-muted-foreground">2</Text>
                  </View>
                  <View className="bg-card border-2 border-border rounded-xl p-3 w-full items-center shadow-sm">
                     <Text className="font-black font-sans text-foreground text-xs" numberOfLines={1}>{leaderboard[1].alias}</Text>
                     <View className="flex-row items-center gap-1">
                        <Moon color={colors.warning} size={10} />
                        <Text className="font-bold font-sans text-warning text-[10px]">{leaderboard[1].totalEarned}</Text>
                     </View>
                  </View>
               </View>
             )}

             {/* Rank 1 */}
             {leaderboard[0] && (
               <View className="items-center gap-2 flex-1 mb-4">
                  <View className="h-16 w-16 rounded-full bg-warning/20 border-4 border-warning items-center justify-center shadow-lg shadow-warning/30">
                     <Medal color={colors.warning} size={32} />
                  </View>
                  <View className="bg-warning/5 border-2 border-warning/30 rounded-2xl p-4 w-full items-center shadow-md">
                     <Text className="font-black font-sans text-foreground text-sm" numberOfLines={1}>{leaderboard[0].alias}</Text>
                     <View className="flex-row items-center gap-1">
                        <Moon color={colors.warning} size={12} />
                        <Text className="font-black font-sans text-warning text-sm">{leaderboard[0].totalEarned}</Text>
                     </View>
                  </View>
               </View>
             )}

             {/* Rank 3 */}
             {leaderboard[2] && (
               <View className="items-center gap-2 flex-1">
                  <View className="h-12 w-12 rounded-full bg-muted border-2 border-border items-center justify-center">
                     <Text className="font-black text-muted-foreground">3</Text>
                  </View>
                  <View className="bg-card border-2 border-border rounded-xl p-3 w-full items-center shadow-sm">
                     <Text className="font-black font-sans text-foreground text-xs" numberOfLines={1}>{leaderboard[2].alias}</Text>
                     <View className="flex-row items-center gap-1">
                        <Moon color={colors.warning} size={10} />
                        <Text className="font-bold font-sans text-warning text-[10px]">{leaderboard[2].totalEarned}</Text>
                     </View>
                  </View>
               </View>
             )}
          </View>

          {/* Leaderboard List */}
          <View className="gap-3">
             <View className="flex-row items-center gap-2 px-1">
                <Users color={colors.primary} size={16} />
                <Text className="font-black font-sans text-foreground text-sm uppercase tracking-wider">Players Standings</Text>
             </View>

             <View className="rounded-card border-2 border-border bg-card overflow-hidden shadow-sm">
                {leaderboard.slice(3).map((player, i) => {
                  const rank = i + 4;
                  return (
                    <View 
                      key={player.userId} 
                      className={`flex-row items-center gap-4 px-5 py-4 border-border ${i !== leaderboard.length - 4 ? "border-b-2" : ""}`}
                    >
                       <Text className="font-black font-sans text-muted-foreground w-6 text-center">{rank}</Text>
                       <View className="h-10 w-10 rounded-full bg-muted border border-border items-center justify-center">
                          <Text className="font-black text-muted-foreground text-xs">{player.alias?.[0]?.toUpperCase()}</Text>
                       </View>
                       <View className="flex-1">
                          <Text className="font-black font-sans text-foreground text-sm">{player.alias}</Text>
                          <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase">Level {Math.floor(player.totalEarned / 500) + 1}</Text>
                       </View>
                       <View className="flex-row items-center gap-1.5 bg-warning/10 px-3 py-1.5 rounded-full border border-warning/20">
                          <Moon color={colors.warning} size={14} />
                          <Text className="font-black font-sans text-warning text-sm">{player.totalEarned}</Text>
                       </View>
                    </View>
                  )
                })}
             </View>
          </View>

          {/* Current User Status (Floating feel) */}
          {currentUserRank && (
            <View className="mt-4 bg-primary/5 border-2 border-primary/20 rounded-card p-5 flex-row items-center gap-4 shadow-sm">
               <View className="h-12 w-12 rounded-full bg-primary items-center justify-center">
                  <Text className="font-black text-white text-lg">{currentUserRank}</Text>
               </View>
               <View className="flex-1">
                  <Text className="font-black font-sans text-foreground text-base">You are ranked #{currentUserRank}!</Text>
                  <Text className="font-bold font-sans text-muted-foreground text-[10px] uppercase">Keep going to reach the podium</Text>
               </View>
               <Trophy color={colors.primary} size={24} />
            </View>
          )}
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
