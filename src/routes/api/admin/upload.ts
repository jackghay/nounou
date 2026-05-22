import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAuth } from "@/lib/server/auth";
import { getBindings, getR2BucketOrNull } from "@/lib/server/db";
import { jsonData, jsonError } from "@/lib/server/responses";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
};

function buildObjectKey(file: File): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = EXTENSION_BY_MIME[file.type.toLowerCase()] ?? "bin";
  return `gallery/${year}/${month}/${crypto.randomUUID()}.${extension}`;
}

function buildPublicUrl(base: string, key: string): string {
  const cleanBase = base.replace(/\/+$/, "");
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${cleanBase}/${encodedKey}`;
}

export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAdminAuth(request);
          if (!auth.ok) return auth.response;

          const bucket = getR2BucketOrNull();
          if (!bucket) {
            return jsonError("Image storage is unavailable", "R2_UNAVAILABLE", 503);
          }

          const { R2_PUBLIC_BASE_URL } = getBindings();
          if (!R2_PUBLIC_BASE_URL) {
            return jsonError(
              "Public image base URL is not configured",
              "R2_PUBLIC_BASE_URL_NOT_CONFIGURED",
              500,
            );
          }

          const formData = await request.formData();
          const filePart = formData.get("file");
          if (!(filePart instanceof File)) {
            return jsonError("Image file is required", "FILE_REQUIRED", 400);
          }

          const mimeType = filePart.type.toLowerCase();
          if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
            return jsonError("Unsupported image type", "INVALID_FILE_TYPE", 400);
          }

          if (filePart.size <= 0) {
            return jsonError("Image file is empty", "EMPTY_FILE", 400);
          }

          if (filePart.size > MAX_UPLOAD_SIZE_BYTES) {
            return jsonError("Image file exceeds 10MB limit", "FILE_TOO_LARGE", 400);
          }

          const key = buildObjectKey(filePart);
          await bucket.put(key, filePart, {
            httpMetadata: {
              contentType: mimeType,
              cacheControl: "public, max-age=31536000, immutable",
            },
          });

          const url = buildPublicUrl(R2_PUBLIC_BASE_URL, key);
          return jsonData(
            {
              key,
              url,
              size: filePart.size,
              contentType: mimeType,
            },
            { status: 201 },
          );
        } catch {
          return jsonError("Failed to upload image", "UPLOAD_FAILED", 500);
        }
      },
    },
  },
});
