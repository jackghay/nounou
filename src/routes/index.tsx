import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";
import {
  galleryItems as fallbackGalleryItems,
  featuredItems as fallbackFeaturedItems,
  categories as fallbackCategories,
  whatsappLink as fallbackWhatsappLink,
  type Category as GalleryCategory,
  type GalleryItem,
} from "@/components/gallery/galleryData";
import { FeaturedCarousel } from "@/components/gallery/FeaturedCarousel";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";
import { Lightbox } from "@/components/gallery/Lightbox";
import { publicApiClient } from "@/lib/api/client";

// Intelligent Cloudinary Image Compression/Optimization helper
function getOptimizedCloudinaryUrl(url: string, width = 800): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  // Inject transformation options (auto quality, auto format, and width limit) right after /upload/
  return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
}

// Skeletons to prevent layout shifts (CLS)
function CarouselSkeleton() {
  return (
    <div className="mx-4 max-w-5xl md:mx-auto h-[350px] bg-foreground/5 animate-pulse rounded-3xl" />
  );
}

function CategoriesSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="shrink-0 animate-pulse bg-foreground/5 h-10 w-24 rounded-full" />
      ))}
    </div>
  );
}

function MasonrySkeleton() {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-4 px-4 pb-32">
      {[240, 320, 200, 280, 350, 220, 300, 260].map((height, i) => (
        <div
          key={i}
          style={{ height }}
          className="mb-4 break-inside-avoid animate-pulse bg-foreground/5 rounded-3xl"
        />
      ))}
    </div>
  );
}

function FloatingEffects({ type }: { type: string }) {
  const [particles, setParticles] = useState<{ id: number; x: number; size: number; delay: number; duration: number; char: string }[]>([]);

  useEffect(() => {
    if (!type || type === "none") {
      setParticles([]);
      return;
    }

    let chars = ["✨", "⭐"];
    if (type === "hearts") chars = ["💖", "💕", "🌸", "🌸", "💝"];
    else if (type === "leaves") chars = ["🍃", "🍂", "🍁", "🍀"];
    else if (type === "stars") chars = ["⭐", "🌟", "✨"];
    else if (type === "sparkles") chars = ["✨", "❇️", "✨"];

    const generated = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 1.5 + 0.8,
      delay: Math.random() * 8,
      duration: Math.random() * 6 + 6,
      char: chars[Math.floor(Math.random() * chars.length)],
    }));
    setParticles(generated);
  }, [type]);

  if (!type || type === "none" || particles.length === 0) return null;

  const isUpward = type === "hearts" || type === "stars" || type === "sparkles";

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            opacity: 0, 
            x: `${p.x}vw`, 
            y: isUpward ? "105vh" : "-5vh",
            rotate: 0 
          }}
          animate={{
            opacity: [0, 0.7, 0.7, 0],
            y: isUpward ? "-5vh" : "105vh",
            x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            fontSize: `${p.size}rem`,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.03))",
          }}
        >
          {p.char}
        </motion.div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const settings = await publicApiClient.getSettings();
      return { settings };
    } catch {
      return { settings: null };
    }
  },
  head: ({ loaderData }) => {
    const s = loaderData?.settings;
    return {
      meta: [
        { title: s?.metaTitle || "معرض أعمالنا — كراسات وكتب تعليمية مخصصة" },
        {
          name: "description",
          content:
            s?.metaDescription ||
            "معرض صور لأعمالنا: كراسات، دفاتر يومية، كتب تعليمية، أنشطة التحضيري وأغلفة مخصصة بلمسة فنية راقية.",
        },
        { property: "og:title", content: s?.metaTitle || "معرض أعمالنا" },
        {
          property: "og:description",
          content: s?.metaDescription || "تصاميم تعليمية مخصصة بكل حب وإتقان.",
        },
      ],
    };
  },
  component: Index,
});

