import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "./galleryData";

interface Props {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}

export function Lightbox({ items, index, onClose, onNavigate }: Props) {
  useEffect(() => {
    if (index === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((index + 1) % items.length);
      if (e.key === "ArrowRight") onNavigate((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [index, items.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-foreground/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-11 h-11 rounded-full glass flex items-center justify-center text-foreground hover:scale-110 transition-transform z-10"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          {/* In RTL: previous (chevron-right) on the right, next (chevron-left) on the left */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + items.length) % items.length);
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center text-foreground hover:scale-110 transition-transform z-10"
            aria-label="السابق"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % items.length);
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center text-foreground hover:scale-110 transition-transform z-10"
            aria-label="التالي"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <motion.div
            key={items[index].id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={items[index].src}
              alt={items[index].title}
              className="rounded-3xl shadow-2xl max-h-[80vh] w-auto object-contain"
            />
            <p className="mt-4 text-background text-center font-semibold text-lg">
              {items[index].title}
            </p>
            <p className="text-background/60 text-sm">
              {index + 1} / {items.length}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}