import { z } from "zod";

export const galleryQuerySchema = z.object({
  categoryId: z.string().trim().min(1).optional(),
  featured: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const adminCreateCategorySchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-\u0600-\u06ff]+$/),
  labelAr: z.string().trim().min(1).max(160),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const adminPatchCategorySchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-\u0600-\u06ff]+$/).optional(),
  labelAr: z.string().trim().min(1).max(160).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const galleryStatusSchema = z.enum(["draft", "published"]);

export const adminCreateGallerySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  categoryId: z.string().trim().min(1),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  altTextAr: z.string().trim().max(300).optional().nullable(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  status: galleryStatusSchema.optional(),
});

export const adminPatchGallerySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  categoryId: z.string().trim().min(1).optional(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  altTextAr: z.string().trim().max(300).optional().nullable(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  status: galleryStatusSchema.optional(),
});

export const adminPatchSettingsSchema = z.object({
  whatsappNumber: z.string().trim().max(30).optional().nullable(),
  whatsappMessage: z.string().trim().max(500).optional().nullable(),
  heroTitle: z.string().trim().max(200).optional().nullable(),
  heroSubtitle: z.string().trim().max(300).optional().nullable(),
  metaTitle: z.string().trim().max(200).optional().nullable(),
  metaDescription: z.string().trim().max(500).optional().nullable(),
});

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const raw = await request.json();
  return schema.parse(raw);
}
