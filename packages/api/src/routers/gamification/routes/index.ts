import {
  moonlightCredits,
  moonlightCreditTransactions,
  patientProfiles,
  spriteCollections,
  spriteInventory,
  spriteStates,
  wellnessActions,
} from "@suwa/db";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const ACTION_TYPES = [
  "breathing_morning",
  "breathing_evening",
  "breathing_night",
  "meditation_morning",
  "meditation_evening",
  "gratitude_morning",
  "gratitude_evening",
  "hydration",
  "walking",
  "sleep_prep",
  "journaling",
  "nutrition",
  "social_checkin",
  "stretching",
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

interface TaskTemplate {
  actionType: ActionType;
  descriptions: string[];
  maxCycles: number;
  minCycles: number;
  timeSlot: "morning" | "afternoon" | "night";
  titles: string[];
}

const TASK_POOL: TaskTemplate[] = [
  {
    actionType: "breathing_morning",
    timeSlot: "morning",
    titles: ["Breath Rhythm", "Morning Wake-Up", "Sunrise Breath", "Dew Drops"],
    descriptions: [
      "Start your day calm and centered with a guided breathing rhythm.",
      "Wake up your lungs with invigorating morning breathwork.",
      "Synchronize your breath with the rising sun.",
      "Gentle breathing to greet the new day.",
    ],
    minCycles: 3,
    maxCycles: 6,
  },
  {
    actionType: "meditation_morning",
    timeSlot: "morning",
    titles: [
      "Morning Meditation",
      "Mindful Start",
      "Dawn Stillness",
      "Morning Calm",
    ],
    descriptions: [
      "Set your intention for the day with a short morning meditation.",
      "Quiet the mind before the day begins.",
      "Find your center in the stillness of dawn.",
      "A moment of peace to start your day right.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "breathing_evening",
    timeSlot: "afternoon",
    titles: [
      "Afternoon Reset",
      "Midday Breath",
      "Afternoon Pause",
      "Solar Rhythm",
    ],
    descriptions: [
      "Reset your focus with an afternoon breathing exercise.",
      "Break up your day with a mindful breathing pause.",
      "Recharge your energy with midday breathwork.",
      "A breath of fresh air for your afternoon slump.",
    ],
    minCycles: 3,
    maxCycles: 5,
  },
  {
    actionType: "meditation_evening",
    timeSlot: "afternoon",
    titles: [
      "Afternoon Mindfulness",
      "Midday Meditation",
      "Afternoon Stillness",
      "Solar Calm",
    ],
    descriptions: [
      "Release built-up tension with a short afternoon meditation.",
      "Find clarity in the middle of your day.",
      "A mindful pause to carry you through the afternoon.",
      "Center yourself before the evening rush.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "breathing_night",
    timeSlot: "night",
    titles: [
      "Night Calm",
      "Sleepy Breath",
      "Moonlight Rhythm",
      "Starry Breath",
    ],
    descriptions: [
      "Deep breathing to wind down for a restful night's sleep.",
      "Let go of the day with calming night breathwork.",
      "Breathe easy under the moonlight.",
      "Gentle breathing to guide you into slumber.",
    ],
    minCycles: 3,
    maxCycles: 6,
  },
  {
    actionType: "meditation_evening",
    timeSlot: "night",
    titles: [
      "Evening Meditation",
      "Dusk Stillness",
      "Night Reflection",
      "Moonlight Calm",
    ],
    descriptions: [
      "Release the day's tension with a calming evening meditation.",
      "Quiet reflection as the day comes to a close.",
      "Find peace in the quiet of the evening.",
      "Let the moonlight guide your meditation.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "gratitude_morning",
    timeSlot: "morning",
    titles: [
      "Morning Gratitude",
      "Dawn Appreciation",
      "Sunrise Thanks",
      "Grateful Start",
    ],
    descriptions: [
      "Start your day by noting three things you're grateful for.",
      "Begin with a grateful heart and set a positive tone.",
      "Appreciate the small blessings of a new day.",
      "Write your morning gratitudes to boost your mood.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "gratitude_evening",
    timeSlot: "night",
    titles: [
      "Evening Gratitude",
      "Dusk Reflection",
      "Night Thanks",
      "Grateful Close",
    ],
    descriptions: [
      "Reflect on your day and note what brought you joy.",
      "End your day with a grateful heart.",
      "Write three good things that happened today.",
      "Close your day with appreciation and peace.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "hydration",
    timeSlot: "afternoon",
    titles: ["Hydration Check", "Water Break", "Drink Up", "Stay Hydrated"],
    descriptions: [
      "Track your water intake - aim for 8 glasses today.",
      "Stay hydrated to keep your energy levels up.",
      "A healthy habit that your body will thank you for.",
      "Keep track of your water glasses for better health.",
    ],
    minCycles: 8,
    maxCycles: 8,
  },
  {
    actionType: "walking",
    timeSlot: "afternoon",
    titles: ["Step Counter", "Walking Break", "Move Your Body", "Daily Steps"],
    descriptions: [
      "Track your steps - aim for at least 5,000 steps today.",
      "Take a walking break to refresh your mind.",
      "Movement is medicine for your body and spirit.",
      "Every step counts toward your daily goal.",
    ],
    minCycles: 5000,
    maxCycles: 10_000,
  },
  {
    actionType: "sleep_prep",
    timeSlot: "night",
    titles: ["Sleep Routine", "Wind Down", "Bedtime Prep", "Night Ritual"],
    descriptions: [
      "Prepare for restful sleep with a calming bedtime routine.",
      "Follow a wind-down checklist for better sleep quality.",
      "Set yourself up for a peaceful night's rest.",
      "Complete your sleep preparation checklist.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "journaling",
    timeSlot: "night",
    titles: [
      "Daily Reflection",
      "Journal Entry",
      "Mindful Writing",
      "Day's End",
    ],
    descriptions: [
      "Write down your thoughts and experiences from today.",
      "A moment to reflect on your journey and growth.",
      "Journaling helps clear the mind and improve sleep.",
      "Capture the moments that mattered most to you.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "nutrition",
    timeSlot: "afternoon",
    titles: [
      "Balanced Meal",
      "Healthy Fuel",
      "Nutrition Log",
      "Mindful Eating",
    ],
    descriptions: [
      "Fuel your body with wholesome, balanced food.",
      "Log your nutritious meals for the day.",
      "Track your nutrition to maintain energy levels.",
      "A healthy body supports a healthy mind.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "social_checkin",
    timeSlot: "afternoon",
    titles: ["Social Connection", "Reach Out", "Kindness Act", "Friendship"],
    descriptions: [
      "Connect with a friend or loved one today.",
      "Send a kind message or make a quick call.",
      "Social bonds are essential for mental wellbeing.",
      "A small act of connection can brighten someone's day.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "stretching",
    timeSlot: "morning",
    titles: ["Morning Stretch", "Flexibility", "Body Wake-Up", "Gentle Flow"],
    descriptions: [
      "Awaken your body with a gentle stretching routine.",
      "Improve your flexibility and release morning tension.",
      "A quick flow to start your day feeling energized.",
      "Stretch your muscles and prepare for the day ahead.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

const calculateConsistencyBonus = (streakDays: number): number => {
  if (streakDays >= 30) {
    return 50;
  }
  if (streakDays >= 14) {
    return 30;
  }
  if (streakDays >= 7) {
    return 20;
  }
  if (streakDays >= 3) {
    return 10;
  }
  return 5;
};

export const getSpriteStateRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    let [state] = await context.db
      .select()
      .from(spriteStates)
      .where(eq(spriteStates.userId, userId))
      .limit(1);

    if (!state) {
      await context.db.insert(spriteStates).values({
        userId,
        health: 100,
        mood: "idle",
        streakDays: 0,
      });
      [state] = await context.db
        .select()
        .from(spriteStates)
        .where(eq(spriteStates.userId, userId))
        .limit(1);
    }

    if (!state) {
      return {
        userId,
        health: 100,
        mood: "idle" as const,
        streakDays: 0,
        lastInteractionAt: null,
        createdAt: "",
        updatedAt: "",
      };
    }

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const [actionCount] = await context.db
      .select({ count: count() })
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          gte(wellnessActions.completedAt, sevenDaysAgo)
        )
      );
    const health = Math.max(
      0,
      Math.min(100, 40 + (actionCount?.count ?? 0) * 10)
    );

    let mood: "idle" | "sleep" | "yawn" | "happy" | "sad" = state.mood;
    if (health > 80) {
      mood = "happy";
    } else if (health < 30) {
      mood = "sad";
    } else if (health < 50) {
      mood = "yawn";
    }

    if (health !== state.health || mood !== state.mood) {
      await context.db
        .update(spriteStates)
        .set({ health, mood, updatedAt: new Date().toISOString() })
        .where(eq(spriteStates.userId, userId));
      state = { ...state, health, mood };
    }

    return state;
  }
);

export const getTodayTasksRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);
    const now = new Date();
    const hour = now.getHours();
    const daySeed =
      now.getFullYear() * 10_000 + (now.getMonth() + 1) * 100 + now.getDate();

    let timeOfDay: "morning" | "afternoon" | "night";
    let slotTemplates: TaskTemplate[];

    if (hour >= 5 && hour < 12) {
      timeOfDay = "morning";
      slotTemplates = TASK_POOL.filter((t) => t.timeSlot === "morning");
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = "afternoon";
      slotTemplates = TASK_POOL.filter((t) => t.timeSlot === "afternoon");
    } else {
      timeOfDay = "night";
      slotTemplates = TASK_POOL.filter((t) => t.timeSlot === "night");
    }

    const rand = seededRandom(daySeed + timeOfDay.length);

    const today = now.toISOString().split("T")[0];
    const todayActions = await context.db
      .select()
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          gte(wellnessActions.completedAt, `${today}T00:00:00Z`)
        )
      );
    const completedSet = new Set(todayActions.map((a) => a.actionType));

    const tasks = slotTemplates.map((t) => {
      const requiredCycles =
        t.minCycles + Math.floor(rand() * (t.maxCycles - t.minCycles + 1));
      const titleIdx = Math.floor(rand() * t.titles.length);
      const descIdx = Math.floor(rand() * t.descriptions.length);

      return {
        actionType: t.actionType,
        timeSlot: t.timeSlot,
        title: t.titles[titleIdx] ?? t.titles[0]!,
        description: t.descriptions[descIdx] ?? t.descriptions[0]!,
        requiredCycles,
        completed: completedSet.has(t.actionType),
        credits: 10,
      };
    });

    return { timeOfDay, tasks };
  }
);

export const completeWellnessActionRoute = protectedProcedure
  .input(
    z.object({
      actionType: z.enum(ACTION_TYPES),
      durationSeconds: z.number().optional(),
      metadata: z.string().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { actionType, durationSeconds, metadata } = input;

    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const existingToday = await context.db
      .select()
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          eq(wellnessActions.actionType, actionType),
          gte(wellnessActions.completedAt, `${today}T00:00:00Z`)
        )
      )
      .limit(1);

    if (existingToday.length > 0) {
      throw new Error(
        "Action already completed today. Come back tomorrow for consistency rewards!"
      );
    }

    const [streakResult] = await context.db
      .select({ streakDays: spriteStates.streakDays })
      .from(spriteStates)
      .where(eq(spriteStates.userId, userId))
      .limit(1);

    const streakDays = streakResult?.streakDays ?? 0;
    const consistencyBonus = calculateConsistencyBonus(streakDays);
    const baseCredits = 10;
    const totalCredits = baseCredits + consistencyBonus;

    await context.db.insert(wellnessActions).values({
      id: crypto.randomUUID(),
      userId,
      actionType,
      completedAt: now,
      durationSeconds,
      metadata,
      creditsEarned: totalCredits,
    });

    const [existingCredits] = await context.db
      .select()
      .from(moonlightCredits)
      .where(eq(moonlightCredits.userId, userId))
      .limit(1);

    if (existingCredits) {
      await context.db
        .update(moonlightCredits)
        .set({
          balance: existingCredits.balance + totalCredits,
          totalEarned: existingCredits.totalEarned + totalCredits,
          updatedAt: now,
        })
        .where(eq(moonlightCredits.userId, userId));
    } else {
      await context.db.insert(moonlightCredits).values({
        userId,
        balance: totalCredits,
        totalEarned: totalCredits,
        consistencyScore: streakDays,
      });
    }

    await context.db.insert(moonlightCreditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount: totalCredits,
      type: "earned",
      reason: `Completed ${actionType}`,
    });

    const newStreak = streakDays + 1;
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const [actionCount] = await context.db
      .select({ count: count() })
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          gte(wellnessActions.completedAt, sevenDaysAgo)
        )
      );
    const health = Math.max(
      0,
      Math.min(100, 40 + (actionCount?.count ?? 0) * 10)
    );

    const [existingSprite] = await context.db
      .select()
      .from(spriteStates)
      .where(eq(spriteStates.userId, userId))
      .limit(1);

    if (existingSprite) {
      await context.db
        .update(spriteStates)
        .set({
          streakDays: newStreak,
          health,
          lastInteractionAt: now,
          updatedAt: now,
        })
        .where(eq(spriteStates.userId, userId));
    } else {
      await context.db.insert(spriteStates).values({
        userId,
        health,
        streakDays: newStreak,
        lastInteractionAt: now,
      });
    }

    return {
      success: true,
      creditsEarned: totalCredits,
      streakDays: newStreak,
      mood: health > 80 ? "happy" : health < 30 ? "sad" : "idle",
    };
  });

