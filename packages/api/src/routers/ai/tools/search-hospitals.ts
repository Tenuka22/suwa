import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";
import { searchHospitals as findHospitals } from "../data/hospitals-data";

export function createSearchHospitalsTool(_context: ClerkRequestContext) {
  return tool(
    async ({ query }: { query: string }) => {
      const results = findHospitals(query);
      return JSON.stringify(
        results.slice(0, 10).map((h) => ({
          name: h.name,
          address: h.address,
          rating: h.rating,
          category: h.category,
          phone: h.phone,
          latitude: h.latitude,
          longitude: h.longitude,
        }))
      );
    },
    {
      name: "search_hospitals",
      description:
        "Find nearby hospitals, medical centers, and clinics by name, category, or location",
      schema: z.object({
        query: z
          .string()
          .describe("Hospital name, category, or location to search for"),
      }),
    }
  );
}
