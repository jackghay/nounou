import type {
  ApiDataResponse,
  ApiErrorResponse,
  ApiItemsResponse,
  CategoryDto,
  GalleryItemDto,
  SiteSettingsDto,
} from "@/lib/api/types";

function isErrorPayload(payload: unknown): payload is ApiErrorResponse {
  return payload !== null && typeof payload === "object" && "error" in payload;
}
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestItems<T>(url: string): Promise<T[]> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isErrorPayload(payload)) {
      throw new Error(payload.error.message);
    }
    throw new Error(`Request failed (${response.status})`);
  }

  const typed = payload as ApiItemsResponse<T>;
  return Array.isArray(typed.items) ? typed.items : [];
}

async function requestData<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isErrorPayload(payload)) {
      throw new Error(payload.error.message);
    }
    throw new Error(`Request failed (${response.status})`);
  }

  const typed = payload as ApiDataResponse<T>;
  return typed.data;
}

export interface GalleryQueryParams {
  categoryId?: string;
  featured?: boolean;
}

function buildGalleryUrl(params?: GalleryQueryParams): string {
  const url = new URL("/api/gallery", "http://local");
  if (!params) return url.pathname;
  if (params.categoryId) url.searchParams.set("categoryId", params.categoryId);
  if (typeof params.featured === "boolean") {
    url.searchParams.set("featured", String(params.featured));
  }
  return `${url.pathname}${url.search}`;
}

export const publicApiClient = {
  getCategories: () => requestItems<CategoryDto>("/api/categories"),
  getGallery: (params?: GalleryQueryParams) => requestItems<GalleryItemDto>(buildGalleryUrl(params)),
  getFeaturedGallery: () => requestItems<GalleryItemDto>("/api/gallery/featured"),
  getSettings: () => requestData<SiteSettingsDto>("/api/settings"),
};
