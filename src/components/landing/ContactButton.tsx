"use client";

import React from "react";
import Link from "next/link";

interface ContactButtonProps {
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function ContactButton({
  label = "Contact Me",
  href,
  onClick,
  className = "",
}: ContactButtonProps) {
  const buttonStyles: React.CSSProperties = {
    background: "linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)",
    boxShadow: "0px 4px 4px rgba(181, 1, 167, 0.25), inset 4px 4px 12px #7721B1",
    outline: "2px solid white",
    outlineOffset: "-3px",
  };

  const combinedClasses = `inline-flex items-center justify-center rounded-full text-white font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none font-kanit ${className}`;

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} onClick={onClick} style={buttonStyles} className={combinedClasses}>
          {label}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} style={buttonStyles} className={combinedClasses}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={buttonStyles} className={combinedClasses}>
      {label}
    </button>
  );
}
