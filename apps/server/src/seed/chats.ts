import { faker } from "@faker-js/faker";
import type { createDb } from "@zen-doc/db";
import { conversations, messages } from "@zen-doc/db";
import { eq } from "drizzle-orm";

const THERAPY_TOPICS = [
  "Coping with anxiety",
  "Stress management techniques",
  "Sleep hygiene improvement",
  "Mindfulness practice",
  "Emotional regulation",
  "Relationship communication",
  "Work-life balance",
  "Self-care strategies",
  "Grief and loss processing",
  "Building self-esteem",
  "Managing depression symptoms",
  "Trauma recovery journey",
];

const PATIENT_MESSAGES = [
  "I've been feeling really anxious lately, especially before work meetings.",
  "The breathing exercises helped a lot, thank you.",
  "I had a tough week, couldn't sleep well.",
  "I practiced mindfulness today and felt calmer.",
  "Can we talk about my progress with managing stress?",
  "I've been keeping a journal like you suggested.",
  "The panic attacks have reduced significantly this week.",
  "I'm struggling with my morning routine.",
  "I wanted to share that I tried the meditation app.",
  "I feel like I'm making progress with my therapy goals.",
  "Had a setback today but used the coping strategies we discussed.",
  "My family has noticed positive changes in me.",
];

const DOCTOR_MESSAGES = [
  "That's great progress! How do you feel about the techniques we discussed?",
  "I'm glad the breathing exercises are helping. Let's build on that.",
  "I understand sleep can be challenging. Let's review your sleep hygiene routine.",
  "Wonderful! Consistency is key with mindfulness practice.",
  "Absolutely, let's review your progress and adjust the treatment plan.",
  "Journaling is a powerful tool. What patterns have you noticed?",
  "That's excellent news. The coping strategies are working well.",
  "Let's work on establishing a more sustainable morning routine.",
  "That's a positive step. Technology can complement our work well.",
  "I'm proud of your dedication to the therapeutic process.",
  "Setbacks are part of the journey. Let's learn from this experience.",
  "That's wonderful to hear. Your hard work is paying off.",
];

export async function seedChats(
  db: ReturnType<typeof createDb>,
  userIds: string[]
) {
  if (userIds.length < 2) {
    return { conversations: 0, messages: 0 };
  }

  const existing = await db
    .select({ id: conversations.id })
    .from(conversations);
  if (existing.length > 0) {
    return { conversations: 0, messages: 0 };
  }

  let totalConversations = 0;
  let totalMessages = 0;
  const conversationCount = faker.number.int({ min: 3, max: 6 });

  for (let i = 0; i < conversationCount; i++) {
    const userId = faker.helpers.arrayElement(userIds);
    const conversationId = crypto.randomUUID();
    const createdAt = faker.date.recent({ days: 30 });

    await db.insert(conversations).values({
      id: conversationId,
      userId,
      title: faker.helpers.arrayElement(THERAPY_TOPICS),
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
    totalConversations++;

    const messageCount = faker.number.int({ min: 2, max: 6 });
    const otherUserId = faker.helpers.arrayElement(
      userIds.filter((id) => id !== userId)
    );

    for (let j = 0; j < messageCount; j++) {
      const isPatient = j % 2 === 0;
      const msgCreatedAt = new Date(createdAt);
      msgCreatedAt.setMinutes(
        msgCreatedAt.getMinutes() + j * faker.number.int({ min: 10, max: 120 })
      );

      await db.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId,
        userId: isPatient ? userId : otherUserId,
        role: isPatient ? "user" : "assistant",
        content: isPatient
          ? faker.helpers.arrayElement(PATIENT_MESSAGES)
          : faker.helpers.arrayElement(DOCTOR_MESSAGES),
        createdAt: msgCreatedAt.toISOString(),
      });
      totalMessages++;
    }

    await db
      .update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, conversationId));
  }

  return {
    conversations: totalConversations,
    messages: totalMessages,
  };
}
