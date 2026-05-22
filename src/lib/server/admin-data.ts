import type { CategoryDto, GalleryItemDto, SiteSettingsDto } from "@/lib/api/types";
import type { D1DatabaseLike } from "@/lib/server/db";

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

interface SettingsRow {
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

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function hasOwn<T extends object, K extends PropertyKey>(
  object: T,
  key: K,
): object is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(object, key);
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

function mapGallery(row: GalleryRow): GalleryItemDto {
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

function mapSettings(row: SettingsRow): SiteSettingsDto {
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

export async function adminListCategories(db: D1DatabaseLike): Promise<CategoryDto[]> {
  const result = await db
    .prepare(
      `
      SELECT id, slug, label_ar, sort_order, is_active
      FROM categories
      ORDER BY sort_order ASC, created_at ASC
    `,
    )
    .all<CategoryRow>();

  return result.results.map(mapCategory);
}

export async function adminCreateCategory(
  db: D1DatabaseLike,
  input: {
    slug: string;
    labelAr: string;
    sortOrder?: number;
    isActive?: boolean;
  },
): Promise<CategoryDto> {
  const id = newId("cat");
  const now = nowIso();
  const sortOrder = input.sortOrder ?? 0;
  const isActive = input.isActive ?? true;

  await db
    .prepare(
      `
      INSERT INTO categories (
        id,
        slug,
        label_ar,
        sort_order,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .bind(id, input.slug, input.labelAr, sortOrder, isActive ? 1 : 0, now, now)
    .run();

  return {
    id,
    slug: input.slug,
    labelAr: input.labelAr,
    sortOrder,
    isActive,
  };
}

export async function adminUpdateCategory(
  db: D1DatabaseLike,
  id: string,
  patch: Partial<{
    slug: string;
    labelAr: string;
    sortOrder: number;
    isActive: boolean;
  }>,
): Promise<CategoryDto | null> {
  const row = await db
    .prepare(
      `
      SELECT id, slug, label_ar, sort_order, is_active
      FROM categories
      WHERE id = ?
      LIMIT 1
    `,
    )
    .bind(id)
    .first<CategoryRow>();

  if (!row) return null;

  const next = {
    slug: patch.slug ?? row.slug,
    labelAr: patch.labelAr ?? row.label_ar,
    sortOrder: patch.sortOrder ?? row.sort_order,
    isActive: patch.isActive ?? Boolean(row.is_active),
  };

  const updatedAt = nowIso();

  await db
    .prepare(
      `
      UPDATE categories
      SET
        slug = ?,
        label_ar = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `,
    )
    .bind(next.slug, next.labelAr, next.sortOrder, next.isActive ? 1 : 0, updatedAt, id)
    .run();

  return {
    id,
    ...next,
  };
}

export async function adminDeleteCategory(
  db: D1DatabaseLike,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: "HAS_ITEMS" | "NOT_FOUND" }> {
  const countRow = await db
    .prepare("SELECT COUNT(*) as count FROM gallery_items WHERE category_id = ?")
    .bind(id)
    .first<{ count: number }>();

  if ((countRow?.count ?? 0) > 0) {
    return { ok: false, reason: "HAS_ITEMS" };
  }

  const exists = await db
    .prepare("SELECT id FROM categories WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string }>();

  if (!exists) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();

  return { ok: true };
}

export async function adminListGallery(db: D1DatabaseLike): Promise<GalleryItemDto[]> {
  const result = await db
    .prepare(
      `
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
      ORDER BY sort_order ASC, created_at DESC
    `,
    )
    .all<GalleryRow>();

  return result.results.map(mapGallery);
}

export async function adminCreateGalleryItem(
  db: D1DatabaseLike,
  input: {
    title: string;
    description?: string | null;
    categoryId: string;
    imageUrl: string;
    thumbnailUrl?: string | null;
    altTextAr?: string | null;
    isFeatured?: boolean;
    sortOrder?: number;
    status?: "draft" | "published";
  },
): Promise<GalleryItemDto> {
  const id = newId("img");
  const now = nowIso();
  const status = input.status ?? "published";
  const publishedAt = status === "published" ? now : null;
  const sortOrder = input.sortOrder ?? 0;
  const isFeatured = input.isFeatured ?? false;

  await db
    .prepare(
      `
      INSERT INTO gallery_items (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .bind(
      id,
      input.title,
      input.description ?? null,
      input.categoryId,
      input.imageUrl,
      input.thumbnailUrl ?? null,
      input.altTextAr ?? null,
      isFeatured ? 1 : 0,
      sortOrder,
      status,
      publishedAt,
      now,
      now,
    )
    .run();

  return {
    id,
    title: input.title,
    description: input.description ?? null,
    categoryId: input.categoryId,
    imageUrl: input.imageUrl,
    thumbnailUrl: input.thumbnailUrl ?? null,
    altTextAr: input.altTextAr ?? null,
    isFeatured,
    sortOrder,
    status,
    publishedAt,
    createdAt: now,
    updatedAt: now,
  };
}

export async function adminUpdateGalleryItem(
  db: D1DatabaseLike,
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    categoryId: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    altTextAr: string | null;
    isFeatured: boolean;
    sortOrder: number;
    status: "draft" | "published";
  }>,
): Promise<GalleryItemDto | null> {
  const row = await db
    .prepare(
      `
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
      WHERE id = ?
      LIMIT 1
    `,
    )
    .bind(id)
    .first<GalleryRow>();

  if (!row) return null;

  const nextStatus = patch.status ?? (row.status === "draft" ? "draft" : "published");

  const nextPublishedAt =
    nextStatus === "published" ? row.published_at ?? nowIso() : null;

  const updatedAt = nowIso();

  const next = {
    title: patch.title ?? row.title,
    description: hasOwn(patch, "description")
      ? patch.description ?? null
      : row.description,
    categoryId: patch.categoryId ?? row.category_id,
    imageUrl: patch.imageUrl ?? row.image_url,
    thumbnailUrl: hasOwn(patch, "thumbnailUrl")
      ? patch.thumbnailUrl ?? null
      : row.thumbnail_url,
    altTextAr: hasOwn(patch, "altTextAr")
      ? patch.altTextAr ?? null
      : row.alt_text_ar,
    isFeatured: patch.isFeatured ?? Boolean(row.is_featured),
    sortOrder: patch.sortOrder ?? row.sort_order,
    status: nextStatus,
    publishedAt: nextPublishedAt,
  };

  await db
    .prepare(
      `
      UPDATE gallery_items
      SET
        title = ?,
        description = ?,
        category_id = ?,
        image_url = ?,
        thumbnail_url = ?,
        alt_text_ar = ?,
        is_featured = ?,
        sort_order = ?,
        status = ?,
        published_at = ?,
        updated_at = ?
      WHERE id = ?
    `,
    )
    .bind(
      next.title,
      next.description,
      next.categoryId,
      next.imageUrl,
      next.thumbnailUrl,
      next.altTextAr,
      next.isFeatured ? 1 : 0,
      next.sortOrder,
      next.status,
      next.publishedAt,
      updatedAt,
      id,
    )
    .run();

  return {
    id,
    title: next.title,
    description: next.description,
    categoryId: next.categoryId,
    imageUrl: next.imageUrl,
    thumbnailUrl: next.thumbnailUrl,
    altTextAr: next.altTextAr,
    isFeatured: next.isFeatured,
    sortOrder: next.sortOrder,
    status: next.status,
    publishedAt: next.publishedAt,
    createdAt: row.created_at,
    updatedAt,
  };
}

export async function adminDeleteGalleryItem(
  db: D1DatabaseLike,
  id: string,
): Promise<{ ok: true } | { ok: false }> {
  const exists = await db
    .prepare("SELECT id FROM gallery_items WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string }>();

  if (!exists) return { ok: false };

  await db.prepare("DELETE FROM gallery_items WHERE id = ?").bind(id).run();

  return { ok: true };
}

export async function adminGetSettings(db: D1DatabaseLike): Promise<SiteSettingsDto | null> {
  const row = await db
    .prepare(
      `
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
    `,
    )
    .first<SettingsRow>();

  return row ? mapSettings(row) : null;
}

export async function adminUpdateSettings(
  db: D1DatabaseLike,
  patch: Partial<{
    whatsappNumber: string | null;
    whatsappMessage: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  }>,
): Promise<SiteSettingsDto> {
  const existing = await adminGetSettings(db);
  const now = nowIso();
  const id = existing?.id ?? "default";

  const next = {
    whatsappNumber: hasOwn(patch, "whatsappNumber")
      ? patch.whatsappNumber ?? null
      : existing?.whatsappNumber ?? null,
    whatsappMessage: hasOwn(patch, "whatsappMessage")
      ? patch.whatsappMessage ?? null
      : existing?.whatsappMessage ?? null,
    heroTitle: hasOwn(patch, "heroTitle")
      ? patch.heroTitle ?? null
      : existing?.heroTitle ?? null,
    heroSubtitle: hasOwn(patch, "heroSubtitle")
      ? patch.heroSubtitle ?? null
      : existing?.heroSubtitle ?? null,
    metaTitle: hasOwn(patch, "metaTitle")
      ? patch.metaTitle ?? null
      : existing?.metaTitle ?? null,
    metaDescription: hasOwn(patch, "metaDescription")
      ? patch.metaDescription ?? null
      : existing?.metaDescription ?? null,
  };

  await db
    .prepare(
      `
      INSERT INTO site_settings (
        id,
        whatsapp_number,
        whatsapp_message,
        hero_title,
        hero_subtitle,
        meta_title,
        meta_description,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        whatsapp_number = excluded.whatsapp_number,
        whatsapp_message = excluded.whatsapp_message,
        hero_title = excluded.hero_title,
        hero_subtitle = excluded.hero_subtitle,
        meta_title = excluded.meta_title,
        meta_description = excluded.meta_description,
        updated_at = excluded.updated_at
    `,
    )
    .bind(
      id,
      next.whatsappNumber,
      next.whatsappMessage,
      next.heroTitle,
      next.heroSubtitle,
      next.metaTitle,
      next.metaDescription,
      existing?.createdAt ?? now,
      now,
    )
    .run();

  return {
    id,
    ...next,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}