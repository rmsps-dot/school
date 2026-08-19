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
  const [shouldRender, setShouldRender] = useState(false);
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
    // For public landing intro: only play once per session / browser tab.
    // When navigating back from login or other pages, DO NOT replay or jump to top!
    if (role === "public") {
      const hasSeen = sessionStorage.getItem("has_seen_rmsps_intro");
      if (hasSeen) {
        setIsDone(true);
        return;
      }
      sessionStorage.setItem("has_seen_rmsps_intro", "true");
    }

    setShouldRender(true);

    // 1. Reveal Brand Text with GPU transform
    const expandTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 120);

    // 2. 120 FPS GPU-Accelerated Step Loop
    const counterDuration = 1000;
    let startTime: number | null = null;

    const counterTimer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const linear = Math.min(1, elapsed / counterDuration);

        // Smooth cubic ease-out curve
        const eased = 1 - Math.pow(1 - linear, 3);
        const current = Math.max(1, Math.min(100, Math.round(eased * 100)));

        // Direct GPU Transform update via scaleX
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
          // Reached 100%
          setTimeout(() => {
            setIsExiting(true);
            if (onComplete) {
              onComplete();
            }
            // For role transitions, keep overlay covering screen until redirect completes
            if (role === "public") {
              setTimeout(() => {
                setIsDone(true);
              }, 500);
            }
          }, 120);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    }, 180);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(counterTimer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [role, onComplete, currentRole]);

  if (isDone || !shouldRender) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#0B0B10] text-[#F3EFE6] select-none ${
        isExiting ? "pointer-events-none transition-transform duration-500 ease-out" : ""
      }`}
      style={{
        transform: isExiting ? "translateY(-100%)" : "translateY(0%)",
        willChange: "transform",
      }}
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle, ${currentRole.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">
        {/* Animated Brand Identity Emblem */}
        <div className="flex items-center gap-3.5 mb-6">
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

          <div className="overflow-hidden flex flex-col justify-center">
            <div
              className="flex items-center gap-2 overflow-hidden transition-all duration-500 ease-out"
              style={{
                maxWidth: isExpanded ? "260px" : "0px",
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? "translateX(0px)" : "translateX(-15px)",
                willChange: "transform, opacity, max-width",
              }}
            >
              <span className="font-display font-black text-2xl sm:text-3xl tracking-widest text-[#F3EFE6] whitespace-nowrap">
                RMSPS
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm"
                style={{
                  backgroundColor: `${currentRole.color}20`,
                  color: currentRole.color,
                  border: `1px solid ${currentRole.color}40`,
                }}
              >
                {currentRole.badge}
              </span>
            </div>
            <p
              className="text-[10px] font-mono tracking-widest uppercase text-[#8A8F98] whitespace-nowrap transition-opacity duration-500 delay-150"
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
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span
              ref={statusTextRef}
              className="text-[#8A8F98] tracking-wider truncate max-w-[200px]"
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
