import {
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
  categories as staticCategories,
  featuredItems as staticFeaturedItems,
  galleryItems as staticGalleryItems,
} from "@/components/gallery/galleryData";
import type { CategoryDto, GalleryItemDto, SiteSettingsDto } from "@/lib/api/types";

const FALLBACK_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function mapGalleryItem(item: (typeof staticGalleryItems)[number], featuredIds: Set<number>): GalleryItemDto {
  return {
    id: String(item.id),
    title: item.title,
    description: null,
    categoryId: item.category,
    imageUrl: item.src,
    thumbnailUrl: null,
    altTextAr: item.title,
    isFeatured: featuredIds.has(item.id),
    sortOrder: item.id,
    status: "published",
    publishedAt: FALLBACK_TIMESTAMP,
    createdAt: FALLBACK_TIMESTAMP,
    updatedAt: FALLBACK_TIMESTAMP,
  };
}

export function getFallbackCategories(): CategoryDto[] {
  return staticCategories
    .filter((category) => category.id !== "all")
    .map((category, index) => ({
      id: category.id,
      slug: category.id,
      labelAr: category.label,
      sortOrder: (index + 1) * 10,
      isActive: true,
    }));
}

export function getFallbackGalleryItems(): GalleryItemDto[] {
  const featuredIds = new Set(staticFeaturedItems.map((item) => item.id));
  return staticGalleryItems.map((item) => mapGalleryItem(item, featuredIds));
}

export function getFallbackFeaturedGalleryItems(): GalleryItemDto[] {
  const fallbackItems = getFallbackGalleryItems();
  return fallbackItems.filter((item) => item.isFeatured);
}

export function getFallbackSiteSettings(): SiteSettingsDto {
  return {
    id: "default",
    whatsappNumber: WHATSAPP_NUMBER,
    whatsappMessage: WHATSAPP_MESSAGE,
    heroTitle: "معرض أعمالنا",
    heroSubtitle: "كراسات ودفاتر وكتب تعليمية مخصصة بلمسة فنية راقية",
    metaTitle: "معرض أعمالنا — كراسات وكتب تعليمية مخصصة",
    metaDescription:
      "معرض صور لأعمالنا: كراسات، دفاتر يومية، كتب تعليمية، أنشطة التحضيري وأغلفة مخصصة بلمسة فنية راقية.",
    createdAt: FALLBACK_TIMESTAMP,
    updatedAt: FALLBACK_TIMESTAMP,
  };
}
