"use client";

import { useState, useEffect, useRef } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Direct DOM Refs for 120 FPS GPU-accelerated updates without React re-render thrashing
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const roleConfig: Record<
    PreloaderRole,
    {
      badge: string;
      color: string;
      glow: string;
      getStatus: (pct: number) => string;
    }
  > = {
    admin: {
      badge: "ADMIN PORTAL",
      color: "#F1917D",
      glow: "rgba(241,145,125,0.35)",
      getStatus: (pct) =>
        pct < 35
          ? "Authenticating Admin Session..."
          : pct < 75
          ? "Loading Governance & ERP..."
          : pct < 100
          ? "Preparing Workspace..."
          : "Access Granted • Welcome Admin",
    },
    teacher: {
      badge: "TEACHER PORTAL",
      color: "#3E5C76",
      glow: "rgba(62,92,118,0.35)",
      getStatus: (pct) =>
        pct < 35
          ? "Verifying Faculty Credentials..."
          : pct < 75
          ? "Syncing Attendance Geofence..."
          : pct < 100
          ? "Preparing Workspace..."
          : "Access Granted • Welcome Faculty",
    },
    parent: {
      badge: "PARENT PORTAL",
      color: "#D4AF6A",
      glow: "rgba(212,175,106,0.35)",
      getStatus: (pct) =>
        pct < 35
          ? "Connecting Ward Records..."
          : pct < 75
          ? "Syncing Daily Attendance..."
          : pct < 100
          ? "Preparing Dashboard..."
          : "Access Granted • Welcome Guardian",
    },
    student: {
      badge: "STUDENT PORTAL",
      color: "#81B29A",
      glow: "rgba(129,178,154,0.35)",
      getStatus: (pct) =>
        pct < 35
          ? "Loading Scholar Profile..."
          : pct < 75
          ? "Syncing Gradebooks & Tasks..."
          : pct < 100
          ? "Preparing Workspace..."
          : "Access Granted • Welcome Scholar",
    },
    public: {
      badge: "BSEB",
      color: "#F1917D",
      glow: "rgba(241,145,125,0.35)",
      getStatus: (pct) =>
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

  useEffect(() => {
    // 1. Reveal Brand Text with GPU transform
    const expandTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 150);

    // 2. 120 FPS GPU-Accelerated Step Loop (Zero CPU layout thrashing)
    const counterDelay = 220;
    const counterDuration = 1100; // Fast and snappy progression
    let startTime: number | null = null;

    const counterTimer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const linear = Math.min(1, elapsed / counterDuration);

        // Smooth cubic ease-out curve
        const eased = 1 - Math.pow(1 - linear, 3);
        const current = Math.max(1, Math.min(100, Math.round(eased * 100)));

        // Direct GPU Transform update via scaleX (0 layout recalculations)
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${eased})`;
        }
        if (progressTextRef.current) {
          progressTextRef.current.textContent = `${current}%`;
        }
        if (statusTextRef.current) {
          statusTextRef.current.textContent = currentRole.getStatus(current);
        }

        if (linear < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          // Reached 100% -> Smooth curtain slide up
          setTimeout(() => {
            setIsExiting(true);
            if (onComplete) {
              onComplete();
            }
            setTimeout(() => {
              setIsDone(true);
            }, 600);
          }, 150);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    }, counterDelay);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(counterTimer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentRole, onComplete]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0B10] text-[#F3EFE6] select-none transition-all duration-600 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting
          ? "-translate-y-full opacity-90 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
      style={{
        willChange: "transform, opacity",
        transform: isExiting ? "translate3d(0, -100%, 0)" : "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
        backgroundImage: `radial-gradient(circle at 50% 45%, ${currentRole.color}18 0%, rgba(11,11,16,0.99) 70%)`,
      }}
    >
      {/* ── Center Brand Lockup ── */}
      <div className="flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md w-full">
        {/* Brand Row */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          {/* Logo Crest */}
          <div
            className="relative w-[50px] h-[50px] sm:w-[58px] sm:h-[58px] rounded-full overflow-hidden border-2 bg-[#0B0B10] p-1 shrink-0 shadow-lg"
            style={{
              borderColor: currentRole.color,
              boxShadow: `0 0 16px ${currentRole.glow}`,
              transform: "translateZ(0)",
            }}
          >
            <Image
              src="/icon-192.png"
              alt="RMSPS Logo"
              width={58}
              height={58}
              priority
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* Text Container with GPU opacity + translate3d reveal (Zero layout reflow) */}
          <div
            className={`flex flex-col text-left transition-all duration-400 ease-out ${
              isExpanded
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2 pointer-events-none"
            }`}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span
                className="font-display font-black text-2xl sm:text-3xl tracking-[0.12em]"
                style={{ color: currentRole.color }}
              >
                RMSPS
              </span>
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0"
                style={{
                  background: `${currentRole.color}15`,
                  borderColor: `${currentRole.color}40`,
                  color: currentRole.color,
                }}
              >
                {currentRole.badge}
              </span>
            </div>
            <span className="font-display text-[10px] sm:text-xs font-semibold tracking-wider text-[#F3EFE6]/90 whitespace-nowrap">
              Residential Maa Saraswati Public School
            </span>
          </div>
        </div>

        {/* Progress Bar & Counter Container */}
        <div className="w-56 sm:w-68 space-y-2.5">
          {/* 100% GPU-accelerated track with scaleX (Zero CPU Paint overhead) */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
            <div
              ref={progressBarRef}
              className="h-full w-full rounded-full origin-left"
              style={{
                transform: "scaleX(0.01)",
                backgroundColor: currentRole.color,
                boxShadow: `0 0 10px ${currentRole.glow}`,
                willChange: "transform",
                transformOrigin: "left center",
              }}
            />
          </div>

          {/* Status Text & Tabular Percentage */}
          <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono text-[#8A8F98]">
            <span ref={statusTextRef} className="tracking-wider uppercase truncate text-left">
              {currentRole.getStatus(1)}
            </span>
            <span
              ref={progressTextRef}
              className="text-[#F3EFE6] font-bold text-xs tabular-nums ml-2 shrink-0"
            >
              1%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Institutional Stamp */}
      <div className="absolute bottom-5 flex items-center gap-2 text-[10px] font-mono text-[#8A8F98]/70 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Secure Campus System • Kating Chowk, Pipra</span>
      </div>
    </div>
  );
}
