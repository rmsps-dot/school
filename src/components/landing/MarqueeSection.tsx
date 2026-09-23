"use client";

import React, { useRef, useState, useEffect } from "react";

const MARQUEE_IMAGES = [
  "https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif",
  "https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif",
  "https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif",
  "https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif",
  "https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif",
  "https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif",
  "https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif",
  "https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif",
  "https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif",
  "https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif",
  "https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif",
  "https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif",
  "https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif",
  "https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif",
  "https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif",
  "https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif",
  "https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif",
  "https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif",
  "https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif",
  "https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif",
  "https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif",
];

const ROW_1_ORIGINAL = MARQUEE_IMAGES.slice(0, 11);
const ROW_2_ORIGINAL = MARQUEE_IMAGES.slice(11);

// Tripled for seamless scrolling loop
const ROW_1_TRIPLED = [...ROW_1_ORIGINAL, ...ROW_1_ORIGINAL, ...ROW_1_ORIGINAL];
const ROW_2_TRIPLED = [...ROW_2_ORIGINAL, ...ROW_2_ORIGINAL, ...ROW_2_ORIGINAL];

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const calculated = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
            setOffset(calculated);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const row1Transform = `translateX(${offset - 200}px)`;
  const row2Transform = `translateX(${-(offset - 200)}px)`;

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#0C0C0C] pt-24 sm:pt-32 md:pt-40 pb-10 flex flex-col gap-3"
    >
      {/* Row 1: Moves RIGHT on scroll */}
      <div
        className="flex gap-3 will-change-transform"
        style={{
          transform: row1Transform,
          willChange: "transform",
        }}
      >
        {ROW_1_TRIPLED.map((src, i) => (
          <div
            key={`row1-${i}`}
            className="w-[420px] h-[270px] min-w-[420px] rounded-2xl overflow-hidden bg-[#181818] shadow-lg flex-shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Motion showcase ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover rounded-2xl select-none pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* Row 2: Moves LEFT on scroll */}
      <div
        className="flex gap-3 will-change-transform"
        style={{
          transform: row2Transform,
          willChange: "transform",
        }}
      >
        {ROW_2_TRIPLED.map((src, i) => (
          <div
            key={`row2-${i}`}
            className="w-[420px] h-[270px] min-w-[420px] rounded-2xl overflow-hidden bg-[#181818] shadow-lg flex-shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Motion showcase ${i + 12}`}
              loading="lazy"
              className="w-full h-full object-cover rounded-2xl select-none pointer-events-none"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
