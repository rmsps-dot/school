"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface IntroPreloaderProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export default function IntroPreloader({
  onComplete,
  minDurationMs = 1800,
}: IntroPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if user already saw the intro in current session
    const hasSeenIntro = typeof window !== "undefined" && sessionStorage.getItem("rmsps_intro_seen");
    const targetDuration = hasSeenIntro ? 400 : minDurationMs;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / targetDuration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsDone(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("rmsps_intro_seen", "true");
          }
          if (onComplete) {
            setTimeout(onComplete, 400);
          }
        }, 150);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete]);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="rmsps-intro-preloader"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            transition: {
              duration: 0.75,
              ease: [0.76, 0, 0.24, 1], // Smooth exponential curtain exit
            },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink text-parchment overflow-hidden select-none"
        >
          {/* Ambient Radial Spotlight */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-coral/10 blur-[120px] pointer-events-none -top-20 -left-20" />
          <div className="absolute w-[450px] h-[450px] rounded-full bg-gold/10 blur-[120px] pointer-events-none -bottom-20 -right-20" />

          {/* Center Brand Identity */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
            {/* Logo Crest with Glowing Pulse Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative mb-6"
            >
              {/* Pulse Ring */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-2.5 rounded-full border border-coral/40 bg-coral/5 blur-[2px]"
              />

              {/* Logo Frame */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-coral/40 bg-ink p-1.5 shadow-2xl">
                <Image
                  src="/icon-192.png"
                  alt="RMSPS Official Emblem"
                  width={96}
                  height={96}
                  priority
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </motion.div>

            {/* School Name Typography */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-1.5 mb-8"
            >
              <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-widest text-parchment uppercase">
                <span className="text-coral">R.M.S.</span> PUBLIC SCHOOL
              </h1>
              <p className="font-mono text-[11px] md:text-xs tracking-[0.25em] uppercase text-gold">
                Residential • BSEB Affiliated • Est. 2016
              </p>
            </motion.div>

            {/* High-Tech Progress Track */}
            <div className="w-64 md:w-80 space-y-2">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-hairline relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-coral via-gold to-coral rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              {/* Status and Percentage Indicator */}
              <div className="flex justify-between items-center text-[10px] font-mono text-mist">
                <span className="tracking-widest uppercase">
                  {progress < 40
                    ? "Initializing ERP..."
                    : progress < 80
                    ? "Loading Campus Data..."
                    : "Welcome to RMSPS"}
                </span>
                <span className="text-parchment font-bold">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Bottom Security / BSEB Accreditation Tag */}
          <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-mono text-mist/60 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Secure System V3.0 • Verified Portal</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
