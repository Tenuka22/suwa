import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import { conversations, messages } from "@suwa/db";

export interface ChatSeedResult {
  conversations: number;
  messages: number;
}

const WELLNESS_QUESTIONS = [
  "I've been feeling anxious lately. What techniques can help?",
  "Can you explain the connection between sleep and mental health?",
  "How do I know if I need therapy or just self-care?",
  "What are the signs of burnout vs. regular stress?",
  "Is meditation actually effective for anxiety?",
  "How long does it typically take to see results from therapy?",
  "What should I expect in my first consultation?",
  "Can lifestyle changes really improve depression symptoms?",
  "What is cognitive behavioral therapy and how does it work?",
  "How do I support a friend who is struggling mentally?",
];

export async function seedChats(
  db: ReturnType<typeof createDb>,
  doctorIds: string[],
  patientIds: string[]
): Promise<ChatSeedResult> {
  if (doctorIds.length === 0 || patientIds.length === 0) {
    return { conversations: 0, messages: 0 };
  }

  const existingConversations = await db
    .select({ id: conversations.id })
    .from(conversations);

  if (existingConversations.length > 0) {
    // Nuke and rebuild to ensure messages exist for all active doctor-patient pairs
    await db.delete(messages);
    await db.delete(conversations);
  }

  let convCount = 0;
  let msgCount = 0;

  // Create conversations between doctors and patients who have sessions
  for (const doctorId of doctorIds) {
    for (const patientId of patientIds) {
      // 60% chance of having a chat
      if (!faker.datatype.boolean(0.6)) {
        continue;
      }

      const convId = crypto.randomUUID();
      const now = new Date();
      const createdAt = faker.date.recent({ days: 30 }).toISOString();

      await db.insert(conversations).values({
        id: convId,
        userId: patientId,
        title:
          faker.helpers.arrayElement(WELLNESS_QUESTIONS).slice(0, 47) + "...",
        createdAt,
        updatedAt: now.toISOString(),
      });
      convCount++;

      // 3-8 messages per conversation
      const numMessages = faker.number.int({ min: 3, max: 8 });
      let messageTime = new Date(createdAt);

      for (let m = 0; m < numMessages; m++) {
        const isUser = m % 2 === 0;
        const role = isUser ? "user" : "assistant";
        const content = isUser
          ? faker.helpers.arrayElement(WELLNESS_QUESTIONS)
          : faker.lorem.sentences(faker.number.int({ min: 2, max: 5 }));

        messageTime = new Date(messageTime);
        messageTime.setMinutes(messageTime.getMinutes() + 10);

        await db.insert(messages).values({
          id: crypto.randomUUID(),
          conversationId: convId,
          userId: isUser ? patientId : doctorId,
          role,
          content,
          createdAt: messageTime.toISOString(),
        });
        msgCount++;
      }
    }
  }

  return { conversations: convCount, messages: msgCount };
}
