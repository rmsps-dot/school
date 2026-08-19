"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export type PreloaderRole = "admin" | "teacher" | "student" | "parent" | "public";

interface IntroPreloaderProps {
  role?: PreloaderRole;
  onComplete?: () => void;
}

export default function IntroPreloader({
  role = "public",
  onComplete,
}: IntroPreloaderProps) {
  const [phase, setPhase] = useState<"logo-center" | "brand-expanded">("logo-center");
  const [progress, setProgress] = useState(1);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Step 1 -> Step 2: Trigger logo shift to left & text reveal after 400ms
    const expandTimer = setTimeout(() => {
      setPhase("brand-expanded");
    }, 400);

    // Step 3: Run smooth 1 to 100% counter
    const counterStartDelay = 500;
    const counterDuration = 1300; // Snappy & fast
    let startTime: number | null = null;

    const startCounterTimer = setTimeout(() => {
      const updateCounter = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const linearProgress = Math.min(1, elapsed / counterDuration);

        // Smooth cubic ease-out curve
        const eased = 1 - Math.pow(1 - linearProgress, 3);
        const currentPct = Math.max(1, Math.min(100, Math.round(eased * 100)));

        setProgress(currentPct);

        if (linearProgress < 1) {
          animFrameRef.current = requestAnimationFrame(updateCounter);
        } else {
          // Reached 100% -> Brief pause then curtain exit
          setTimeout(() => {
            setIsExiting(true);
            if (onComplete) {
              onComplete();
            }
            setTimeout(() => {
              setIsRemoved(true);
            }, 750);
          }, 180);
        }
      };

      animFrameRef.current = requestAnimationFrame(updateCounter);
    }, counterStartDelay);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(startCounterTimer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [onComplete]);

  if (!isMounted || isRemoved) return null;

  // Role-specific badge and status configurations
  const roleConfig: Record<
    PreloaderRole,
    {
      badge: string;
      color: string;
      glow: string;
      status: (pct: number) => string;
    }
  > = {
    admin: {
      badge: "ADMIN PORTAL",
      color: "#F1917D",
      glow: "rgba(241,145,125,0.4)",
      status: (pct) =>
        pct < 35
          ? "Authenticating Administrator Session..."
          : pct < 75
          ? "Loading Governance & ERP Ledgers..."
          : pct < 100
          ? "Preparing Administrator Workspace..."
          : "Access Granted • Welcome Admin",
    },
    teacher: {
      badge: "TEACHER PORTAL",
      color: "#3E5C76",
      glow: "rgba(62,92,118,0.4)",
      status: (pct) =>
        pct < 35
          ? "Verifying Faculty Credentials..."
          : pct < 75
          ? "Syncing Classrooms & Attendance Geofence..."
          : pct < 100
          ? "Preparing Academic Workspace..."
          : "Access Granted • Welcome Faculty",
    },
    parent: {
      badge: "PARENT PORTAL",
      color: "#D4AF6A",
      glow: "rgba(212,175,106,0.4)",
      status: (pct) =>
        pct < 35
          ? "Connecting Ward Records..."
          : pct < 75
          ? "Syncing Daily Attendance & Fee Receipts..."
          : pct < 100
          ? "Preparing Parent Dashboard..."
          : "Access Granted • Welcome Guardian",
    },
    student: {
      badge: "STUDENT PORTAL",
      color: "#81B29A",
      glow: "rgba(129,178,154,0.4)",
      status: (pct) =>
        pct < 35
          ? "Loading Scholar Profile..."
          : pct < 75
          ? "Syncing Gradebooks & Homework Tasks..."
          : pct < 100
          ? "Preparing Scholar Workspace..."
          : "Access Granted • Welcome Scholar",
    },
    public: {
      badge: "BSEB",
      color: "#F1917D",
      glow: "rgba(241,145,125,0.4)",
      status: (pct) =>
        pct < 40
          ? "Initializing ERP Network..."
          : pct < 85
          ? "Loading Campus Portals..."
          : pct < 100
          ? "Finalizing Experience..."
          : "Welcome to RMSPS",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.public;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="rmsps-cinematic-preloader"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            opacity: 0.9,
            transition: {
              duration: 0.7,
              ease: [0.76, 0, 0.24, 1], // Smooth exponential curtain lift
            },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0B10] text-[#F3EFE6] overflow-hidden select-none"
          style={{ willChange: "transform, opacity" }}
        >
          {/* ── GPU-Accelerated Optimized Ambient Light Aura ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[90px] transform-gpu"
              style={{ background: `${currentRole.color}20` }}
            />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D4AF6A]/12 blur-[90px] transform-gpu" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#3E5C76]/10 blur-[100px] transform-gpu" />
          </div>

          {/* ── Central Brand Container ── */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl w-full">
            {/* Step 1 & 2: Logo + Expanding RMSPS Text Lockup */}
            <motion.div
              layout
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1], // Apple & Linear luxury ease
              }}
              className="flex items-center justify-center gap-4 sm:gap-5 mb-8"
            >
              {/* 1. Compact Logo Emblem with Glow Ring */}
              <motion.div
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="relative shrink-0"
              >
                {/* Luminous Aura Ring */}
                <div
                  className="absolute -inset-2 rounded-full border bg-opacity-10 blur-[4px] animate-pulse"
                  style={{
                    borderColor: `${currentRole.color}60`,
                    background: `${currentRole.color}15`,
                  }}
                />

                {/* Compact Logo Frame (56px) */}
                <div
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 bg-[#0B0B10] p-1"
                  style={{
                    borderColor: `${currentRole.color}80`,
                    boxShadow: `0 0 24px ${currentRole.glow}`,
                  }}
                >
                  <Image
                    src="/icon-192.png"
                    alt="RMSPS Logo"
                    width={64}
                    height={64}
                    priority
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </motion.div>

              {/* 2. RMSPS Text Reveal (Appears beside logo as it slides left) */}
              <AnimatePresence>
                {phase === "brand-expanded" && (
                  <motion.div
                    initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col text-left overflow-hidden"
                  >
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-display font-extrabold text-3xl sm:text-4xl tracking-[0.14em]"
                        style={{
                          color: currentRole.color,
                          filter: `drop-shadow(0 0 16px ${currentRole.glow})`,
                        }}
                      >
                        RMSPS
                      </span>
                      <span
                        className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                        style={{
                          background: `${currentRole.color}15`,
                          borderColor: `${currentRole.color}40`,
                          color: currentRole.color,
                        }}
                      >
                        {currentRole.badge}
                      </span>
                    </div>
                    <span className="font-display text-xs sm:text-sm font-semibold tracking-wider text-[#F3EFE6]/90 truncate max-w-[280px] sm:max-w-none">
                      Residential Maa Saraswati Public School
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Step 3: Progress Bar & 1 to 100% Counter */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: phase === "brand-expanded" ? 1 : 0,
                y: phase === "brand-expanded" ? 0 : 12,
              }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-64 sm:w-80 space-y-2.5"
            >
              {/* Progress Line */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative p-[1px]">
                <motion.div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${currentRole.color}, #D4AF6A, ${currentRole.color})`,
                    boxShadow: `0 0 12px ${currentRole.glow}`,
                  }}
                />
              </div>

              {/* Status Indicator & Live Counter */}
              <div className="flex justify-between items-center text-xs font-mono text-[#8A8F98]">
                <span className="tracking-wider uppercase text-[11px] truncate text-left">
                  {currentRole.status(progress)}
                </span>
                <span className="text-[#F3EFE6] font-bold text-sm tracking-tight tabular-nums ml-2">
                  {progress}%
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── Bottom Institutional Stamp ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-5 flex items-center gap-2 text-[10px] font-mono text-[#8A8F98]/60 uppercase tracking-widest"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Secure Campus System • Kating Chowk, Pipra</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