export const getMoonlightCreditsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const [credits] = await context.db
      .select()
      .from(moonlightCredits)
      .where(eq(moonlightCredits.userId, userId))
      .limit(1);

    return (
      credits ?? {
        userId,
        balance: 0,
        totalEarned: 0,
        consistencyScore: 0,
      }
    );
  }
);

export const getWellnessHistoryRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const history = await context.db
      .select()
      .from(wellnessActions)
      .where(eq(wellnessActions.userId, userId))
      .orderBy(desc(wellnessActions.completedAt));

    return history;
  }
);

export const getRecentTransactionsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const transactions = await context.db
      .select()
      .from(moonlightCreditTransactions)
      .where(eq(moonlightCreditTransactions.userId, userId))
      .orderBy(desc(moonlightCreditTransactions.createdAt))
      .limit(20);

    return transactions;
  }
);

export const getLeaderboardRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const topCredits = await context.db
      .select({
        userId: moonlightCredits.userId,
        totalEarned: moonlightCredits.totalEarned,
        balance: moonlightCredits.balance,
        alias: patientProfiles.alias,
      })
      .from(moonlightCredits)
      .innerJoin(
        patientProfiles,
        eq(moonlightCredits.userId, patientProfiles.userId)
      )
      .orderBy(desc(moonlightCredits.totalEarned))
      .limit(10);

    const currentUserRank =
      topCredits.findIndex((c) => c.userId === userId) + 1;

    return {
      leaderboard: topCredits,
      currentUserRank: currentUserRank > 0 ? currentUserRank : null,
    };
  }
);

