import { getBindings, getDbOrNull } from "@/lib/server/db";
import { jsonError } from "@/lib/server/responses";
import { verifyJwt } from "@/lib/server/security";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: string;
}

export type AdminAuthResult =
  | { ok: true; admin: AuthenticatedAdmin }
  | { ok: false; response: Response };

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

function getCookieValue(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  const parts = raw.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k !== name) continue;
    return rest.join("=") || null;
  }
  return null;
}

export function buildAuthCookie(token: string, maxAgeSeconds: number): string {
  const secure = typeof location === "undefined" ? "" : location.protocol === "https:" ? "; Secure" : "";
  return `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function buildClearAuthCookie(): string {
  return "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export async function requireAdminAuth(request: Request): Promise<AdminAuthResult> {
  const token = getBearerToken(request) ?? getCookieValue(request, "admin_session");
  if (!token) {
    return {
      ok: false,
      response: jsonError("Unauthorized", "UNAUTHORIZED", 401),
    };
  }

  const { ADMIN_JWT_SECRET } = getBindings();
  if (!ADMIN_JWT_SECRET) {
    return {
      ok: false,
      response: jsonError(
        "Admin authentication is not configured yet.",
        "ADMIN_AUTH_NOT_CONFIGURED",
        501,
      ),
    };
  }

  const payload = await verifyJwt(token, ADMIN_JWT_SECRET);
  if (!payload) {
    return {
      ok: false,
      response: jsonError("Invalid or expired token", "UNAUTHORIZED", 401),
    };
  }

  const db = getDbOrNull();
  if (!db) {
    return {
      ok: false,
      response: jsonError("Database is unavailable", "DB_UNAVAILABLE", 503),
    };
  }

  const user = await db
    .prepare(
      `
      SELECT id, email, role, is_active
      FROM admin_users
      WHERE id = ?
      LIMIT 1
    `,
    )
    .bind(payload.sub)
    .first<{ id: string; email: string; role: string; is_active: number }>();

  if (!user || !user.is_active) {
    return {
      ok: false,
      response: jsonError("Unauthorized", "UNAUTHORIZED", 401),
    };
  }

  return {
    ok: true,
    admin: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}
