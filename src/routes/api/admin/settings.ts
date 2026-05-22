import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { requireAdminAuth } from "@/lib/server/auth";
import { adminGetSettings, adminUpdateSettings } from "@/lib/server/admin-data";
import { getDbOrNull } from "@/lib/server/db";
import { getFallbackSiteSettings } from "@/lib/server/fallback";
import { jsonData } from "@/lib/server/responses";
import { jsonError } from "@/lib/server/responses";
import { adminPatchSettingsSchema, parseJsonBody } from "@/lib/server/validation";

export const Route = createFileRoute("/api/admin/settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        const db = getDbOrNull();
        if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

        const settings = await adminGetSettings(db);
        return jsonData(settings ?? getFallbackSiteSettings());
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if (!auth.ok) return auth.response;

        try {
          const db = getDbOrNull();
          if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

          const patch = await parseJsonBody(request, adminPatchSettingsSchema);
          const updated = await adminUpdateSettings(db, patch);
          return jsonData(updated);
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Invalid settings payload", "VALIDATION_ERROR", 400);
          }
          return jsonError("Failed to update settings", "SETTINGS_UPDATE_FAILED", 500);
        }
      },
    },
  },
});
