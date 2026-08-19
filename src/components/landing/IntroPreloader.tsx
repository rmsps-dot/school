"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface IntroPreloaderProps {
  onComplete?: () => void;
}

export default function IntroPreloader({ onComplete }: IntroPreloaderProps) {
  const [progress, setProgress] = useState(1);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);

    const duration = 2600; // Perfect sweet spot: ~2.6s for full aesthetic appreciation
    const startTime = performance.now();

    // Easing curve: smooth acceleration and luxury deceleration
    const easeProgress = (t: number): number => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const updateFrame = (now: number) => {
      const elapsed = now - startTime;
      const linearProgress = Math.min(1, elapsed / duration);
      const eased = easeProgress(linearProgress);
      const currentPct = Math.max(1, Math.min(100, Math.round(eased * 100)));

      setProgress(currentPct);

      if (linearProgress < 1) {
        animFrameRef.current = requestAnimationFrame(updateFrame);
      } else {
        // Hold at 100% briefly so user clearly registers 100% completion
        setTimeout(() => {
          setIsExiting(true);
          if (onComplete) {
            onComplete();
          }
          // Remove from DOM after curtain animation completes
          setTimeout(() => {
            setIsRemoved(true);
          }, 800);
        }, 300);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [onComplete]);

  if (!isMounted || isRemoved) return null;

  const getStatusText = (pct: number) => {
    if (pct < 28) return "Initializing Secure Campus ERP...";
    if (pct < 60) return "Connecting BSEB Academic Systems...";
    if (pct < 90) return "Loading Interactive Portal Modules...";
    if (pct < 100) return "Finalizing Session 2026–27...";
    return "Campus ERP Ready • Welcome to RMSPS";
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="rmsps-intro-preloader"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            opacity: 0.95,
            transition: {
              duration: 0.75,
              ease: [0.76, 0, 0.24, 1], // Smooth exponential curtain lift
            },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0B10] text-[#F3EFE6] overflow-hidden select-none"
        >
          {/* Ambient Radial Spotlight Aura */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[#F1917D]/10 blur-[140px] pointer-events-none -top-20 -left-20 animate-pulse" />
          <div className="absolute w-[550px] h-[550px] rounded-full bg-[#D4AF6A]/10 blur-[140px] pointer-events-none -bottom-20 -right-20" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#3E5C76]/15 blur-[120px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

          {/* Center Brand Identity Hub */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
            {/* Logo Crest with Glowing Pulse Ring */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative mb-8"
            >
              {/* Outer Radiant Glow Rings */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.65, 0.2] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-4 rounded-full border border-[#F1917D]/30 bg-[#F1917D]/5 blur-[6px]"
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-2 rounded-full border border-[#D4AF6A]/40"
              />

              {/* Logo Frame */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#F1917D]/50 bg-[#0B0B10] p-2 shadow-[0_0_40px_rgba(241,145,125,0.25)]">
                <Image
                  src="/icon-192.png"
                  alt="RMSPS Official Emblem"
                  width={112}
                  height={112}
                  priority
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </motion.div>

            {/* School Name Staggered Reveal */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="space-y-2 mb-10"
            >
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-[0.18em] text-[#F3EFE6] uppercase">
                <span className="text-[#F1917D] drop-shadow-[0_0_16px_rgba(241,145,125,0.4)]">
                  R.M.S.
                </span>{" "}
                PUBLIC SCHOOL
              </h1>
              <p className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-[#D4AF6A] font-semibold">
                Residential • BSEB Affiliated • Est. 2016
              </p>
            </motion.div>

            {/* High-Tech Synced Progress Track & Counter */}
            <div className="w-72 sm:w-96 space-y-3">
              {/* Progress Bar with Liquid Gradient */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-[#F1917D] via-[#D4AF6A] to-[#F1917D] rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(241,145,125,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Status and Percentage Indicator */}
              <div className="flex justify-between items-center text-xs font-mono text-[#8A8F98]">
                <span className="tracking-wider uppercase truncate max-w-[240px] text-left">
                  {getStatusText(progress)}
                </span>
                <span className="text-[#F3EFE6] font-bold text-sm tracking-tight tabular-nums ml-2">
                  {progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Security / Accreditation Tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-6 flex items-center gap-2.5 text-[11px] font-mono text-[#8A8F98]/70 uppercase tracking-widest"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Campus ERP V3.0 • Verified BSEB Network</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
