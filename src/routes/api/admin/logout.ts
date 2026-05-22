import { createFileRoute } from "@tanstack/react-router";
import { buildClearAuthCookie } from "@/lib/server/auth";
import { jsonData } from "@/lib/server/responses";

export const Route = createFileRoute("/api/admin/logout")({
  server: {
    handlers: {
      POST: async () => {
        const response = jsonData({ ok: true });
        response.headers.append("Set-Cookie", buildClearAuthCookie());
        return response;
      },
    },
  },
});
