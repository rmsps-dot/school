"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";

export interface SliderItemData {
  title: string;
  image: string;
  category?: string;
  tag?: string;
  year?: string;
  date?: string;
  description?: string;
  desc?: string;
  stat?: string;
  author?: string;
  role?: string;
  avatar?: string;
  bullets?: string[];
  quote?: string;
}

const DEFAULT_PROJECTS: SliderItemData[] = [
  {
    title: "Practical STEM Laboratories",
    image:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1964&auto=format&fit=crop",
    category: "Optics & Titration Labs",
    year: "2026",
    description: "Hands-on physics and chemistry optics labs with dedicated mentor faculty",
    stat: "100% Practical Pass",
  },
  {
    title: "Encrypted Geofenced Presence",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1887&auto=format&fit=crop",
    category: "Smart Campus ERP",
    year: "2026",
    description: "Real-time arrival authentication under 30s with instant parent alerts",
    stat: "< 30s Scan",
  },
  {
    title: "24/7 Supervised Hostels",
    image:
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1964&auto=format&fit=crop",
    category: "Residential Living",
    year: "2026",
    description: "Dormitory care, morning yoga sessions, and disciplined evening study halls",
    stat: "24/7 Wardens",
  },
  {
    title: "BSEB 100% Pass Record",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1887&auto=format&fit=crop",
    category: "Board Excellence",
    year: "2025",
    description: "Top state percentiles in BSEB board examinations and Olympiads",
    stat: "98% Distinction",
  },
  {
    title: "Athletics & Cultural Arts",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1896&auto=format&fit=crop",
    category: "Holistic Development",
    year: "2026",
    description: "Inter-house athletic championships and annual science exhibitions",
    stat: "State Tournaments",
  },
];

const CONFIG = {
  SCROLL_SPEED: 0.85,
  LERP_FACTOR: 0.08,
  MAX_VELOCITY: 160,
  SNAP_DURATION: 400,
};

const lerp = (start: number, end: number, factor: number) =>
  start + (end - start) * factor;

