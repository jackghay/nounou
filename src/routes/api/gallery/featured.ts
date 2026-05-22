import { createFileRoute } from "@tanstack/react-router";
import { readPublicGallery } from "@/lib/server/public-data";
import { jsonError, jsonItems, withSourceHeader } from "@/lib/server/responses";

export const Route = createFileRoute("/api/gallery/featured")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await readPublicGallery({ featured: true });
          return withSourceHeader(jsonItems(result.items), result.source);
        } catch {
          return jsonError("Failed to load featured items", "FEATURED_FETCH_FAILED", 500);
        }
      },
    },
  },
});
