"use client";

import React from "react";
import Link from "next/link";
import FadeIn from "./FadeIn";
import Magnet from "./Magnet";
import ContactButton from "./ContactButton";

interface HeroSectionProps {
  onOpenPortals?: () => void;
}

export default function HeroSection({ onOpenPortals }: HeroSectionProps) {
  const navLinks = [
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <section className="relative h-screen w-full flex flex-col justify-between overflow-x-clip bg-[#0C0C0C] font-kanit select-none">
      {/* ── Top Navbar ── */}
      <FadeIn delay={0} y={-20} duration={0.6} as="nav" className="w-full z-20">
        <div className="w-full flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#D7E2EA] font-medium uppercase tracking-wider text-sm md:text-lg lg:text-[1.4rem] hover:opacity-70 transition-opacity duration-200"
            >
              {link.label}
            </a>
          ))}
          {/* Quick ERP Portal link if available */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D7E2EA]/30 text-[#D7E2EA] text-xs font-mono uppercase tracking-widest hover:border-[#D7E2EA] hover:bg-white/5 transition-all"
          >
            Portal Login
          </Link>
        </div>
      </FadeIn>

      {/* ── Hero Heading ── */}
      <div className="w-full overflow-hidden z-0 mt-6 sm:mt-4 md:-mt-5">
        <FadeIn delay={0.15} y={40} duration={0.8}>
          <h1 className="hero-heading font-black uppercase tracking-tight leading-none whitespace-nowrap w-full text-center text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw]">
            Hi, Welcome to RMSPS
          </h1>
        </FadeIn>
      </div>

      {/* ── Centered Hero Portrait with Magnet ── */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px] top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 pointer-events-auto">
        <FadeIn delay={0.6} y={30} duration={0.9}>
          <Magnet
            padding={150}
            strength={3}
            activeTransition="transform 0.3s ease-out"
            inactiveTransition="transform 0.6s ease-in-out"
            className="w-full flex items-end justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.postimg.cc/rphHSytf/Chat-GPT-Image-Sep-23-2026-08-12-15-PM.png"
              alt="RMSPS 3D Centerpiece"
              loading="eager"
              className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-none select-none"
            />
          </Magnet>
        </FadeIn>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="w-full flex justify-between items-end pb-7 sm:pb-8 md:pb-10 px-6 md:px-10 z-20">
        {/* Left copy */}
        <FadeIn delay={0.35} y={20} duration={0.7} className="max-w-[160px] sm:max-w-[220px] md:max-w-[260px]">
          <p
            className="text-[#D7E2EA] font-light uppercase tracking-wide leading-snug"
            style={{ fontSize: "clamp(0.75rem, 1.4vw, 1.5rem)" }}
          >
            a premier institution driven by crafting striking futures and unforgettable minds
          </p>
        </FadeIn>

        {/* Right Contact button */}
        <FadeIn delay={0.5} y={20} duration={0.7}>
          <ContactButton href="#contact" label="Contact Me" />
        </FadeIn>
      </div>
    </section>
  );
}
