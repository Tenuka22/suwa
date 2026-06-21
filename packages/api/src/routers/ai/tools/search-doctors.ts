import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";
import { searchSimilarDoctors } from "../../chat/helpers/embeddings";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "any",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "and",
  "but",
  "or",
  "if",
  "because",
  "about",
  "up",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "me",
  "my",
  "your",
  "you",
  "he",
  "him",
  "his",
  "she",
  "her",
  "it",
  "its",
  "we",
  "our",
  "they",
  "them",
  "their",
  "i",
  "please",
  "help",
  "find",
  "need",
  "want",
  "looking",
  "show",
  "tell",
  "like",
  "get",
  "got",
  "does",
  "done",
  "much",
  "many",
]);

const WORD_SPLIT = /[^a-z0-9]+/;

export function createSearchDoctorsTool(context: ClerkRequestContext) {
  return tool(
    async ({ query }: { query: string }) => {
      const { doctorProfiles } = await import("@suwa/db");
      const { inArray, or, like } = await import("drizzle-orm");

      // Try semantic search first — if it fails (AI down, KV down), fall through to LIKE
      try {
        const doctorIds = await searchSimilarDoctors(query, context, 10);
        if (doctorIds.length > 0) {
          const doctors = await context.db
            .select()
            .from(doctorProfiles)
            .where(inArray(doctorProfiles.userId, doctorIds))
            .limit(10);
          if (doctors.length > 0) {
            return JSON.stringify(
              doctors.map((d) => ({
                id: d.userId,
                name: d.displayName,
                headline: d.headline,
                specialties: d.specialties,
              }))
            );
          }
        }
      } catch {
        // Embedding search failed — fall through to LIKE query
      }

      // Try full query as-is first
      const fullQueryCondition = or(
        like(doctorProfiles.displayName, `%${query}%`),
        like(doctorProfiles.specialties, `%${query}%`),
        like(doctorProfiles.headline, `%${query}%`),
        like(doctorProfiles.bio, `%${query}%`),
        like(doctorProfiles.focusAreas, `%${query}%`),
        like(doctorProfiles.approach, `%${query}%`)
      );

      let doctors = await context.db
        .select()
        .from(doctorProfiles)
        .where(fullQueryCondition)
        .limit(10);

      // If full query found nothing, tokenize into individual words and retry
      if (doctors.length === 0) {
        const tokens = query
          .toLowerCase()
          .split(WORD_SPLIT)
          .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

        if (tokens.length > 0) {
          const tokenConditions = tokens.map((term) =>
            or(
              like(doctorProfiles.displayName, `%${term}%`),
              like(doctorProfiles.specialties, `%${term}%`),
              like(doctorProfiles.headline, `%${term}%`),
              like(doctorProfiles.bio, `%${term}%`),
              like(doctorProfiles.focusAreas, `%${term}%`),
              like(doctorProfiles.approach, `%${term}%`)
            )
          );

          doctors = await context.db
            .select()
            .from(doctorProfiles)
            .where(or(...tokenConditions))
            .limit(10);
        }
      }

      return JSON.stringify(
        doctors.map((d) => ({
          id: d.userId,
          name: d.displayName,
          headline: d.headline,
          specialties: d.specialties,
        }))
      );
    },
    {
      name: "search_doctors",
      description:
        "Search doctors by name, specialty, symptoms, or any health concern",
      schema: z.object({ query: z.string() }),
    }
  );
}
