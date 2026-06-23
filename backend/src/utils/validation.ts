import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const categorySchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  labelAr: z.string().min(1, "Arabic label is required"),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = categorySchema.partial();

export const galleryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  categoryId: z.number(),
  imageUrl: z.string().url("Invalid image URL"),
  thumbnailUrl: z.string().optional().nullable(),
  cloudinaryPublicId: z.string().optional().nullable(),
  altTextAr: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  status: z.enum(["draft", "published"]).optional().default("published"),
});

export const updateGalleryItemSchema = galleryItemSchema.partial();

export const siteSettingsSchema = z.object({
  whatsappNumber: z.string().optional().nullable(),
  whatsappMessage: z.string().optional().nullable(),
  heroTitle: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  cardStyle: z.string().optional().nullable(),
  bgSparkles: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
});

