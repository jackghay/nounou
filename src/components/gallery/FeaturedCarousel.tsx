import { useState } from "react";
import { motion } from "framer-motion";
import type { GalleryItem } from "./galleryData";

interface Props {
  items: GalleryItem[];
  onOpen: (id: number) => void;
}

export function FeaturedCarousel({ items, onOpen }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <div
        dir="rtl"
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar px-6 pb-8 pt-4"
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / -(el.clientWidth * 0.78));
          setActive(Math.min(items.length - 1, Math.max(0, idx)));
        }}
      >
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => onOpen(item.id)}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ rotateY: 6, rotateX: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{ transformPerspective: 1000 }}
            className="snap-center shrink-0 w-[78%] aspect-[3/4] rounded-3xl overflow-hidden relative group"
          >
            <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br from-pink/60 via-gold/50 to-royal/40">
              <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-card relative" style={{ boxShadow: "var(--shadow-card)" }}>
                <img
                  src={item.src}
                  alt={item.title}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent">
                  <p className="text-background font-bold text-lg drop-shadow-md">{item.title}</p>
                </div>
                {/* shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        {items.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-8 bg-royal" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}