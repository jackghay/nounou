import { createFileRoute } from "@tanstack/react-router";
import { readPublicSettings } from "@/lib/server/public-data";
import { jsonData, jsonError, withSourceHeader } from "@/lib/server/responses";

export const Route = createFileRoute("/api/settings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await readPublicSettings();
          return withSourceHeader(jsonData(result.data), result.source);
        } catch {
          return jsonError("Failed to load settings", "SETTINGS_FETCH_FAILED", 500);
        }
      },
    },
  },
});
