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

export function HeroSlideshow() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    api.get<{ data: HeroSlide[] }>("/hero-slides")
      .then((res) => {
        if (res.data?.length) setSlides(res.data);
      })
      .catch(() => {
        // fallback: keep empty
      });
  }, []);

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
    }, 600);
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

  // Static fallback when no slides are loaded
  const fallbackSlide: HeroSlide = {
    id: "fallback",
    title: "OpenPress",
    subtitle: "Modern CMS for the Edge",
    content: "Open-source, edge-native content management. Free on Cloudflare's global network.",
    background_image_url: null,
    background_gradient: "from-primary-950 via-primary-900 to-primary-800",
    primary_button_text: "Get Started",
    primary_button_url: "/docs/tutorial",
    secondary_button_text: "View on GitHub",
    secondary_button_url: "https://github.com/aliasfoxkde/OpenPress",
    animation_type: "fade",
  };

  const activeSlides = slides.length > 0 ? slides : [fallbackSlide];

  const slide = activeSlides[current];
  const animation = slide.animation_type || "slide";

  const getAnimationClass = () => {
    if (slides.length === 0 && !isTransitioning) return "translate-x-0 opacity-100 scale-100";
    if (!isTransitioning) return "translate-x-0 opacity-100 scale-100";
    if (animation === "fade") return direction > 0 ? "translate-x-8 opacity-0" : "translate-x-[-32px] opacity-0";
    if (animation === "bounce") return direction > 0 ? "translate-x-8 opacity-0 scale-95" : "translate-x-[-32px] opacity-0 scale-95";
    if (animation === "zoom") return "opacity-0 scale-95";
    return "translate-x-8 opacity-0"; // slide default
  };

  return (
    <section
      className="relative overflow-hidden text-white min-h-[400px] sm:min-h-[480px] lg:min-h-[520px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {activeSlides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-out",
            i === current ? "z-10" : "z-0",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 transition-all duration-500 ease-out",
              getAnimationClass(),
            )}
            style={{
              backgroundImage: s.background_image_url
                ? `url(${s.background_image_url})`
                : undefined,
              background: s.background_image_url
                ? "center/cover"
                : `linear-gradient(135deg, ${s.background_gradient || "from-primary-950 via-primary-900 to-primary-800"})`,
            }}
          />
          {/* Overlay for image slides */}
          {s.background_image_url && (
            <div className="absolute inset-0 bg-black/40" />
          )}
        </div>
      ))}

      {/* Decorative blurs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-[5]">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:py-32 flex flex-col items-center justify-center min-h-[400px] sm:min-h-[480px] lg:min-h-[520px] text-center">
        <div className={cn(
          "transition-all duration-500 ease-out",
          isTransitioning ? (animation === "zoom" ? "opacity-0 scale-95" : animation === "fade" ? "opacity-0 translate-y-4" : `opacity-0 translate-x-${direction > 0 ? "8" : "-8"}`) : "opacity-100 translate-y-0 translate-x-0",
        )}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Open Source &middot; Edge-Native &middot; AI-Ready
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            <span className="block">{slide.title}</span>
            {slide.subtitle && (
              <span className="block bg-gradient-to-r from-primary-200 to-white bg-clip-text text-transparent">
                {slide.subtitle}
              </span>
            )}
          </h1>
          {slide.content && (
            <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              {slide.content}
            </p>
          )}
          {(slide.primary_button_text || slide.secondary_button_text) && (
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              {slide.primary_button_text && (
                <a
                  href={slide.primary_button_url || "#"}
                  className="bg-white text-primary-900 px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all font-semibold text-base shadow-lg shadow-primary-900/50"
                >
                  {slide.primary_button_text}
                </a>
              )}
              {slide.secondary_button_text && (
                <a
                  href={slide.secondary_button_url || "#"}
                  className="border border-white/20 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all font-semibold text-base backdrop-blur-sm"
                >
                  {slide.secondary_button_text}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {activeSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === current ? "bg-white w-6" : "bg-white/40 hover:bg-white/60",
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
