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
  const [progress, setProgress] = useState(1);
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Reveal RMSPS brand text after 200ms
    const expandTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 200);

    // 2. Exact 1-to-1 Synced Frame Counter (Zero CSS Transition Lag)
    const counterDelay = 300;
    const counterDuration = 1250; // Smooth ~1.25s progression
    let startTime: number | null = null;

    const counterTimer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const linear = Math.min(1, elapsed / counterDuration);

        // Smooth cubic ease-out
        const eased = 1 - Math.pow(1 - linear, 3);
        const current = Math.max(1, Math.min(100, Math.round(eased * 100)));
        setProgress(current);

        if (linear < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          // Reached 100% synchronously -> Hold briefly then curtain slide up
          setTimeout(() => {
            setIsExiting(true);
            if (onComplete) {
              onComplete();
            }
            setTimeout(() => {
              setIsDone(true);
            }, 650);
          }, 180);
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
  }, [onComplete]);

  if (isDone) return null;

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
      glow: "rgba(241,145,125,0.35)",
      status: (pct) =>
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
      status: (pct) =>
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
      status: (pct) =>
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
      status: (pct) =>
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
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0B10] text-[#F3EFE6] select-none transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? "-translate-y-full opacity-90 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
      style={{
        willChange: "transform",
        backgroundImage: `radial-gradient(circle at 50% 45%, ${currentRole.color}15 0%, rgba(11,11,16,0.98) 70%)`,
      }}
    >
      {/* ── Center Brand Lockup ── */}
      <div className="flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* Brand Row */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          {/* Logo Crest */}
          <div
            className="relative w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] rounded-full overflow-hidden border-2 bg-[#0B0B10] p-1 shrink-0 shadow-lg"
            style={{
              borderColor: currentRole.color,
              boxShadow: `0 0 20px ${currentRole.glow}`,
            }}
          >
            <Image
              src="/icon-192.png"
              alt="RMSPS Logo"
              width={60}
              height={60}
              priority
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* Text Container with Smooth CSS Reveal */}
          <div
            className={`flex flex-col text-left overflow-hidden transition-all duration-500 ease-out ${
              isExpanded
                ? "max-w-[320px] opacity-100 translate-x-0"
                : "max-w-0 opacity-0 -translate-x-3 pointer-events-none"
            }`}
          >
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span
                className="font-display font-extrabold text-2xl sm:text-3xl tracking-[0.14em]"
                style={{ color: currentRole.color }}
              >
                RMSPS
              </span>
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                style={{
                  background: `${currentRole.color}15`,
                  borderColor: `${currentRole.color}40`,
                  color: currentRole.color,
                }}
              >
                {currentRole.badge}
              </span>
            </div>
            <span className="font-display text-[11px] sm:text-xs font-semibold tracking-wider text-[#F3EFE6]/90 whitespace-nowrap">
              Residential Maa Saraswati Public School
            </span>
          </div>
        </div>

        {/* Progress Bar & Counter Container */}
        <div className="w-64 sm:w-72 space-y-2.5">
          {/* 1:1 Instant Synchronized Progress Track (Zero CSS transition delay) */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: currentRole.color,
                boxShadow: `0 0 10px ${currentRole.glow}`,
              }}
            />
          </div>

          {/* Status Text & Tabular Percentage */}
          <div className="flex justify-between items-center text-[11px] font-mono text-[#8A8F98]">
            <span className="tracking-wider uppercase truncate text-left">
              {currentRole.status(progress)}
            </span>
            <span className="text-[#F3EFE6] font-bold text-xs tabular-nums ml-2 shrink-0">
              {progress}%
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
