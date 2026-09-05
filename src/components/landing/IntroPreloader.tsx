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
  const [isDone, setIsDone] = useState(() => {
    if (typeof window !== "undefined" && role === "public") {
      return sessionStorage.getItem("rmsps_intro_shown") === "1";
    }
    return false;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Direct DOM Refs for 120 FPS GPU-accelerated updates without React re-render thrashing
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const lastStatusRef = useRef<string>("");
  const animFrameRef = useRef<number | null>(null);

  const roleConfig: Record<
    PreloaderRole,
    {
      badge?: string;
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
      color: "#F1917D",
      glow: "rgba(241,145,125,0.35)",
      getStatus: (pct) =>
        pct < 35
          ? "Connecting High-Performance ERP..."
          : pct < 75
          ? "Preparing Campus Portals..."
          : pct < 100
          ? "Finalizing Experience..."
          : "Welcome to RMSPS",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.public;

  useEffect(() => {
    if (isDone) return;

    // If loaded from back-forward cache (user clicking browser Back button), don't trap
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && role === "public") {
        setIsDone(true);
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    // 1. Reveal Brand Text with buttery smooth GPU transition
    const expandTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 60);

    // 2. 120 FPS High-Precision GPU Counter Loop (Apple-style quintic ease)
    const counterDuration = 1100;
    let startTime: number | null = null;

    const counterTimer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const linear = Math.min(1, elapsed / counterDuration);

        // Quintic smooth deceleration curve (1 - (1-t)^4)
        const eased = 1 - Math.pow(1 - linear, 4);
        const current = Math.max(1, Math.min(100, Math.round(eased * 100)));

        // Direct GPU Transform update via scaleX
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${eased})`;
        }
        if (progressTextRef.current) {
          progressTextRef.current.textContent = `${current}%`;
        }

        // Throttled status updates (changes only 3-4 times, zero layout thrashing)
        const nextStatus = currentRole.getStatus(current);
        if (statusTextRef.current && lastStatusRef.current !== nextStatus) {
          lastStatusRef.current = nextStatus;
          statusTextRef.current.textContent = nextStatus;
        }

        if (linear < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          // Reached 100%
          setTimeout(() => {
            if (role === "public") {
              try {
                sessionStorage.setItem("rmsps_intro_shown", "1");
              } catch {}
              setIsExiting(true);
              if (onComplete) onComplete();
              setTimeout(() => {
                setIsDone(true);
              }, 600);
            } else {
              // Role Login Transition:
              // Keep overlay firmly covering the screen so login page never flashes!
              if (onComplete) {
                onComplete();
              }
            }
          }, 120);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    }, 120);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      clearTimeout(expandTimer);
      clearTimeout(counterTimer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [role, onComplete, currentRole, isDone]);

  if (isDone) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#0B0B10] text-[#F3EFE6] select-none ${
        isExiting ? "pointer-events-none" : ""
      }`}
      style={{
        transform: isExiting ? "translate3d(0, -100%, 0)" : "translate3d(0, 0, 0)",
        transition: isExiting ? "transform 600ms cubic-bezier(0.76, 0, 0.24, 1)" : "none",
        willChange: "transform",
        contain: "paint layout",
      }}
    >
      {/* Lightweight Ambient Background Glow */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-25 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle, ${currentRole.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        {/* Animated Brand Identity Emblem */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 bg-black shrink-0 relative p-0.5 shadow-2xl transition-transform duration-500 hover:scale-105"
            style={{ borderColor: currentRole.color }}
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

          <div className="flex flex-col justify-center">
            <div
              className="flex items-center gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? "translate3d(0, 0, 0)" : "translate3d(-12px, 0, 0)",
                willChange: "transform, opacity",
              }}
            >
              <span className="font-display font-black text-2xl sm:text-3xl tracking-widest text-[#F3EFE6] whitespace-nowrap">
                RMSPS
              </span>
              {currentRole.badge && (
                <span
                  className="text-[11px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm shrink-0"
                  style={{
                    backgroundColor: `${currentRole.color}20`,
                    color: currentRole.color,
                    border: `1px solid ${currentRole.color}40`,
                  }}
                >
                  {currentRole.badge}
                </span>
              )}
            </div>
            <p
              className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#8A8F98] whitespace-nowrap transition-opacity duration-500 delay-100"
              style={{ opacity: isExpanded ? 1 : 0 }}
            >
              Excellence Since 2016
            </p>
          </div>
        </div>

        {/* 120 FPS GPU-Optimized ScaleX Progress Bar */}
        <div className="w-full space-y-2.5">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div
              ref={progressBarRef}
              className="h-full w-full rounded-full origin-left"
              style={{
                backgroundColor: currentRole.color,
                boxShadow: `0 0 16px ${currentRole.glow}`,
                transform: "scaleX(0.01)",
                willChange: "transform",
              }}
            />
          </div>

          {/* Real-time Status Text and Percentage */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono">
            <span
              ref={statusTextRef}
              className="text-[#8A8F98] tracking-wider whitespace-nowrap"
            >
              Initializing...
            </span>
            <span
              ref={progressTextRef}
              className="font-bold tracking-widest font-mono"
              style={{ color: currentRole.color }}
            >
              1%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