export function BoundedParallaxSlider({
  items = DEFAULT_PROJECTS,
  className = "",
}: {
  items?: SliderItemData[];
  className?: string;
  badge?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const state = React.useRef({
    currentY: 0,
    targetY: 0,
    isDragging: false,
    isSnapping: false,
    snapStart: { time: 0, y: 0, target: 0 },
    lastScrollTime: Date.now(),
    dragStart: { y: 0, scrollY: 0 },
    projectHeight: 520,
  });

  const projectsRef = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const requestRef = React.useRef<number | undefined>(undefined);

  const totalItems = items.length;

  const updateParallax = (
    img: HTMLElement | null,
    scroll: number,
    index: number,
    height: number
  ) => {
    if (!img) return;
    if (!img.dataset.parallaxCurrent) {
      img.dataset.parallaxCurrent = "0";
    }

    let current = parseFloat(img.dataset.parallaxCurrent);
    const target = (-scroll - index * height) * 0.25;
    current = lerp(current, target, 0.1);

    if (Math.abs(current - target) > 0.01) {
      img.style.transform = `translate3d(0, ${current}px, 0) scale(1.12)`;
      img.dataset.parallaxCurrent = current.toString();
    }
  };

  const updateSnap = () => {
    const s = state.current;
    const progress = Math.min(
      (Date.now() - s.snapStart.time) / CONFIG.SNAP_DURATION,
      1
    );
    const eased = 1 - Math.pow(1 - progress, 3);
    s.targetY =
      s.snapStart.y + (s.snapStart.target - s.snapStart.y) * eased;
    if (progress >= 1) s.isSnapping = false;
  };

  const snapToProject = () => {
    const s = state.current;
    const h = s.projectHeight || 1;
    const current = Math.max(
      0,
      Math.min(totalItems - 1, Math.round(-s.targetY / h))
    );
    const target = -current * h;
    s.isSnapping = true;
    s.snapStart = {
      time: Date.now(),
      y: s.targetY,
      target: target,
    };
  };

  const jumpToSlide = (index: number) => {
    const s = state.current;
    const h = s.projectHeight || 1;
    const safeIdx = Math.max(0, Math.min(totalItems - 1, index));
    const target = -safeIdx * h;
    s.isSnapping = true;
    s.snapStart = {
      time: Date.now(),
      y: s.currentY,
      target: target,
    };
    setActiveIndex(safeIdx);
  };

  const updatePositions = () => {
    const s = state.current;
    const h = s.projectHeight || 1;

    // Update main cards
    projectsRef.current.forEach((el, index) => {
      const y = index * h + s.currentY;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
      const img = el.querySelector("img");
      if (img) {
        updateParallax(img, s.currentY, index, h);
      }
    });

    // Sync active index for UI dots
    const curIdx = Math.max(0, Math.min(totalItems - 1, Math.round(-s.currentY / h)));
    if (curIdx !== activeIndex) {
      setActiveIndex(curIdx);
    }
  };

  const animate = () => {
    const s = state.current;
    const now = Date.now();
    const h = s.projectHeight || 1;
    const maxBound = -(totalItems - 1) * h;

    // Clamp target within bounds
    s.targetY = Math.max(maxBound, Math.min(0, s.targetY));

    if (!s.isSnapping && !s.isDragging && now - s.lastScrollTime > 120) {
      const snapPoint =
        -Math.max(0, Math.min(totalItems - 1, Math.round(-s.targetY / h))) * h;
      if (Math.abs(s.targetY - snapPoint) > 1) snapToProject();
    }

    if (s.isSnapping) updateSnap();
    if (!s.isDragging) {
      s.currentY += (s.targetY - s.currentY) * CONFIG.LERP_FACTOR;
    }

    updatePositions();
  };

  const animationLoop = () => {
    animate();
    requestRef.current = requestAnimationFrame(animationLoop);
  };

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    state.current.projectHeight = el.offsetHeight || 520;

    const onWheel = (e: WheelEvent) => {
      const s = state.current;
      const h = s.projectHeight || 1;
      const minLimit = -(totalItems - 1) * h;

      // BOUNDED SCROLL RELEASE:
      // If at top slide (targetY >= -5) and scrolling UP (deltaY < 0), let page scroll up naturally!
      if (s.targetY >= -5 && e.deltaY < 0) {
        return;
      }

      // If at bottom slide (targetY <= minLimit + 5) and scrolling DOWN (deltaY > 0), let page scroll down naturally!
      if (s.targetY <= minLimit + 5 && e.deltaY > 0) {
        return;
      }

      // Inside bounds: smoothly glide between slides
      e.preventDefault();
      s.isSnapping = false;
      s.lastScrollTime = Date.now();

      const delta = Math.max(
        Math.min(e.deltaY * CONFIG.SCROLL_SPEED, CONFIG.MAX_VELOCITY),
        -CONFIG.MAX_VELOCITY
      );

      s.targetY = Math.max(minLimit, Math.min(0, s.targetY - delta));
    };

    const onTouchStart = (e: TouchEvent) => {
      const s = state.current;
      s.isDragging = true;
      s.isSnapping = false;
      s.dragStart = { y: e.touches[0].clientY, scrollY: s.targetY };
      s.lastScrollTime = Date.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = state.current;
      if (!s.isDragging) return;
      const h = s.projectHeight || 1;
      const minLimit = -(totalItems - 1) * h;

      const newTarget =
        s.dragStart.scrollY + (e.touches[0].clientY - s.dragStart.y) * 1.5;

      s.targetY = Math.max(minLimit, Math.min(0, newTarget));
      s.lastScrollTime = Date.now();
    };

    const onTouchEnd = () => {
      state.current.isDragging = false;
    };

    const onResize = () => {
      if (el) {
        state.current.projectHeight = el.offsetHeight || 520;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    onResize();
    requestRef.current = requestAnimationFrame(animationLoop);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [totalItems]);

  return (
    <div
      ref={containerRef}
      className={`relative h-[480px] sm:h-[560px] w-full overflow-hidden rounded-[2.5rem] border border-black/10 dark:border-white/15 bg-black select-none shadow-2xl ${className}`}
    >
      {/* ── Main Stage Slides (Bounded 0 to N-1) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {items.map((data, i) => (
          <div
            key={i}
            className="absolute inset-0 w-full h-full will-change-transform flex items-end p-6 sm:p-12 overflow-hidden"
            ref={(el) => {
              if (el) projectsRef.current.set(i, el);
              else projectsRef.current.delete(i);
            }}
          >
            <Image
              src={data.image}
              alt={data.title}
              fill
              className="object-cover opacity-75 transition-transform duration-300"
              sizes="(max-width: 1200px) 100vw, 1200px"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10 max-w-xl space-y-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold px-3 py-1 rounded-full bg-white/15 border border-white/20 inline-block">
                  {data.category || data.tag || data.role || "RMSPS Feature"} {data.year || data.date ? `• ${data.year || data.date}` : ""}
                </span>
                {data.stat && (
                  <span className="text-xs font-mono font-bold text-[#81B29A] bg-[#81B29A]/20 px-3 py-1 rounded-full border border-[#81B29A]/30">
                    {data.stat}
                  </span>
                )}
              </div>

              <h3 className="font-display font-black text-2xl sm:text-4xl md:text-5xl uppercase leading-tight">
                {data.title}
              </h3>

              {data.quote ? (
                <blockquote className="text-white/90 text-xs sm:text-sm font-light leading-relaxed pl-3 border-l-2 border-[#FB7339] italic">
                  &ldquo;{data.quote}&rdquo;
                </blockquote>
              ) : (
                <p className="text-white/85 text-xs sm:text-sm font-light leading-relaxed max-w-md">
                  {data.description || data.desc || ""}
                </p>
              )}

              {/* Author / Bullets */}
              {data.author && (
                <div className="flex items-center gap-3 pt-2">
                  {data.avatar && (
                    <div className="w-8 h-8 rounded-full overflow-hidden relative border border-[#FB7339]">
                      <Image
                        src={data.avatar}
                        alt={data.author}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold font-display uppercase">{data.author}</p>
                    <p className="text-[10px] font-mono text-white/70">{data.role}</p>
                  </div>
                </div>
              )}

              {data.bullets && data.bullets.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.bullets.map((b, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono bg-white/10 px-2.5 py-0.5 rounded-full text-white/90 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#FB7339]" />
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom-Right Interactive Slide Arrows & Dots ── */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        {/* Progress Dots */}
        <div className="flex gap-1.5 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/20">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => jumpToSlide(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                activeIndex === idx
                  ? "bg-[#FB7339] w-6"
                  : "bg-white/40 hover:bg-white w-2.5"
              }`}
              aria-label={`Jump to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Arrow Controls */}
        <div className="flex gap-1 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/20">
          <button
            onClick={() => jumpToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="p-2 rounded-xl text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => jumpToSlide(activeIndex + 1)}
            disabled={activeIndex === totalItems - 1}
            className="p-2 rounded-xl text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Alias for backwards compatibility
export { BoundedParallaxSlider as InfiniteParallaxSlider, BoundedParallaxSlider as Component };
