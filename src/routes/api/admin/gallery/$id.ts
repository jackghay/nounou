import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { requireAdminAuth } from "@/lib/server/auth";
import { adminDeleteGalleryItem, adminUpdateGalleryItem } from "@/lib/server/admin-data";
import { getDbOrNull } from "@/lib/server/db";
import { jsonError } from "@/lib/server/responses";
import { adminPatchGallerySchema, parseJsonBody } from "@/lib/server/validation";

export const Route = createFileRoute("/api/admin/gallery/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        try {
          const db = getDbOrNull();
          if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

          const patch = await parseJsonBody(request, adminPatchGallerySchema);
          const updated = await adminUpdateGalleryItem(db, params.id, patch);
          if (!updated) return jsonError("Gallery item not found", "NOT_FOUND", 404);
          return Response.json({ data: updated });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Invalid gallery payload", "VALIDATION_ERROR", 400);
          }
          return jsonError("Failed to update gallery item", "GALLERY_UPDATE_FAILED", 500);
        }
      },
      DELETE: async ({ request, params }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        const db = getDbOrNull();
        if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

        const deleted = await adminDeleteGalleryItem(db, params.id);
        if (!deleted.ok) return jsonError("Gallery item not found", "NOT_FOUND", 404);
        return Response.json({ data: { ok: true } });
      },
    },
  },
});
