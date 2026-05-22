import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";
import {
  galleryItems,
  featuredItems,
  categories,
  whatsappLink,
  type Category,
  type GalleryItem,
} from "@/components/gallery/galleryData";
import { FeaturedCarousel } from "@/components/gallery/FeaturedCarousel";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";
import { Lightbox } from "@/components/gallery/Lightbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "معرض أعمالنا — كراسات وكتب تعليمية مخصصة" },
      {
        name: "description",
        content:
          "معرض صور لأعمالنا: كراسات، دفاتر يومية، كتب تعليمية، أنشطة التحضيري وأغلفة مخصصة بلمسة فنية راقية.",
      },
      { property: "og:title", content: "معرض أعمالنا" },
      {
        property: "og:description",
        content: "تصاميم تعليمية مخصصة بكل حب وإتقان.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxItems, setLightboxItems] = useState<GalleryItem[]>(galleryItems);

  const filtered = useMemo(
    () =>
      activeCat === "all"
        ? galleryItems
        : galleryItems.filter((g) => g.category === activeCat),
    [activeCat]
  );

  const openById = (id: number) => {
    const idx = filtered.findIndex((g) => g.id === id);
    if (idx >= 0) {
      setLightboxItems(filtered);
      setLightboxIndex(idx);
      return;
    }

    // If the featured card is not inside the active filter, open it from the full gallery list.
    const globalIdx = galleryItems.findIndex((g) => g.id === id);
    if (globalIdx >= 0) {
      setLightboxItems(galleryItems);
      setLightboxIndex(globalIdx);
    }
  };

  return (
    <main className="min-h-screen relative overflow-x-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Floating decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-pink/40 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-40 -left-20 w-64 h-64 rounded-full bg-sky/40 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none absolute top-[60%] right-1/3 w-56 h-56 rounded-full bg-gold/30 blur-3xl animate-float" style={{ animationDelay: "4s" }} />

      {/* Hero */}
      <section className="relative pt-12 pb-6 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-5 border border-gold/30"
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold text-foreground/80">معرض حصري</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-extrabold text-shimmer mb-3 leading-tight"
          style={{ fontFamily: "Cairo, sans-serif" }}
        >
          معرض أعمالنا
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed"
        >
          كراسات ودفاتر وكتب تعليمية مخصصة بلمسة فنية راقية
        </motion.p>

        <motion.a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-primary-foreground font-bold text-sm"
          style={{ background: "var(--gradient-royal)", boxShadow: "var(--shadow-float)" }}
        >
          <Sparkles className="w-4 h-4" />
          تواصلي للطلب
        </motion.a>
      </section>

      {/* Featured carousel */}
      <section className="mt-2">
        <FeaturedCarousel items={featuredItems} onOpen={openById} />
      </section>

      {/* Categories */}
      <section className="px-4 mt-2 mb-6">
        <div dir="rtl" className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => {
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  active
                    ? "text-primary-foreground scale-105"
                    : "glass text-foreground/70 hover:text-foreground"
                }`}
                style={
                  active
                    ? { background: "var(--gradient-royal)", boxShadow: "var(--shadow-soft)" }
                    : undefined
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Masonry */}
      <section className="pb-32">
        <MasonryGrid items={filtered} onOpen={openById} />
      </section>

      {/* Footer */}
      <footer className="px-6 pb-28 pt-4 text-center">
        <div className="mx-auto w-16 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
        <p className="text-sm text-muted-foreground font-medium">
          تصاميم تعليمية مخصصة بكل حب وإتقان
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">© {new Date().getFullYear()}</p>
      </footer>

      {/* Sticky WhatsApp */}
      <motion.a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        className="fixed bottom-5 inset-x-4 z-50 mx-auto max-w-sm flex items-center justify-center gap-2 py-4 rounded-full text-primary-foreground font-bold text-base"
        style={{ background: "linear-gradient(135deg, oklch(0.6 0.16 150), oklch(0.5 0.18 155))", boxShadow: "var(--shadow-float)" }}
      >
        <MessageCircle className="w-5 h-5" />
        اطلبي تصميمك الآن
      </motion.a>

      <Lightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </main>
  );
}
