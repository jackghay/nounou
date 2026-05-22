import { createFileRoute } from "@tanstack/react-router";
import { readPublicCategories } from "@/lib/server/public-data";
import { jsonError, jsonItems, withSourceHeader } from "@/lib/server/responses";

export const Route = createFileRoute("/api/categories")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await readPublicCategories();
          return withSourceHeader(jsonItems(result.items), result.source);
        } catch {
          return jsonError("Failed to load categories", "CATEGORIES_FETCH_FAILED", 500);
        }
      },
    },
  },
});
