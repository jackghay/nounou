import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { getDbOrNull, getBindings } from "@/lib/server/db";
import { buildAuthCookie } from "@/lib/server/auth";
import { createJwt, verifyPassword } from "@/lib/server/security";
import { jsonData, jsonError } from "@/lib/server/responses";
import { parseJsonBody, adminLoginSchema } from "@/lib/server/validation";

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const db = getDbOrNull();
          if (!db) return jsonError("Database is unavailable", "DB_UNAVAILABLE", 503);

          const { ADMIN_JWT_SECRET } = getBindings();
          if (!ADMIN_JWT_SECRET) {
            return jsonError("Server auth secret is not configured", "ADMIN_AUTH_NOT_CONFIGURED", 500);
          }

          const body = await parseJsonBody(request, adminLoginSchema);
          const user = await db
            .prepare(
              `
              SELECT id, email, password_hash, role, is_active
              FROM admin_users
              WHERE email = ?
              LIMIT 1
            `,
            )
            .bind(body.email.toLowerCase())
            .first<{ id: string; email: string; password_hash: string; role: string; is_active: number }>();

          if (!user || !user.is_active) {
            return jsonError("Invalid credentials", "INVALID_CREDENTIALS", 401);
          }

          const ok = await verifyPassword(body.password, user.password_hash);
          if (!ok) return jsonError("Invalid credentials", "INVALID_CREDENTIALS", 401);

          const now = Math.floor(Date.now() / 1000);
          const maxAge = 60 * 60 * 24 * 7;
          const token = await createJwt(
            {
              sub: user.id,
              email: user.email,
              role: user.role,
              iat: now,
              exp: now + maxAge,
            },
            ADMIN_JWT_SECRET,
          );

          await db
            .prepare("UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?")
            .bind(new Date().toISOString(), new Date().toISOString(), user.id)
            .run();

          const response = jsonData({
            token,
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
          });
          response.headers.append("Set-Cookie", buildAuthCookie(token, maxAge));
          return response;
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Invalid login payload", "VALIDATION_ERROR", 400);
          }
          return jsonError("Invalid request body", "BAD_REQUEST", 400);
        }
      },
    },
  },
});
