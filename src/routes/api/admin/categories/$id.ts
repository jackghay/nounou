import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { requireAdminAuth } from "@/lib/server/auth";
import { adminDeleteCategory, adminUpdateCategory } from "@/lib/server/admin-data";
import { getDbOrNull } from "@/lib/server/db";
import { jsonError } from "@/lib/server/responses";
import { adminPatchCategorySchema, parseJsonBody } from "@/lib/server/validation";

export const Route = createFileRoute("/api/admin/categories/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        try {
          const db = getDbOrNull();
          if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

          const patch = await parseJsonBody(request, adminPatchCategorySchema);
          const updated = await adminUpdateCategory(db, params.id, patch);
          if (!updated) return jsonError("Category not found", "NOT_FOUND", 404);
          return Response.json({ data: updated });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Invalid category payload", "VALIDATION_ERROR", 400);
          }
          if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
            return jsonError("Category slug already exists", "CATEGORY_SLUG_EXISTS", 409);
          }
          return jsonError("Failed to update category", "CATEGORY_UPDATE_FAILED", 500);
        }
      },
      DELETE: async ({ request, params }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        const db = getDbOrNull();
        if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

        const deleted = await adminDeleteCategory(db, params.id);
        if (!deleted.ok && deleted.reason === "HAS_ITEMS") {
          return jsonError("Category has gallery items", "CATEGORY_HAS_ITEMS", 409);
        }
        if (!deleted.ok && deleted.reason === "NOT_FOUND") {
          return jsonError("Category not found", "NOT_FOUND", 404);
        }
        return Response.json({ data: { ok: true } });
      },
    },
  },
});
