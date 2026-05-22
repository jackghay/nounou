import type { CategoryDto, GalleryItemDto, SiteSettingsDto } from "@/lib/api/types";
import { getDbOrNull } from "@/lib/server/db";
import {
  getFallbackCategories,
  getFallbackFeaturedGalleryItems,
  getFallbackGalleryItems,
  getFallbackSiteSettings,
} from "@/lib/server/fallback";

interface CategoryRow {
  id: string;
  slug: string;
  label_ar: string;
  sort_order: number;
  is_active: number;
}

interface GalleryRow {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  image_url: string;
  thumbnail_url: string | null;
  alt_text_ar: string | null;
  is_featured: number;
  sort_order: number;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SiteSettingsRow {
  id: string;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

function mapCategory(row: CategoryRow): CategoryDto {
  return {
    id: row.id,
    slug: row.slug,
    labelAr: row.label_ar,
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active),
  };
}

function mapGalleryItem(row: GalleryRow): GalleryItemDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    altTextAr: row.alt_text_ar,
    isFeatured: Boolean(row.is_featured),
    sortOrder: row.sort_order,
    status: row.status === "draft" ? "draft" : "published",
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSiteSettings(row: SiteSettingsRow): SiteSettingsDto {
  return {
    id: row.id,
    whatsappNumber: row.whatsapp_number,
    whatsappMessage: row.whatsapp_message,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function readPublicCategories(): Promise<{ source: "db" | "fallback"; items: CategoryDto[] }> {
  const db = getDbOrNull();
  if (!db) {
    return { source: "fallback", items: getFallbackCategories() };
  }

  try {
    const query = `
      SELECT id, slug, label_ar, sort_order, is_active
      FROM categories
      WHERE is_active = 1
      ORDER BY sort_order ASC, created_at ASC
    `;
    const result = await db.prepare(query).all<CategoryRow>();
    if (!result.results.length) {
      return { source: "fallback", items: getFallbackCategories() };
    }
    return { source: "db", items: result.results.map(mapCategory) };
  } catch {
    return { source: "fallback", items: getFallbackCategories() };
  }
}

export interface GalleryFilters {
  categoryId?: string;
  featured?: boolean;
}

export async function readPublicGallery(
  filters: GalleryFilters,
): Promise<{ source: "db" | "fallback"; items: GalleryItemDto[] }> {
  const db = getDbOrNull();
  if (!db) {
    const fallback = filters.featured ? getFallbackFeaturedGalleryItems() : getFallbackGalleryItems();
    const filtered =
      filters.categoryId && filters.categoryId.length > 0
        ? fallback.filter((item) => item.categoryId === filters.categoryId)
        : fallback;
    return { source: "fallback", items: filtered };
  }

  try {
    const clauses: string[] = ["status = 'published'"];
    const bindings: unknown[] = [];

    if (filters.categoryId) {
      clauses.push("category_id = ?");
      bindings.push(filters.categoryId);
    }
    if (typeof filters.featured === "boolean") {
      clauses.push("is_featured = ?");
      bindings.push(filters.featured ? 1 : 0);
    }

    const query = `
      SELECT
        id,
        title,
        description,
        category_id,
        image_url,
        thumbnail_url,
        alt_text_ar,
        is_featured,
        sort_order,
        status,
        published_at,
        created_at,
        updated_at
      FROM gallery_items
      WHERE ${clauses.join(" AND ")}
      ORDER BY sort_order ASC, created_at DESC
    `;

    const result = await db.prepare(query).bind(...bindings).all<GalleryRow>();
    if (!result.results.length) {
      const fallback = filters.featured ? getFallbackFeaturedGalleryItems() : getFallbackGalleryItems();
      const filtered =
        filters.categoryId && filters.categoryId.length > 0
          ? fallback.filter((item) => item.categoryId === filters.categoryId)
          : fallback;
      return { source: "fallback", items: filtered };
    }

    return { source: "db", items: result.results.map(mapGalleryItem) };
  } catch {
    const fallback = filters.featured ? getFallbackFeaturedGalleryItems() : getFallbackGalleryItems();
    const filtered =
      filters.categoryId && filters.categoryId.length > 0
        ? fallback.filter((item) => item.categoryId === filters.categoryId)
        : fallback;
    return { source: "fallback", items: filtered };
  }
}

export async function readPublicSettings(): Promise<{ source: "db" | "fallback"; data: SiteSettingsDto }> {
  const db = getDbOrNull();
  if (!db) {
    return { source: "fallback", data: getFallbackSiteSettings() };
  }

  try {
    const query = `
      SELECT
        id,
        whatsapp_number,
        whatsapp_message,
        hero_title,
        hero_subtitle,
        meta_title,
        meta_description,
        created_at,
        updated_at
      FROM site_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    const row = await db.prepare(query).first<SiteSettingsRow>();
    if (!row) {
      return { source: "fallback", data: getFallbackSiteSettings() };
    }
    return { source: "db", data: mapSiteSettings(row) };
  } catch {
    return { source: "fallback", data: getFallbackSiteSettings() };
  }
}
