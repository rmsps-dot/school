"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Shield, Award, Users, BookOpen,
  GraduationCap, Bell, Phone, MapPin, Mail, Sparkles,
  ChevronRight, ChevronLeft, Check, Radio, Activity,
  Clock, Trophy, Laptop, HeartHandshake, Compass,
  X, Menu, MessageSquare, Play,
} from "lucide-react";

import IntroPreloader from "@/components/landing/IntroPreloader";

/* ══════════════════════════════════════════════════════════════════════
 * ─── CENTRALIZED ASSETS & CONTENT CONFIGURATION ───────────────────────
 * Easily modify any video URL, image, text, or contact detail here.
 * ══════════════════════════════════════════════════════════════════════ */
export const LANDING_CONFIG = {
  hero: {
    videoUrl: "https://assets.pebblelife.com/2_I3_A0499_2_7_b9915cc716.webm",
    posterImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1920",
    badge: "BSEB Affiliated Code: 852109",
    titleLine1: "MEET",
    titleLine2: "RMSPS",
    tagline: "Residential Maa Saraswati Public School",
    location: "Kating Chowk, Pipra, Bihar • Est. 2016",
    helpline: "+91 95465 36279",
  },
  intro: {
    heading: "We’ve reinvented residential education.",
    subheading: "RMSPS anticipates your scholar's every need.",
  },
  states: [
    {
      title: "On-Campus",
      tag: "Smart Presence",
      desc: "Encrypted GPS geofencing authenticates daily arrival in under 30 seconds with 0 proxy roll-calls and instant SMS parent alerts.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600",
    },
    {
      title: "In-Residence",
      tag: "Supervised Living",
      desc: "Separate secure dormitories, nutritious hygienic dining, morning yoga, and structured evening study halls under 24/7 warden care.",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1600",
    },
    {
      title: "Connected",
      tag: "Guardian Sync",
      desc: "Real-time attendance push alerts, terminal exam scorecards, digital fee receipts, and official circulars directly on your phone.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600",
    },
  ],
  features: [
    {
      title: "100% Smart Geofenced",
      desc: "No more manual registers. Encrypted GPS boundaries authenticate student & faculty arrival in seconds, instantly notifying guardians.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600",
    },
    {
      title: "Practical STEM Labs",
      desc: "Hands-on physics optics, chemistry titration stations, and robotics programming preparing scholars for BSEB board distinction.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600",
    },
    {
      title: "24/7 Supervised Hostels",
      desc: "Safe dormitories, nutritious hygienic dining, morning yoga, and structured evening study halls under dedicated warden supervision.",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1600",
    },
    {
      title: "Instant Results Engine",
      desc: "Standardized terminal exam marks evaluation, automated rank analytics, and instant downloadable gradebooks for parents.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600",
    },
  ],
  stories: [
    {
      title: "Parent Story: Real-Time Transparency with Geofenced Attendance",
      date: "Session 2025–26",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800",
    },
    {
      title: "Alumni Story: From RMSPS Classrooms to Board Distinction",
      date: "Batch of 2024",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800",
    },
    {
      title: "Faculty Review: High-Impact Concept Learning in Practical Science Labs",
      date: "Department of Physics",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800",
    },
    {
      title: "Hostel Life: Nurturing Environment with Supervised Evening Study",
      date: "Residential Wing",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800",
    },
  ],
  portals: [
    {
      id: "student",
      role: "Student Hub",
      category: "SCHOLARS",
      route: "/login?role=student",
      accent: "#81B29A",
      headline: "Terminal Scorecards & Assignment Hub",
      desc: "Instant access to BSEB exam scorecards, subject progress analytics, homework tasks, and leave applications.",
      stat: "94.8% Avg Scorecard",
    },
    {
      id: "parent",
      role: "Parent Portal",
      category: "GUARDIANS",
      route: "/login?role=parent",
      accent: "#D4AF6A",
      headline: "Live Ward Tracking & Digital Fee Receipts",
      desc: "Real-time morning arrival verification, terminal gradebooks, digital fee deposit history, and official school circulars.",
      stat: "Real-Time Tracking",
    },
    {
      id: "teacher",
      role: "Teacher Desk",
      category: "FACULTY",
      route: "/login?role=teacher",
      accent: "#3E5C76",
      headline: "Geofenced Attendance & Marks Entry",
      desc: "Fast geofenced classroom attendance marking, terminal marks entry, and direct student communication.",
      stat: "< 30s Attendance",
    },
    {
      id: "admin",
      role: "Admin Suite",
      category: "GOVERNANCE",
      route: "/login?role=admin",
      accent: "#F1917D",
      headline: "Institutional ERP & Financial Audits",
      desc: "Admissions verification, staff allocations, geofence radius configuration, and complete financial ledgers.",
      stat: "1,000+ Active Scholars",
    },
  ],
  contact: {
    address: "Kating Chowk, Maheshpur road, Pipra, Bihar 852109",
    phone: "+91 95465 36279",
    email: "srzsurazzrajput@gmail.com",
    bsebCode: "852109",
  },
};

