import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";
import { parseJsonStringArray } from "@suwa/db";

const WORD_SPLIT = /[^a-z0-9]+/;
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
  "doctor",
  "doctors",
  "specialist",
  "specialists",
  "available",
  "availability",
  "care",
  "near",
  "nearby",
]);

export function createListAvailableDoctorsTool(context: ClerkRequestContext) {
  return tool(
    async ({ query }: { query?: string }) => {
      const db: any = await import("@suwa/db");
      const doctorProfiles = db.doctorProfiles;
      const doctorWeeklyAvailability = db.doctorWeeklyAvailability;
      const orm: any = await import("drizzle-orm");
      const { count, desc, eq, inArray } = orm;

      const profiles = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.permanent, true))
        .orderBy(desc(doctorProfiles.createdAt));

      const rawQuery = typeof query === "string" ? query.toLowerCase().trim() : "";
      const searchTerms = rawQuery
        ? rawQuery
            .split(WORD_SPLIT)
            .map((term) => term.trim())
            .filter((term) => term.length >= 3 && !STOP_WORDS.has(term))
        : [];
      const filteredProfiles =
        searchTerms.length > 0
          ? profiles.filter((profile) => {
              const haystack = [
                profile.displayName,
                profile.headline,
                profile.location,
                profile.specialties,
                profile.languages,
                profile.focusAreas,
              ]
                .filter((value): value is string => typeof value === "string")
                .join(" ")
                .toLowerCase();

              return searchTerms.every((term) => haystack.includes(term));
            })
          : profiles;

      const doctorIds = filteredProfiles.map((profile) => profile.userId);
      const availabilityCounts =
        doctorIds.length > 0
          ? await context.db
              .select({
                doctorId: doctorWeeklyAvailability.doctorId,
                value: count(),
              })
              .from(doctorWeeklyAvailability)
              .where(inArray(doctorWeeklyAvailability.doctorId, doctorIds))
              .groupBy(doctorWeeklyAvailability.doctorId)
          : [];

      const availabilityByDoctor = new Map(
        availabilityCounts.map((row: { doctorId: string; value: unknown }) => [
          row.doctorId,
          Number(row.value ?? 0),
        ])
      );

      return JSON.stringify(
        filteredProfiles
          .map((profile) => ({
            id: profile.userId,
            name: profile.displayName,
            headline: profile.headline,
            specialties: parseJsonStringArray(profile.specialties),
            consultationModes: parseJsonStringArray(profile.consultationModes),
            focusAreas: parseJsonStringArray(profile.focusAreas),
            languages: parseJsonStringArray(profile.languages),
            location: profile.location,
            placeName: profile.placeName,
            hasAvailability: (availabilityByDoctor.get(profile.userId) ?? 0) > 0,
          }))
          .filter((doctor) => doctor.hasAvailability)
          .slice(0, 10)
      );
    },
    {
      name: "list_available_doctors",
      description:
        "List doctors with open weekly availability, optionally filtered by name, specialty, or location",
      schema: z.object({ query: z.string().optional() }),
    }
  );
}
