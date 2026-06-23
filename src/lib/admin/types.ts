export type Category = {
  id: string;
  slug: string;
  labelAr: string;
  sortOrder: number;
  isActive: boolean;
};

export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
  sortOrder: number;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  whatsappNumber: string;
  whatsappMessage: string;
  heroTitle: string;
  heroSubtitle: string;
  metaTitle: string;
  metaDescription: string;
  theme?: string;
  fontFamily?: string;
  cardStyle?: string;
  bgSparkles?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
};
