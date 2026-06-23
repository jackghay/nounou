import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "./galleryData";

interface Props {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export function Lightbox({ 
  items, 
  index, 
  onClose, 
  onNavigate,
  whatsappNumber,
  whatsappMessage 
}: Props) {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (index === null) return;
    const url = `${window.location.origin}/?itemId=${items[index].id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Generate personalized WhatsApp link
  const number = whatsappNumber || "212600000000";
  const defaultMsg = whatsappMessage || "السلام عليكم، أرغب في طلب تصميم مخصص ✨";
  const itemTitle = index !== null ? items[index].title : "";
  const customMessage = `${defaultMsg}\n\n*الطلب:* تصميم مخصص لمنتج "${itemTitle}"`;
  const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(customMessage)}`;

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

          {/* Navigation */}
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
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={items[index].src}
              alt={items[index].title}
              className="rounded-3xl shadow-2xl max-h-[60vh] sm:max-h-[70vh] w-auto object-contain"
            />
            
            <p className="mt-4 text-background text-center font-bold text-lg px-4">
              {items[index].title}
            </p>
            
            <p className="text-background/60 text-xs mt-1">
              {index + 1} / {items.length}
            </p>

            {/* Quick Actions (Feminine design style) */}
            <div className="flex flex-row gap-3 mt-4 w-full justify-center px-4 max-w-md">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full text-white font-bold text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg"
                style={{ 
                  background: "linear-gradient(135deg, #ec4899, #f43f5e)",
                  boxShadow: "0 4px 14px rgba(244, 63, 94, 0.4)" 
                }}
              >
                <span>اطلبي هذا التصميم 🌸</span>
              </a>
              
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-full glass text-background hover:bg-white/10 active:scale-95 transition-all text-sm font-semibold border border-white/20"
              >
                <span>{copied ? "تم نسخ الرابط! ✨" : "نسخ رابط المشاركة 🔗"}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}