import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { requireAdminAuth } from "@/lib/server/auth";
import { adminCreateCategory, adminListCategories } from "@/lib/server/admin-data";
import { getDbOrNull } from "@/lib/server/db";
import { jsonItems } from "@/lib/server/responses";
import { jsonError } from "@/lib/server/responses";
import { adminCreateCategorySchema, parseJsonBody } from "@/lib/server/validation";

export const Route = createFileRoute("/api/admin/categories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        const db = getDbOrNull();
        if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

        const categories = await adminListCategories(db);
        return jsonItems(categories);
      },
      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        try {
          const db = getDbOrNull();
          if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

          const body = await parseJsonBody(request, adminCreateCategorySchema);
          const created = await adminCreateCategory(db, body);
          return Response.json({ data: created }, { status: 201 });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Invalid category payload", "VALIDATION_ERROR", 400);
          }
          if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
            return jsonError("Category slug already exists", "CATEGORY_SLUG_EXISTS", 409);
          }
          return jsonError("Failed to create category", "CATEGORY_CREATE_FAILED", 500);
        }
      },
    },
  },
});
