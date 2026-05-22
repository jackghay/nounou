import { useCallback } from "react";
import type { CategoryDto, GalleryItemDto, SiteSettingsDto } from "@/lib/api/types";
import { publicApiClient, type GalleryQueryParams } from "@/lib/api/client";
import {
  categories as staticCategories,
  featuredItems as staticFeaturedItems,
  galleryItems as staticGalleryItems,
  whatsappLink,
} from "@/components/gallery/galleryData";

const FALLBACK_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function staticToCategoryDto(): CategoryDto[] {
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

function staticToGalleryDto(): GalleryItemDto[] {
  const featuredIds = new Set(staticFeaturedItems.map((item) => item.id));
  return staticGalleryItems.map((item) => ({
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
  }));
}

function staticToSettingsDto(): SiteSettingsDto {
  return {
    id: "default",
    whatsappNumber: null,
    whatsappMessage: null,
    heroTitle: "معرض أعمالنا",
    heroSubtitle: "كراسات ودفاتر وكتب تعليمية مخصصة بلمسة فنية راقية",
    metaTitle: "معرض أعمالنا — كراسات وكتب تعليمية مخصصة",
    metaDescription: `رابط التواصل: ${whatsappLink}`,
    createdAt: FALLBACK_TIMESTAMP,
    updatedAt: FALLBACK_TIMESTAMP,
  };
}

export function usePublicGalleryApi() {
  const getCategories = useCallback(async (): Promise<CategoryDto[]> => {
    try {
      return await publicApiClient.getCategories();
    } catch {
      return staticToCategoryDto();
    }
  }, []);

  const getGallery = useCallback(async (params?: GalleryQueryParams): Promise<GalleryItemDto[]> => {
    try {
      return await publicApiClient.getGallery(params);
    } catch {
      const fallback = staticToGalleryDto();
      if (!params?.categoryId) return fallback;
      return fallback.filter((item) => item.categoryId === params.categoryId);
    }
  }, []);

  const getFeaturedGallery = useCallback(async (): Promise<GalleryItemDto[]> => {
    try {
      return await publicApiClient.getFeaturedGallery();
    } catch {
      return staticToGalleryDto().filter((item) => item.isFeatured);
    }
  }, []);

  const getSettings = useCallback(async (): Promise<SiteSettingsDto> => {
    try {
      return await publicApiClient.getSettings();
    } catch {
      return staticToSettingsDto();
    }
  }, []);

  return {
    getCategories,
    getGallery,
    getFeaturedGallery,
    getSettings,
  };
}
