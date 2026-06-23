import type { Category, GalleryItem, Settings } from "@/lib/admin/types";

const LS_AUTH_TOKEN = "admin_auth_token_v1";

type ApiErrorResponse = { error: { message: string; code: string } };
type ApiDataResponse<T> = { data: T };
type ApiItemsResponse<T> = { items: T[] };

type CategoryDto = {
  id: string;
  slug: string;
  labelAr: string;
  sortOrder: number;
  isActive: boolean;
};

type GalleryItemDto = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  altTextAr: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
};

type SettingsDto = {
  id: string;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  theme: string | null;
  fontFamily: string | null;
  cardStyle: string | null;
  bgSparkles: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  createdAt: string;
  updatedAt: string;
};

const isBrowser = () => typeof window !== "undefined";

function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LS_AUTH_TOKEN);
}

function setToken(token: string) {
  if (!isBrowser()) return;
  localStorage.setItem(LS_AUTH_TOKEN, token);
}

function clearToken() {
  if (!isBrowser()) return;
  localStorage.removeItem(LS_AUTH_TOKEN);
}

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    slug: dto.slug,
    labelAr: dto.labelAr,
    sortOrder: dto.sortOrder,
    isActive: dto.isActive,
  };
}

function toSettings(dto: SettingsDto): Settings {
  return {
    whatsappNumber: dto.whatsappNumber ?? "",
    whatsappMessage: dto.whatsappMessage ?? "",
    heroTitle: dto.heroTitle ?? "",
    heroSubtitle: dto.heroSubtitle ?? "",
    metaTitle: dto.metaTitle ?? "",
    metaDescription: dto.metaDescription ?? "",
    theme: dto.theme ?? "royal_gold",
    fontFamily: dto.fontFamily ?? "Tajawal",
    cardStyle: dto.cardStyle ?? "medium",
    bgSparkles: dto.bgSparkles ?? "none",
    primaryColor: dto.primaryColor ?? "",
    secondaryColor: dto.secondaryColor ?? "",
    backgroundColor: dto.backgroundColor ?? "",
  };
}

let cachedCategories: Category[] = [];

function toGallery(dto: GalleryItemDto): GalleryItem {
  const categoryName =
    cachedCategories.find((c) => c.id === dto.categoryId)?.labelAr ?? dto.categoryId;
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? undefined,
    categoryId: dto.categoryId,
    categoryName,
    imageUrl: dto.imageUrl,
    thumbnailUrl: dto.thumbnailUrl ?? undefined,
    isFeatured: dto.isFeatured,
    sortOrder: dto.sortOrder,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json()) as T | ApiErrorResponse;
  if (!response.ok) {
    if ("error" in (json as ApiErrorResponse)) {
      throw new Error((json as ApiErrorResponse).error.message);
    }
    throw new Error(`Request failed (${response.status})`);
  }
  return json as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  const isFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!headers.has("Content-Type") && init?.body && !isFormDataBody) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  return parseResponse<T>(response);
}

function slugifyArabicLabel(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\u0600-\u06ff]/g, "");
}

// ---------- Auth ----------
export async function login(email: string, password: string): Promise<boolean> {
  try {
    const payload = await request<ApiDataResponse<{ token: string }>>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!payload.data?.token) return false;
    setToken(payload.data.token);
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    await request<ApiDataResponse<{ ok: boolean }>>("/api/admin/logout", { method: "POST" });
  } catch {
    // no-op: clear local token regardless of server response
  } finally {
    clearToken();
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

// ---------- Categories ----------
export async function fetchCategories(): Promise<Category[]> {
  const payload = await request<ApiItemsResponse<CategoryDto>>("/api/admin/categories");
  cachedCategories = payload.items.map(toCategory);
  return cachedCategories;
}

export async function createCategory(labelAr: string): Promise<Category> {
  const payload = await request<ApiDataResponse<CategoryDto>>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify({
      slug: slugifyArabicLabel(labelAr),
      labelAr: labelAr.trim(),
      isActive: true,
    }),
  });
  const created = toCategory(payload.data);
  cachedCategories = [...cachedCategories, created];
  return created;
}

export async function updateCategory(id: string, labelAr: string): Promise<Category | null> {
  const payload = await request<ApiDataResponse<CategoryDto>>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      labelAr: labelAr.trim(),
      slug: slugifyArabicLabel(labelAr),
    }),
  });
  const updated = toCategory(payload.data);
  cachedCategories = cachedCategories.map((c) => (c.id === id ? updated : c));
  return updated;
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    await request<ApiDataResponse<{ ok: boolean }>>(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    cachedCategories = cachedCategories.filter((c) => c.id !== id);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("has gallery items")) return { ok: false, reason: "has_items" };
    throw error;
  }
}

// ---------- Gallery items ----------
export async function fetchGalleryItems(): Promise<GalleryItem[]> {
  if (!cachedCategories.length) {
    try {
      await fetchCategories();
    } catch {
      // no-op
    }
  }
  const payload = await request<ApiItemsResponse<GalleryItemDto>>("/api/admin/gallery");
  return payload.items.map(toGallery);
}

export async function createGalleryItem(input: {
  title: string;
  categoryId: string;
  imageUrl: string;
  isFeatured: boolean;
}): Promise<GalleryItem> {
  const payload = await request<ApiDataResponse<GalleryItemDto>>("/api/admin/gallery", {
    method: "POST",
    body: JSON.stringify({
      title: input.title || "بدون عنوان",
      categoryId: input.categoryId,
      imageUrl: input.imageUrl,
      isFeatured: input.isFeatured,
      status: "published",
    }),
  });
  return toGallery(payload.data);
}

export async function updateGalleryItem(
  id: string,
  patch: Partial<Pick<GalleryItem, "title" | "categoryId" | "imageUrl" | "isFeatured">>,
): Promise<GalleryItem | null> {
  const payload = await request<ApiDataResponse<GalleryItemDto>>(`/api/admin/gallery/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: patch.title,
      categoryId: patch.categoryId,
      imageUrl: patch.imageUrl,
      isFeatured: patch.isFeatured,
    }),
  });
  return toGallery(payload.data);
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await request<ApiDataResponse<{ ok: boolean }>>(`/api/admin/gallery/${id}`, {
    method: "DELETE",
  });
}

// ---------- Upload ----------
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const payload = await request<
    ApiDataResponse<{
      key: string;
      url: string;
      size: number;
      contentType: string;
    }>
  >("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  return payload.data.url;
}

// ---------- Settings ----------
export async function fetchSettings(): Promise<Settings> {
  const payload = await request<ApiDataResponse<SettingsDto>>("/api/admin/settings");
  return toSettings(payload.data);
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const payload = await request<ApiDataResponse<SettingsDto>>("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return toSettings(payload.data);
}