const defaultNotices = [
  {
    title: "Admissions Open — Academic Session 2026–27",
    content:
      "Online and offline registrations are officially open for Primary, Secondary, and Senior Secondary classes. Limited residential hostel seats available for boys and girls.",
    created_at: new Date().toISOString(),
  },
  {
    title: "BSEB Board Examination Guidance & Mock Series",
    content:
      "Special practical labs and structured mock evaluation tests for BSEB board candidates will commence this month. Consult your teacher portal for timetable schedules.",
    created_at: new Date().toISOString(),
  },
  {
    title: "Annual Science Exhibition & Sports Meet",
    content:
      "The annual inter-house science exhibition and athletics tournament schedule is officially published. Parents and guardians are cordially invited to attend.",
    created_at: new Date().toISOString(),
  },
];

/* ─── SECTION 1: ANNOUNCEMENT BAR ─── */
function AnnouncementBar() {
  return (
    <div className="fixed top-0 left-0 w-full z-[70] bg-[#FB7339] text-white py-2 px-3 text-center text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md">
      <span>Now Enrolling Session 2026–27</span>
      <span className="opacity-40">|</span>
      <Link href="/register" className="underline hover:opacity-80 transition-opacity">
        Apply Online
      </Link>
      <span className="opacity-40 hidden sm:inline">|</span>
      <a href={`tel:${LANDING_CONFIG.contact.phone}`} className="underline hover:opacity-80 transition-opacity hidden sm:inline">
        Helpline: {LANDING_CONFIG.contact.phone}
      </a>
    </div>
  );
}

