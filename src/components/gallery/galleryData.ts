import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";
import g7 from "@/assets/gallery-7.jpg";
import g8 from "@/assets/gallery-8.jpg";
import g9 from "@/assets/gallery-9.jpg";

export type Category =
  | "all"
  | "notebooks"
  | "planners"
  | "books"
  | "preschool"
  | "covers";

export const categories: { id: Category; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "notebooks", label: "كراسات" },
  { id: "planners", label: "دفاتر يومية" },
  { id: "books", label: "كتب تعليمية" },
  { id: "preschool", label: "أنشطة التحضيري" },
  { id: "covers", label: "أغلفة مخصصة" },
];

export interface GalleryItem {
  id: number;
  src: string;
  title: string;
  category: Exclude<Category, "all">;
  span?: "tall" | "wide" | "normal";
}

export const galleryItems: GalleryItem[] = [
  { id: 1, src: g1, title: "كراسة فاخرة بزخارف ذهبية", category: "notebooks", span: "tall" },
  { id: 2, src: g2, title: "دفتر المعلمة اليومي", category: "planners" },
  { id: 3, src: g3, title: "مجموعة كتب تعليمية", category: "books", span: "tall" },
  { id: 4, src: g4, title: "كتاب أنشطة التحضيري", category: "preschool" },
  { id: 5, src: g5, title: "سجل الحضور والغياب", category: "planners", span: "tall" },
  { id: 6, src: g6, title: "غلاف مخصص بالاسم", category: "covers" },
  { id: 7, src: g7, title: "كرّاس الألعاب البيداغوجية", category: "preschool" },
  { id: 8, src: g8, title: "تشكيلة كراسات وردية", category: "notebooks", span: "tall" },
  { id: 9, src: g9, title: "كرّاس بخط عربي راقٍ", category: "books" },
];

export const featuredItems = [galleryItems[0], galleryItems[2], galleryItems[5], galleryItems[8], galleryItems[7]];

// تواصل واتساب — عدّلي الرقم هنا
export const WHATSAPP_NUMBER = "212600000000"; // ← غيّري هذا الرقم
export const WHATSAPP_MESSAGE = "السلام عليكم، أرغب في طلب تصميم مخصص ✨";
export const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;