function Index() {
  const loaderData = Route.useLoaderData();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Dynamic states
  const [categories, setCategories] = useState<{ id: string; label: string }[]>(fallbackCategories);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(fallbackGalleryItems);
  const [featuredItems, setFeaturedItems] = useState<GalleryItem[]>(fallbackFeaturedItems);
  const [whatsappLink, setWhatsappLink] = useState(fallbackWhatsappLink);
  const [whatsappNumber, setWhatsappNumber] = useState("212600000000");
  const [whatsappMessage, setWhatsappMessage] = useState("السلام عليكم، أرغب في طلب تصميم مخصص ✨");
  const [heroTitle, setHeroTitle] = useState(loaderData?.settings?.heroTitle || "معرض أعمالنا");
  const [bgSparkles, setBgSparkles] = useState<string>("none");
  const [heroSubtitle, setHeroSubtitle] = useState(
    loaderData?.settings?.heroSubtitle || "كراسات ودفاتر وكتب تعليمية مخصصة بلمسة فنية راقية"
  );
  const [loading, setLoading] = useState(true);

  const [lightboxItems, setLightboxItems] = useState<GalleryItem[]>(galleryItems);

  useEffect(() => {
    let active = true;

    async function loadDynamicData() {
      // 1. Detect Referrer for Instagram / WhatsApp analytics tracking
      let visitorSource = "direct";
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const ref = document.referrer || "";
        const searchParams = new URLSearchParams(window.location.search);
        const utmSource = searchParams.get("utm_source");
        
        if (utmSource === "instagram" || ref.includes("instagram.com")) {
          visitorSource = "instagram";
        } else if (utmSource === "whatsapp" || ref.includes("wa.me") || ref.includes("whatsapp.com")) {
          visitorSource = "whatsapp";
        }
        
        // Log visitor referrer to database silently
        publicApiClient.postVisit(visitorSource).catch((err) => {
          console.warn("Failed to record analytics visit:", err);
        });
      }

      try {
        const [apiCategories, apiGallery, apiSettings] = await Promise.all([
          publicApiClient.getCategories(),
          publicApiClient.getGallery(),
          publicApiClient.getSettings(),
        ]);

        if (!active) return;

        // Categories mapping
        const mappedCategories = [
          { id: "all", label: "الكل" },
          ...apiCategories.map((c) => ({ id: c.slug, label: c.labelAr })),
        ];
        setCategories(mappedCategories);

        // Category lookup helper (id to slug)
        const categoryIdToSlug = new Map<string, string>();
        apiCategories.forEach((c) => {
          categoryIdToSlug.set(String(c.id), c.slug);
        });

        // Gallery mapping
        const mappedGallery: GalleryItem[] = apiGallery.map((item, idx) => {
          const categorySlug = categoryIdToSlug.get(String(item.categoryId)) || "notebooks";
          return {
            id: Number(item.id),
            // Optimize image loading using Cloudinary parameters
            src: getOptimizedCloudinaryUrl(item.imageUrl, 800),
            title: item.title,
            category: categorySlug as any,
            span: idx % 8 === 0 || idx % 8 === 2 || idx % 8 === 4 ? "tall" : "normal",
          };
        });
        setGalleryItems(mappedGallery);
        setLightboxItems(mappedGallery);

        // Featured items
        const featured = mappedGallery.filter((_, idx) => apiGallery[idx].isFeatured);
        setFeaturedItems(featured.length > 0 ? featured : mappedGallery.slice(0, 5));

        // Settings mapping
        const num = apiSettings.whatsappNumber || "212600000000";
        const msg = apiSettings.whatsappMessage || "السلام عليكم، أرغب في طلب تصميم مخصص ✨";
        setWhatsappNumber(num);
        setWhatsappMessage(msg);
        setWhatsappLink(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
        
        if (apiSettings.heroTitle) setHeroTitle(apiSettings.heroTitle);
        if (apiSettings.heroSubtitle) setHeroSubtitle(apiSettings.heroSubtitle);

        // Apply visual customization on load
        const theme = apiSettings.theme || "royal_gold";
        document.documentElement.setAttribute("data-theme", theme);

        const fontFamily = apiSettings.fontFamily || "Tajawal";
        document.documentElement.style.setProperty(
          "--font-family-override",
          `'${fontFamily}', 'Cairo', system-ui, sans-serif`
        );

        const cardStyle = apiSettings.cardStyle || "medium";
        let radius = "1.25rem";
        if (cardStyle === "sharp") radius = "0px";
        else if (cardStyle === "round") radius = "2.5rem";
        document.documentElement.style.setProperty("--radius", radius);

        if (apiSettings.bgSparkles) {
          setBgSparkles(apiSettings.bgSparkles);
        }

        // Apply custom colors if specified
        if (apiSettings.primaryColor) {
          document.documentElement.style.setProperty("--primary", apiSettings.primaryColor);
        } else {
          document.documentElement.style.removeProperty("--primary");
        }

        if (apiSettings.secondaryColor) {
          document.documentElement.style.setProperty("--secondary", apiSettings.secondaryColor);
        } else {
          document.documentElement.style.removeProperty("--secondary");
        }

        if (apiSettings.backgroundColor) {
          document.documentElement.style.setProperty("--background", apiSettings.backgroundColor);
          document.documentElement.style.setProperty("--gradient-hero", apiSettings.backgroundColor);
        } else {
          document.documentElement.style.removeProperty("--background");
          document.documentElement.style.removeProperty("--gradient-hero");
        }

        // 2. Handle Deep Linking logic to open items directly by ID parameter
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const itemIdParam = searchParams.get("itemId");
          if (itemIdParam) {
            const itemId = Number(itemIdParam);
            const foundIdx = mappedGallery.findIndex((item) => item.id === itemId);
            if (foundIdx >= 0) {
              setLightboxIndex(foundIdx);
            }
          }
        }

      } catch (err) {
        console.warn("Failed to load dynamic data, using fallbacks:", err);
        
        // Handle deep link against fallbacks on server error
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const itemIdParam = searchParams.get("itemId");
          if (itemIdParam) {
            const itemId = Number(itemIdParam);
            const foundIdx = fallbackGalleryItems.findIndex((item) => item.id === itemId);
            if (foundIdx >= 0) {
              setLightboxItems(fallbackGalleryItems);
              setLightboxIndex(foundIdx);
            }
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDynamicData();

    return () => {
      active = false;
    };
  }, [loaderData]);

  const filtered = useMemo(
    () =>
      activeCat === "all"
        ? galleryItems
        : galleryItems.filter((g) => g.category === activeCat),
    [activeCat, galleryItems]
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
      {/* Floating decorative particles */}
      <FloatingEffects type={bgSparkles} />

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
          {heroTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed"
        >
          {heroSubtitle}
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
        {loading ? <CarouselSkeleton /> : <FeaturedCarousel items={featuredItems} onOpen={openById} />}
      </section>

      {/* Categories */}
      <section className="px-4 mt-6 mb-6">
        {loading ? (
          <CategoriesSkeleton />
        ) : (
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
        )}
      </section>

      {/* Masonry Grid */}
      <section>
        {loading ? <MasonrySkeleton /> : <MasonryGrid items={filtered} onOpen={openById} />}
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
        whatsappNumber={whatsappNumber}
        whatsappMessage={whatsappMessage}
      />
    </main>
  );
}