/* ─── SECTION 2: NAVBAR ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const navLinks = [
    { name: "academics", href: "#experience" },
    { name: "campus os", href: "#features" },
    { name: "portals", href: "#portals" },
    { name: "circulars", href: "#notices" },
  ];

  return (
    <>
      <nav
        className={`fixed top-[32px] left-0 w-full z-[60] transition-all duration-300 ${
          scrolled ? "py-3 bg-[#0B0B10]/90 backdrop-blur-xl border-b border-white/10" : "py-5 sm:py-7"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FB7339] p-0.5 bg-black shrink-0">
              <Image
                src="/icon-192.png"
                alt="RMSPS"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="text-white text-xl sm:text-2xl font-display font-black tracking-tighter uppercase">
              RMSPS
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-white/80 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
              >
                {link.name}
              </a>
            ))}
            <Link
              href="/login"
              className="bg-white text-black px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 font-bold"
            >
              Portal Login
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-white p-2 rounded-lg border border-white/10"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-[#0B0B10] p-6 sm:p-10 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-6">
              <span className="text-white text-2xl font-display font-black tracking-tighter uppercase">
                RMSPS
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-2"
                aria-label="Close Navigation Menu"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex flex-col gap-6 py-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-3xl font-display uppercase font-bold hover:text-[#FB7339] transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#FB7339] text-3xl font-display uppercase font-bold"
              >
                Portal Login →
              </Link>
            </div>
            <div className="text-xs font-mono text-white/50 uppercase border-t border-white/10 pt-6">
              BSEB Code: 852109 • Pipra, Bihar
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── SECTION 3: HERO SECTION ─── */
function Hero() {
  return (
    <section className="relative min-h-[92svh] sm:min-h-screen w-full flex flex-col justify-between pt-28 sm:pt-36 pb-12 sm:pb-16 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Poster & Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={LANDING_CONFIG.hero.posterImage}
          alt="RMSPS Campus"
          fill
          priority
          className="object-cover opacity-30"
          sizes="100vw"
        />
        {LANDING_CONFIG.hero.videoUrl && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          >
            <source src={LANDING_CONFIG.hero.videoUrl} type="video/webm" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B10] via-[#0B0B10]/70 to-[#0B0B10]/50" />
      </div>

      {/* Top Metadata Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-[11px] sm:text-xs font-mono text-mist">
        <div className="flex items-center gap-2 text-[#FB7339]">
          <span className="w-2 h-2 rounded-full bg-[#FB7339] animate-pulse" />
          <span className="uppercase tracking-widest font-bold">{LANDING_CONFIG.hero.badge}</span>
        </div>
        <div className="uppercase tracking-widest hidden sm:block">
          {LANDING_CONFIG.hero.location}
        </div>
      </div>

      {/* Center Giant Typographic Sculpture */}
      <div className="relative z-10 py-8 sm:py-16 text-left space-y-4 sm:space-y-6">
        <p className="text-xs sm:text-sm font-mono tracking-[0.25em] uppercase text-[#FB7339] font-bold">
          {LANDING_CONFIG.hero.tagline}
        </p>

        <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] leading-[0.95] tracking-tighter text-white uppercase">
          {LANDING_CONFIG.hero.titleLine1} <br />
          <span className="bg-gradient-to-r from-[#FB7339] via-[#D4AF6A] to-[#FB7339] bg-clip-text text-transparent">
            {LANDING_CONFIG.hero.titleLine2}
          </span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
          <p className="lg:col-span-7 text-white/80 text-sm sm:text-lg leading-relaxed font-light max-w-xl">
            A premier BSEB-affiliated residential institution in Bihar, nurturing intellectual brilliance, moral character, and laboratory mastery since 2016.
          </p>
          <div className="lg:col-span-5 flex flex-wrap gap-3 sm:gap-4 items-center lg:justify-end">
            <Link
              href="/login?role=student"
              className="btn-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2.5 shadow-xl shadow-[#FB7339]/20"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Hub</span>
            </Link>
            <Link
              href="/login?role=parent"
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/15 hover:border-[#D4AF6A] text-white hover:bg-white/5 transition-all bg-black/60"
            >
              <span>Parent Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Authority Metrics Matrix */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t border-white/10 pt-6">
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#FB7339]">98%</p>
          <p className="text-[10px] sm:text-[11px] font-mono text-mist uppercase tracking-wider">Board Pass Distinction</p>
        </div>
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#D4AF6A]">15+ Yrs</p>
          <p className="text-[10px] sm:text-[11px] font-mono text-mist uppercase tracking-wider">Educational Heritage</p>
        </div>
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#81B29A]">1,000+</p>
          <p className="text-[10px] sm:text-[11px] font-mono text-mist uppercase tracking-wider">Active Scholars</p>
        </div>
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#3E5C76]">20+</p>
          <p className="text-[10px] sm:text-[11px] font-mono text-mist uppercase tracking-wider">Master Faculty</p>
        </div>
      </div>
    </section>
  );
}

/* ─── CONTINUOUS GPU HARDWARE TICKER ─── */
function InfiniteMarquee() {
  const items = [
    "Residential Maa Saraswati Public School",
    "BSEB Affiliation Code: 852109",
    "Smart Geofenced Campus ERP",
    "100% Board Examination Pass Record",
    "Robotics, Physics & Chemistry Labs",
    "Supervised Residential Hostels & Mess",
    "Integrated Olympiad & Competitive Coaching",
  ];

  return (
    <div className="w-full bg-[#0B0B10] border-y border-white/10 py-3.5 overflow-hidden relative select-none">
      <div className="flex items-center gap-10 text-xs sm:text-sm font-semibold tracking-wider uppercase text-mist w-max animate-marquee">
        {[...items, ...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-8 shrink-0">
            <span className="flex items-center gap-2.5 text-white/90 hover:text-[#FB7339] transition-colors cursor-default font-mono">
              <span className="w-2 h-2 rounded-full bg-[#FB7339] inline-block shadow-[0_0_8px_rgba(251,115,57,0.8)] animate-pulse" />
              {item}
            </span>
            <span className="text-white/30 font-mono text-xs">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SECTION 4: INTRO TEXT REVEAL ─── */
function IntroText() {
  return (
    <section className="relative py-20 sm:py-32 bg-[#EBE7DF] text-center px-4 sm:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-[#736B5E] leading-tight font-black uppercase">
          {LANDING_CONFIG.intro.heading}
        </h2>
        <p className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-[#1F1E1B] font-black uppercase">
          {LANDING_CONFIG.intro.subheading}
        </p>
      </div>
    </section>
  );
}

/* ─── SECTION 5: ON/OFF-GRID REVEAL (INTERACTIVE TABS & STACKED ON MOBILE) ─── */
function GridReveal() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="experience" className="py-20 sm:py-28 bg-[#0B0B10] px-4 sm:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-2">
              ✦ Smart Campus Architecture
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight uppercase">
              The 3-Dimensional Campus.
            </h2>
          </div>

          {/* Interactive State Switcher */}
          <div className="flex gap-2 p-1.5 rounded-full bg-white/5 border border-white/10 overflow-x-auto">
            {LANDING_CONFIG.states.map((st, idx) => (
              <button
                key={st.title}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === idx
                    ? "bg-[#FB7339] text-white font-bold shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {st.title}
              </button>
            ))}
          </div>
        </div>

        {/* Active Stage Canvas */}
        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-black min-h-[420px] sm:min-h-[540px] flex flex-col justify-end p-6 sm:p-12 shadow-2xl">
          <Image
            src={LANDING_CONFIG.states[activeTab].image}
            alt={LANDING_CONFIG.states[activeTab].title}
            fill
            className="object-cover opacity-45 transition-all duration-700"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="relative z-10 max-w-xl space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold px-3 py-1 rounded-full bg-white/10 border border-white/20 inline-block">
              {LANDING_CONFIG.states[activeTab].tag}
            </span>
            <h3 className="font-display font-black text-3xl sm:text-5xl text-white uppercase">
              {LANDING_CONFIG.states[activeTab].title}
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed font-light">
              {LANDING_CONFIG.states[activeTab].desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 6: PRESS & ACCREDITATION HEADER ─── */
function PressHeader() {
  const BADGES = [
    "BSEB PATNA CODE #852109",
    "100% BOARD PASS RECORD",
    "ADVANCED ROBOTICS & STEM",
    "SUPERVISED HOSTELS",
    "15+ YEARS HERITAGE",
    "KATING CHOWK PIPRA",
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#EBE7DF] border-y border-[#575349]/15">
      <div className="mb-4 text-center">
        <p className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[#575349] font-bold">
          Institutional Credentials & Affiliation
        </p>
      </div>
      <div className="flex overflow-hidden select-none">
        <div className="flex gap-12 sm:gap-16 items-center whitespace-nowrap px-8 animate-marquee">
          {[...BADGES, ...BADGES, ...BADGES, ...BADGES].map((badge, i) => (
            <span
              key={i}
              className="text-lg sm:text-2xl font-display font-black text-[#2B2925] italic tracking-tighter uppercase"
            >
              ✦ {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 7: CREDIBILITY SLIDER (TESTIMONIALS) ─── */
function CredibilitySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = dir === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 sm:py-28 bg-[#D7D1C6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-10 flex justify-between items-end">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-2">
            ✦ Community Voices
          </span>
          <h2 className="text-3xl sm:text-5xl font-display text-[#2B2925] leading-tight font-black uppercase">
            What others are<br />saying about RMSPS
          </h2>
        </div>
        <div className="hidden sm:flex gap-3">
          <button
            onClick={() => scroll("left")}
            className="w-11 h-11 rounded-xl border border-[#575349]/30 flex items-center justify-center hover:bg-[#575349] hover:text-white transition-colors cursor-pointer"
            aria-label="Previous Story"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-11 h-11 rounded-xl border border-[#575349]/30 flex items-center justify-center hover:bg-[#575349] hover:text-white transition-colors cursor-pointer"
            aria-label="Next Story"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 sm:gap-6 px-4 sm:px-8 overflow-x-auto u-nsb snap-x scroll-smooth max-w-7xl mx-auto"
      >
        {LANDING_CONFIG.stories.map((s, i) => (
          <div
            key={i}
            className="min-w-[280px] sm:min-w-[380px] group cursor-pointer snap-start flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-4 relative shadow-lg">
                <Image
                  src={s.image}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={s.title}
                  sizes="400px"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>
              <h4 className="text-base sm:text-lg font-display text-[#2B2925] mb-1 font-bold leading-snug uppercase">
                {s.title}
              </h4>
              <p className="text-xs text-[#575349] font-mono uppercase tracking-wider">{s.date}</p>
            </div>
            <div className="mt-4 w-9 h-9 bg-[#A39B8B] rounded-lg flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform">
              <ArrowRight className="w-4 h-4 text-[#1F1E1B]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── SECTION 8: FEATURE STICKY SLIDER ─── */
function FeatureStickySlider() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section id="features" className="py-20 sm:py-28 bg-[#575349] px-4 sm:px-8 text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="border-b border-white/15 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-2">
              ✦ Core Institutional Pillars
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight uppercase">
              Engineered For Excellence.
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {LANDING_CONFIG.features.map((f, i) => (
              <button
                key={f.title}
                onClick={() => setActiveIdx(i)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeIdx === i ? "bg-white text-black font-bold" : "bg-black/30 text-white/70 hover:text-white"
                }`}
              >
                0{i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Panel */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 sm:p-12 flex flex-col justify-between text-center text-[#2B2925] shadow-2xl">
            <div className="space-y-4 my-auto">
              <p className="text-xs font-mono text-[#FB7339] uppercase tracking-widest font-bold">
                Feature 0{activeIdx + 1}
              </p>
              <h3 className="text-3xl sm:text-4xl font-display font-black leading-tight uppercase text-[#2B2925]">
                {LANDING_CONFIG.features[activeIdx].title}
              </h3>
              <div className="w-16 h-0.5 bg-[#FB7339] mx-auto my-4" />
              <p className="text-sm sm:text-base text-[#575349] leading-relaxed">
                {LANDING_CONFIG.features[activeIdx].desc}
              </p>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full bg-[#EBE7DF] hover:bg-[#FB7339] hover:text-white transition-colors py-4 rounded-xl font-mono uppercase text-xs tracking-widest font-bold block"
            >
              Apply for Admission
            </Link>
          </div>

          {/* Right Media Panel */}
          <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[420px] rounded-[2rem] overflow-hidden shadow-2xl bg-black">
            <Image
              src={LANDING_CONFIG.features[activeIdx].image}
              alt={LANDING_CONFIG.features[activeIdx].title}
              fill
              className="object-cover opacity-80 transition-all duration-700"
              sizes="(max-width: 1024px) 100vw, 700px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 8.5: 4 EXPANDED DIGITAL PORTALS ─── */
function PortalsSection() {
  return (
    <section id="portals" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto bg-[#0B0B10]">
      <div className="mb-10 border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-2">
            ✦ Authenticated Access
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight uppercase">
            4 Dedicated Digital Portals.
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {LANDING_CONFIG.portals.map((portal) => (
          <div
            key={portal.role}
            className="p-6 sm:p-10 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:border-white/30 transition-all flex flex-col justify-between min-h-[280px]"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{
                    background: `${portal.accent}15`,
                    borderColor: `${portal.accent}40`,
                    color: portal.accent,
                  }}
                >
                  {portal.category}
                </span>
                <span className="text-xs font-mono text-white/50">{portal.stat}</span>
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mb-2 uppercase">
                {portal.role}
              </h3>
              <p className="text-white/85 font-medium text-sm mb-2">{portal.headline}</p>
              <p className="text-white/60 text-xs sm:text-sm font-light mb-6 leading-relaxed">{portal.desc}</p>
            </div>

            <Link
              href={portal.route}
              className="inline-flex items-center justify-between w-full py-3.5 px-5 rounded-2xl border border-white/15 font-bold text-xs uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
            >
              <span>Launch {portal.role}</span>
              <ArrowUpRight className="w-4 h-4" style={{ color: portal.accent }} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── SECTION 8.8: LIVE NOTICES (SUPABASE CONNECTED) ─── */
function NoticesSection({
  notices,
  onOpenNotice,
}: {
  notices: { title: string; content: string; created_at: string }[];
  onOpenNotice: (n: { title: string; content: string; created_at: string }) => void;
}) {
  return (
    <section id="notices" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto bg-[#0B0B10] border-t border-white/10">
      <div className="mb-10 border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-2">
            ✦ Official Circulars
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight uppercase">
            Live Notice Board.
          </h2>
        </div>
        <p className="text-white/50 text-xs font-mono uppercase hidden sm:block">
          Updated in Real-Time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {notices.map((notice, idx) => (
          <div
            key={idx}
            onClick={() => onOpenNotice(notice)}
            className="p-6 sm:p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:border-[#FB7339]/50 hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-white/50">
                <span className="text-[#FB7339]">✦ Circular</span>
                <span>{new Date(notice.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white line-clamp-2 uppercase">
                {notice.title}
              </h3>
              <p className="text-white/70 text-xs sm:text-sm line-clamp-3 leading-relaxed font-light">
                {notice.content}
              </p>
            </div>
            <div className="flex items-center text-xs font-bold font-mono text-[#FB7339] uppercase tracking-wider">
              <span>Read Full Circular</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── SECTION 9: PRE-FOOTER CTA ─── */
function PreFooter() {
  return (
    <section className="relative min-h-[85svh] w-full flex flex-col justify-center items-center text-white text-center px-4 sm:px-8 py-20 bg-[#A39B8B] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600"
          alt="Campus View"
          fill
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-4xl space-y-6">
        <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#FB7339]">
          Session 2026–27 Open
        </p>

        <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-black leading-none tracking-tighter uppercase">
          Join the<br />legacy
        </h2>

        <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto font-light">
          Give your child the gift of disciplined residential education, modern laboratory practicals, and dedicated faculty mentorship in Bihar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-md mx-auto">
          <Link
            href="/register"
            className="btn-primary py-4 px-8 rounded-xl font-mono uppercase text-xs font-bold tracking-widest text-center shadow-xl"
          >
            Apply Online
          </Link>
          <a
            href={`tel:${LANDING_CONFIG.contact.phone}`}
            className="bg-white/20 backdrop-blur-xl border border-white/30 py-4 px-8 rounded-xl font-mono uppercase text-xs font-bold tracking-widest text-center text-white hover:bg-white/30 transition-colors"
          >
            Call Admissions
          </a>
        </div>

        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60 pt-4">
          BSEB Affiliated Code: {LANDING_CONFIG.contact.bsebCode}
        </p>
      </div>
    </section>
  );
}

/* ─── SECTION 10: FOOTER ─── */
function Footer() {
  const links = [
    { name: "academics", href: "#experience" },
    { name: "campus os", href: "#features" },
    { name: "portals", href: "#portals" },
    { name: "circulars", href: "#notices" },
    { name: "online admission", href: "/register" },
  ];

  return (
    <footer className="bg-[#1C1B18] text-[#F2EFE9] px-4 sm:px-8 py-16 sm:py-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-14 mb-16">
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FB7339] p-0.5 bg-black">
              <Image
                src="/icon-192.png"
                alt="RMSPS"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="font-display font-black text-xl text-[#FB7339] tracking-wider uppercase">
              RMSPS
            </span>
          </div>
          <p className="text-white/70 text-xs sm:text-sm max-w-sm leading-relaxed font-light">
            Residential Maa Saraswati Public School — A premier BSEB-affiliated residential institution in Bihar dedicated to academic rigor, character building, and leadership.
          </p>
        </div>

        <div className="md:col-span-3 flex flex-col gap-2.5">
          <p className="text-xs font-mono uppercase font-bold text-white/50 tracking-widest mb-2">
            Navigation
          </p>
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              className="text-base sm:text-lg font-display font-bold uppercase hover:text-[#FB7339] transition-colors leading-tight"
            >
              {l.name}
            </a>
          ))}
        </div>

        <div className="md:col-span-4 space-y-4 text-xs font-mono text-white/80">
          <p className="uppercase font-bold text-white/50 tracking-widest mb-2">
            Campus Information
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#FB7339] shrink-0 mt-0.5" />
            <span>{LANDING_CONFIG.contact.address}</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#FB7339] shrink-0" />
            <a href={`tel:${LANDING_CONFIG.contact.phone}`} className="underline hover:text-white">
              {LANDING_CONFIG.contact.phone}
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#FB7339] shrink-0" />
            <a href={`mailto:${LANDING_CONFIG.contact.email}`} className="underline hover:text-white">
              {LANDING_CONFIG.contact.email}
            </a>
          </p>
          <p className="pt-2 text-[#FB7339] font-bold">
            BSEB Affiliation Code: {LANDING_CONFIG.contact.bsebCode}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-white/60">
        <p>© 2026 Residential Maa Saraswati Public School. All Rights Reserved.</p>
        <div className="flex gap-4">
          <Link href="/login?role=student" className="hover:text-white">Student</Link>
          <Link href="/login?role=parent" className="hover:text-white">Parent</Link>
          <Link href="/login?role=teacher" className="hover:text-white">Teacher</Link>
          <Link href="/login?role=admin" className="hover:text-white">Admin</Link>
        </div>
      </div>
    </footer>
  );
}

/* ─── MAIN LANDING PAGE CONTAINER ─── */
export default function LandingPage({
  notices = [],
}: {
  notices?: { title: string; content: string; created_at: string }[];
}) {
  const [selectedNotice, setSelectedNotice] = useState<{ title: string; content: string; created_at: string } | null>(null);

  const displayNotices = notices.length > 0 ? notices : defaultNotices;

  return (
    <main className="relative bg-[#0B0B10] text-[#F3EFE6] selection:bg-[#FB7339] selection:text-white overflow-x-hidden">
      {/* ── CINEMATIC ZERO-FLASH INTRO PRELOADER ── */}
      <IntroPreloader />

      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Navbar */}
      <Navbar />

      {/* 3. Hero Section */}
      <Hero />

      {/* 4. Infinite Marquee */}
      <InfiniteMarquee />

      {/* 5. Intro Text Reveal */}
      <IntroText />

      {/* 6. On/Off-Grid Reveal */}
      <GridReveal />

      {/* 7. Press & Accreditation Header */}
      <PressHeader />

      {/* 8. Credibility Slider (Testimonials) */}
      <CredibilitySlider />

      {/* 9. Feature Sticky Slider */}
      <FeatureStickySlider />

      {/* 9.5. 4 Expanded Digital Portals */}
      <PortalsSection />

      {/* 9.8. Live Notices (Supabase Connected) */}
      <NoticesSection notices={displayNotices} onOpenNotice={setSelectedNotice} />

      {/* 10. Pre-Footer CTA */}
      <PreFooter />

      {/* 11. Footer */}
      <Footer />

      {/* Notice Inspection Modal */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-white/20 w-full max-w-lg p-6 sm:p-8 bg-[#0B0B10] text-white shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[#FB7339]">
                  <Bell className="w-4 h-4" />
                  <span>Official Circular</span>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-white text-white/70 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-mono text-white/50">
                  Published:{" "}
                  {new Date(selectedNotice.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h3 className="font-display font-bold text-xl text-white uppercase">
                  {selectedNotice.title}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-light">
                  {selectedNotice.content}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="bg-[#FB7339] text-white px-6 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
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
