"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ─── NUMBER COUNTER HOOK (Geist Mono application) ─── */
function useCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

interface Props {
  value: number;
  label: string;
  icon?: React.ReactNode; // Optional now, since Masterplan prefers big numbers over icons
  color?: string; // Optional, might use role tint instead
  delay?: number;
  badge?: string;
  href?: string;
}

export default function StatCard({ value, label, badge, href }: Props) {
  const count = useCounter(value);

  const content = (
    <div className="surface-card rounded-3xl p-8 flex flex-col justify-between w-full h-full min-h-[140px] relative overflow-hidden group">
      <div>
        <p className="text-mist text-sm font-medium tracking-wide uppercase mb-1">{label}</p>
        <div className="flex items-end gap-3">
          {/* Masterplan rule: Big stat numbers in Syne, but actually it says: 
              "Every numeric value in tables/dashboards... use Geist Mono"
              Wait, it says "Big-number spec callouts: bold number... Display face Syne: hero headlines, large stat numbers ONLY."
              So large stat numbers get Syne. Tables get Mono. */}
          <p className="text-5xl font-display font-bold text-parchment group-hover:text-coral transition-colors">
            {count.toLocaleString()}
          </p>
          {badge && (
            <span className="mb-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-coral/10 text-coral border border-coral/20">
              {badge}
            </span>
          )}
        </div>
      </div>
      
      {/* Subtle bottom accent line that expands on hover */}
      <div className="absolute bottom-0 left-0 h-1 bg-coral w-0 group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  );

  return (
    <div className="h-full block">
      {href ? (
        <Link href={href} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
