export interface ApiErrorPayload {
  message: string;
  code: string;
}

export interface ApiDataResponse<T> {
  data: T;
}

export interface ApiItemsResponse<T> {
  items: T[];
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiDataResponse<T> | ApiErrorResponse;
export type ApiListResponse<T> = ApiItemsResponse<T> | ApiErrorResponse;

export type GalleryItemStatus = "draft" | "published";

export interface CategoryDto {
  id: string;
  slug: string;
  labelAr: string;
  sortOrder: number;
  isActive: boolean;
}

export interface GalleryItemDto {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  altTextAr: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: GalleryItemStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettingsDto {
  id: string;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
