import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { requireAdminAuth } from "@/lib/server/auth";
import { adminCreateGalleryItem, adminListGallery } from "@/lib/server/admin-data";
import { getDbOrNull } from "@/lib/server/db";
import { jsonItems } from "@/lib/server/responses";
import { jsonError } from "@/lib/server/responses";
import { adminCreateGallerySchema, parseJsonBody } from "@/lib/server/validation";

export const Route = createFileRoute("/api/admin/gallery")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        const db = getDbOrNull();
        if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

        const items = await adminListGallery(db);
        return jsonItems(items);
      },
      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        try {
          const db = getDbOrNull();
          if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

          const body = await parseJsonBody(request, adminCreateGallerySchema);
          const created = await adminCreateGalleryItem(db, body);
          return Response.json({ data: created }, { status: 201 });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Invalid gallery payload", "VALIDATION_ERROR", 400);
          }
          return jsonError("Failed to create gallery item", "GALLERY_CREATE_FAILED", 500);
        }
      },
    },
  },
});
