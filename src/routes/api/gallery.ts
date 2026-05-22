import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { readPublicGallery } from "@/lib/server/public-data";
import { jsonError, jsonItems, withSourceHeader } from "@/lib/server/responses";
import { galleryQuerySchema } from "@/lib/server/validation";

export const Route = createFileRoute("/api/gallery")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const parsed = galleryQuerySchema.parse({
            categoryId: url.searchParams.get("categoryId") ?? undefined,
            featured: url.searchParams.get("featured") ?? undefined,
          });

          const result = await readPublicGallery({
            categoryId: parsed.categoryId,
            featured: parsed.featured,
          });

          return withSourceHeader(jsonItems(result.items), result.source);
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Invalid query parameters", "VALIDATION_ERROR", 400);
          }
          return jsonError("Failed to load gallery items", "GALLERY_FETCH_FAILED", 500);
        }
      },
    },
  },
});
