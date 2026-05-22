import { motion } from "framer-motion";
import type { GalleryItem } from "./galleryData";

interface Props {
  items: GalleryItem[];
  onOpen: (id: number) => void;
}

export function MasonryGrid({ items, onOpen }: Props) {
  return (
    <div className="columns-2 md:columns-3 gap-3 sm:gap-4 px-4">
      {items.map((item, i) => (
        <motion.button
          key={item.id}
          layout
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: (i % 6) * 0.06, type: "spring", damping: 20 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onOpen(item.id)}
          className="block w-full mb-3 sm:mb-4 break-inside-avoid rounded-2xl overflow-hidden group relative"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-card">
            <img
              src={item.src}
              alt={item.title}
              loading="lazy"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-royal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 group-active:translate-y-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300">
              <p className="text-background text-xs sm:text-sm font-semibold drop-shadow-md">
                {item.title}
              </p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}