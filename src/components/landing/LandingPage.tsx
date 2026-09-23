"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, X, Phone, Mail, MapPin, ArrowUpRight, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import HeroSection from "./HeroSection";
import MarqueeSection from "./MarqueeSection";
import AboutSection from "./AboutSection";
import ServicesSection from "./ServicesSection";
import ProjectsSection from "./ProjectsSection";

interface Notice {
  title: string;
  content: string;
  created_at: string;
}

interface LandingPageProps {
  notices?: Notice[];
}

export default function LandingPage({ notices = [] }: LandingPageProps) {
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isNoticeDrawerOpen, setIsNoticeDrawerOpen] = useState(false);

  useEffect(() => {
    document.title = "RMSPS — 3D Creator & Excellence in Education";
  }, []);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <main className="relative w-full bg-[#0C0C0C] text-[#D7E2EA] font-kanit overflow-x-clip selection:bg-[#B600A8] selection:text-white">
      {/* ── 1. HERO SECTION ── */}
      <HeroSection onOpenPortals={() => {}} />

      {/* ── 2. MARQUEE SECTION ── */}
      <MarqueeSection />

      {/* ── 3. ABOUT SECTION ── */}
      <AboutSection />

      {/* ── 4. SERVICES SECTION ── */}
      <ServicesSection />

      {/* ── 5. PROJECTS SECTION ── */}
      <ProjectsSection />

      {/* ── 6. CONTACT & INSTITUTIONAL FOOTER ── */}
      <footer
        id="contact"
        className="relative w-full bg-[#080808] border-t border-[#D7E2EA]/10 px-6 sm:px-10 md:px-16 pt-20 pb-16 font-kanit text-[#D7E2EA] z-20"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 sm:gap-16 pb-16 border-b border-[#D7E2EA]/10">
          {/* Brand & Vision */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <h3 className="hero-heading font-black text-3xl sm:text-4xl uppercase tracking-tight">
              RMSPS
            </h3>
            <p className="text-sm sm:text-base font-light text-[#D7E2EA]/70 leading-relaxed max-w-md">
              Residential Maa Saraswati Public School — Crafting striking futures, disciplined character, and holistic leadership in Bihar since establishment.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D7E2EA] text-[#0C0C0C] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                <span>Online Admission</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              {notices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsNoticeDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#D7E2EA]/40 text-[#D7E2EA] text-xs font-medium uppercase tracking-wider hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Circulars ({notices.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Direct ERP Portals */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <p className="text-xs uppercase font-medium tracking-widest text-[#D7E2EA]/40">
              Institutional Portals
            </p>
            <Link
              href="/login?role=student"
              className="text-sm hover:text-white transition-colors uppercase tracking-wider flex items-center justify-between group py-1"
            >
              <span>Student Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/login?role=parent"
              className="text-sm hover:text-white transition-colors uppercase tracking-wider flex items-center justify-between group py-1"
            >
              <span>Parent Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/login?role=teacher"
              className="text-sm hover:text-white transition-colors uppercase tracking-wider flex items-center justify-between group py-1"
            >
              <span>Teacher Desk</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/login?role=admin"
              className="text-sm hover:text-white transition-colors uppercase tracking-wider flex items-center justify-between group py-1"
            >
              <span>Admin Suite</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <p className="text-xs uppercase font-medium tracking-widest text-[#D7E2EA]/40">
              Get In Touch
            </p>
            <div className="flex items-start gap-3 text-sm font-light text-[#D7E2EA]/80">
              <MapPin className="w-4 h-4 text-[#B600A8] flex-shrink-0 mt-0.5" />
              <span>Kating Chowk, Maheshpur road, Pipra, Bihar 852109</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-light text-[#D7E2EA]/80">
              <Phone className="w-4 h-4 text-[#B600A8] flex-shrink-0" />
              <a href="tel:+919546536279" className="hover:text-white transition-colors">
                +91 95465 36279
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm font-light text-[#D7E2EA]/80">
              <Mail className="w-4 h-4 text-[#B600A8] flex-shrink-0" />
              <a href="mailto:srzsurazzrajput@gmail.com" className="hover:text-white transition-colors">
                srzsurazzrajput@gmail.com
              </a>
            </div>
            <p className="text-xs font-mono text-[#D7E2EA]/40 pt-2">
              UDISE: 10060603629 | REG: PSS217/19
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono uppercase tracking-wider text-[#D7E2EA]/40">
          <p>© 2026 Residential Maa Saraswati Public School. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-[#D7E2EA] transition-colors">About</a>
            <a href="#services" className="hover:text-[#D7E2EA] transition-colors">Services</a>
            <a href="#projects" className="hover:text-[#D7E2EA] transition-colors">Projects</a>
            <a href="#contact" className="hover:text-[#D7E2EA] transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* ── Circulars Drawer / Modal ── */}
      <AnimatePresence>
        {isNoticeDrawerOpen && (
          <div
            onClick={() => setIsNoticeDrawerOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] border border-[#D7E2EA]/20 rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col p-6 sm:p-8 shadow-2xl cursor-default"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#D7E2EA]/10">
                <div className="flex items-center gap-2 text-sm font-mono text-[#B600A8]">
                  <Bell className="w-4 h-4" />
                  <span className="uppercase tracking-widest font-bold">Official Circulars</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNoticeDrawerOpen(false)}
                  className="p-1 rounded-lg border border-[#D7E2EA]/20 text-[#D7E2EA]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto divide-y divide-[#D7E2EA]/10 pt-2 flex-1">
                {notices.map((notice, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedNotice(notice);
                      setIsNoticeDrawerOpen(false);
                    }}
                    className="py-4 hover:bg-white/5 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <p className="text-[10px] font-mono text-[#D7E2EA]/50 uppercase mb-1">
                      {formatDate(notice.created_at)}
                    </p>
                    <h4 className="text-base font-medium text-[#D7E2EA] uppercase">
                      {notice.title}
                    </h4>
                    <p className="text-xs text-[#D7E2EA]/60 line-clamp-2 mt-1 font-light">
                      {notice.content}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Single Notice Detail Modal ── */}
      <AnimatePresence>
        {selectedNotice && (
          <div
            onClick={() => setSelectedNotice(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] border border-[#D7E2EA]/20 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5 cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#D7E2EA]/10">
                <div className="flex items-center gap-2 text-xs font-mono text-[#B600A8]">
                  <GraduationCap className="w-4 h-4" />
                  <span className="uppercase tracking-widest font-bold">School Circular</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="p-1 rounded-lg border border-[#D7E2EA]/20 text-[#D7E2EA]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono text-[#D7E2EA]/50">
                  Published: {formatDate(selectedNotice.created_at)}
                </p>
                <h3 className="font-bold text-xl uppercase text-white">
                  {selectedNotice.title}
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-light text-[#D7E2EA]/80 pt-2">
                  {selectedNotice.content}
                </p>
              </div>

              <div className="pt-4 border-t border-[#D7E2EA]/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="bg-[#D7E2EA] text-[#0C0C0C] px-6 py-2 rounded-full text-xs font-bold font-mono uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Close Circular
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