export const buyItemRoute = protectedProcedure
  .input(
    z.object({ itemId: z.string().min(1), cost: z.number().int().positive() })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [credits] = await context.db
      .select()
      .from(moonlightCredits)
      .where(eq(moonlightCredits.userId, userId))
      .limit(1);

    if (!credits || credits.balance < input.cost) {
      throw new Error("Insufficient Moonlight Credits!");
    }

    await context.db
      .update(moonlightCredits)
      .set({
        balance: credits.balance - input.cost,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(moonlightCredits.userId, userId));

    const [existing] = await context.db
      .select()
      .from(spriteInventory)
      .where(
        and(
          eq(spriteInventory.userId, userId),
          eq(spriteInventory.itemId, input.itemId)
        )
      )
      .limit(1);

    if (existing) {
      await context.db
        .update(spriteInventory)
        .set({ quantity: existing.quantity + 1 })
        .where(eq(spriteInventory.id, existing.id));
    } else {
      await context.db.insert(spriteInventory).values({
        id: crypto.randomUUID(),
        userId,
        itemId: input.itemId,
        quantity: 1,
      });
    }

    return { success: true };
  });

export const feedSpriteRoute = protectedProcedure
  .input(z.object({ itemId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [item] = await context.db
      .select()
      .from(spriteInventory)
      .where(
        and(
          eq(spriteInventory.userId, userId),
          eq(spriteInventory.itemId, input.itemId)
        )
      )
      .limit(1);

    if (!item || item.quantity < 1) {
      throw new Error("Item not in inventory!");
    }

    await context.db
      .update(spriteInventory)
      .set({ quantity: item.quantity - 1 })
      .where(eq(spriteInventory.id, item.id));

    // Roll for rarity logic
    const roll = Math.random() * 100;
    let rarity: "common" | "uncommon" | "rare" | "legendary" = "common";
    if (roll < 2) {
      rarity = "legendary";
    } else if (roll < 10) {
      rarity = "rare";
    } else if (roll < 30) {
      rarity = "uncommon";
    }

    const items = ITEM_POOL[rarity];
    const iconName = items[Math.floor(Math.random() * items.length)]!;

    // Add to collection
    const [existing] = await context.db
      .select()
      .from(spriteCollections)
      .where(
        and(
          eq(spriteCollections.userId, userId),
          eq(spriteCollections.iconName, iconName)
        )
      )
      .limit(1);

    if (existing) {
      await context.db
        .update(spriteCollections)
        .set({ count: existing.count + 1 })
        .where(eq(spriteCollections.id, existing.id));
    } else {
      await context.db.insert(spriteCollections).values({
        id: crypto.randomUUID(),
        userId,
        iconName,
        rarity,
        count: 1,
      });
    }

    return { success: true, drop: { iconName, rarity } };
  });

export const getInventoryRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);
    return await context.db
      .select()
      .from(spriteInventory)
      .where(eq(spriteInventory.userId, userId));
  }
);

const ITEM_POOL = {
  common: [
    "Apple",
    "Cookie",
    "Coffee",
    "Droplet",
    "Milk",
    "Pizza",
    "Cherry",
    "Banana",
  ],
  uncommon: [
    "GlassWater",
    "IceCream",
    "Sandwich",
    "Cake",
    "Egg",
    "Soup",
    "Fish",
    "Carrot",
  ],
  rare: [
    "Crown",
    "Diamond",
    "Gift",
    "Sparkles",
    "Star",
    "Gem",
    "Trophy",
    "Rocket",
  ],
  legendary: [
    "Alien",
    "Ghost",
    "Orbit",
    "Palette",
    "Lightbulb",
    "HeartPulse",
    "Medal",
    "Flame",
  ],
};

export const getSpriteCollectionRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const collection = await context.db
      .select()
      .from(spriteCollections)
      .where(eq(spriteCollections.userId, userId))
      .orderBy(desc(spriteCollections.updatedAt));

    return {
      collection,
      catalog: ITEM_POOL,
    };
  }
);
