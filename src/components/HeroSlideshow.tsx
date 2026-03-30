import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  background_image_url: string | null;
  background_gradient: string;
  primary_button_text: string | null;
  primary_button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  animation_type: string;
}

// Vibrant gradient backgrounds for each slide (when no image)
const GRADIENTS = [
  "linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #0f172a 60%, #1a1a2e 100%)",
  "linear-gradient(135deg, #1a0a2e 0%, #3b1d5e 30%, #1a0a2e 60%, #0f1729 100%)",
  "linear-gradient(135deg, #0a1628 0%, #0d3b3b 30%, #0a1628 60%, #0f172a 100%)",
  "linear-gradient(135deg, #1a0f00 0%, #4a2c0a 30%, #1a0f00 60%, #1a1206 100%)",
  "linear-gradient(135deg, #0a1a0a 0%, #0a3d1a 30%, #0a1a0a 60%, #0f172a 100%)",
];

export function HeroSlideshow() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<{ data: HeroSlide[] }>("/hero-slides")
      .then((res) => {
        if (res.data?.length) setSlides(res.data);
      })
      .catch(() => {});
  }, []);

  // Preload images
  useEffect(() => {
    for (const s of slides) {
      if (s.background_image_url) {
        const img = new Image();
        img.onload = () => setLoadedImages((prev) => new Set(prev).add(s.id));
        img.src = s.background_image_url;
      }
    }
  }, [slides]);

  const goTo = useCallback((index: number, dir: number) => {
    if (isTransitioning || slides.length <= 1) return;
    setIsTransitioning(true);
    setDirection(dir);
    setTimeout(() => {
      setCurrent(index);
      setIsTransitioning(false);
    }, 50);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700);
  }, [isTransitioning, slides.length]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length, 1);
  }, [current, slides.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length, -1);
  }, [current, slides.length, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(next, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, next, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const fallbackSlide: HeroSlide = {
    id: "fallback",
    title: "OpenPress",
    subtitle: "Modern CMS for the Edge",
    content: "Open-source, edge-native content management. Free on Cloudflare's global network.",
    background_image_url: null,
    background_gradient: "",
    primary_button_text: "Get Started",
    primary_button_url: "/docs/tutorial",
    secondary_button_text: "View on GitHub",
    secondary_button_url: "https://github.com/aliasfoxkde/OpenPress",
    animation_type: "fade",
  };

  const activeSlides = slides.length > 0 ? slides : [fallbackSlide];
  const slide = activeSlides[current];
  const hasImage = !!slide.background_image_url && loadedImages.has(slide.id);
  const gradient = GRADIENTS[current % GRADIENTS.length];

  return (
    <section
      className="relative overflow-hidden h-[520px] sm:h-[580px] lg:h-[640px] text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured content slideshow"
    >
      {/* Background layers */}
      {activeSlides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-in-out",
            i === current ? "opacity-100 scale-100" : "opacity-0 scale-105",
          )}
          aria-hidden={i !== current}
        >
          {s.background_image_url ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${s.background_image_url})` }}
            />
          ) : null}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: s.background_image_url && hasImage
                ? "linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(30,58,95,0.6) 50%, rgba(15,23,42,0.8) 100%)"
                : s.background_image_url
                  ? gradient
                  : gradient,
            }}
          />
        </div>
      ))}

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.8), transparent 70%)",
            top: "-10%",
            right: "-5%",
            animation: "orb1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.8), transparent 70%)",
            bottom: "-10%",
            left: "-5%",
            animation: "orb2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.8), transparent 70%)",
            top: "30%",
            left: "20%",
            animation: "orb3 18s ease-in-out infinite",
          }}
        />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 z-[3] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 h-full flex flex-col items-center justify-center text-center" aria-live="polite" aria-atomic="true">
        <div className={cn(
          "transition-all duration-700 ease-out",
          isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0",
        )}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-full px-5 py-2 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-sm font-medium text-white/80 tracking-wide">Open Source &middot; Edge-Native &middot; AI-Ready</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            <span className="block text-white drop-shadow-lg">{slide.title}</span>
            {slide.subtitle && (
              <span className="block mt-2 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-none">
                {slide.subtitle}
              </span>
            )}
          </h1>

          {/* Description */}
          {slide.content && (
            <p className="mt-6 text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {slide.content}
            </p>
          )}

          {/* Buttons */}
          {(slide.primary_button_text || slide.secondary_button_text) && (
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              {slide.primary_button_text && (
                <a
                  href={slide.primary_button_url || "#"}
                  className="group relative bg-white text-slate-900 px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300"
                >
                  <span className="relative z-10">{slide.primary_button_text}</span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white via-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              )}
              {slide.secondary_button_text && (
                <a
                  href={slide.secondary_button_url || "#"}
                  className="group border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold text-base backdrop-blur-md hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300"
                >
                  {slide.secondary_button_text}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
          <div
            className="h-full bg-white/60 transition-all duration-6000 ease-linear"
            style={{ width: isPaused ? undefined : `${((current + 1) / activeSlides.length) * 100}%` }}
          />
        </div>
      )}

      {/* Navigation arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {activeSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === current ? "bg-white w-8 shadow-lg shadow-white/30" : "bg-white/30 hover:bg-white/50 w-2",
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
