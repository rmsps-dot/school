"use client";

import React from "react";
import Link from "next/link";

interface LiveProjectButtonProps {
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function LiveProjectButton({
  label = "Live Project",
  href,
  onClick,
  className = "",
}: LiveProjectButtonProps) {
  const combinedClasses = `inline-flex items-center justify-center rounded-full border-2 border-[#D7E2EA] text-[#D7E2EA] font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base hover:bg-[#D7E2EA]/10 transition-colors duration-200 cursor-pointer select-none font-kanit ${className}`;

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} onClick={onClick} className={combinedClasses}>
          {label}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} className={combinedClasses}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={combinedClasses}>
      {label}
    </button>
  );
}
