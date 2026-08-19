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
  X, Menu, MessageSquare, Play, Sun, Moon,
  Building2, Atom, Layers, ChevronDown, CheckCircle2,
  Star, Quote, CheckCheck, LogIn,
} from "lucide-react";

import IntroPreloader from "@/components/landing/IntroPreloader";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { BoundedParallaxSlider } from "@/components/ui/argent-loop-infinite-slider";

/* ══════════════════════════════════════════════════════════════════════
 * ─── CENTRALIZED ASSETS & CONTENT CONFIGURATION ───────────────────────
 * Easily modify any video URL, image, text, or contact detail here.
 * ══════════════════════════════════════════════════════════════════════ */
export const LANDING_CONFIG = {
  hero: {
    videoUrl: "https://assets.pebblelife.com/2_I3_A0499_2_7_b9915cc716.webm",
    posterImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1920",
    badge: "BSEB Affiliated Code: 852109",
    schoolName: "Residential Maa Saraswati Public School",
    taglineHeading: "SHAPING FUTURES.",
    subheading:
      "A premier BSEB-affiliated residential institution in Pipra, Bihar — empowering young scholars with academic rigor, STEM laboratories, and moral leadership since 2016.",
    location: "Kating Chowk, Pipra, Bihar • Est. 2016",
    helpline: "+91 95465 36279",
  },
  intro: {
    heading: "Pioneering A Higher Standard in Residential Education.",
    subheading:
      "From smart geofenced attendance to advanced practical laboratories and 24/7 supervised living, RMSPS anticipates your scholar's every academic, physical, and moral need.",
  },
  states: [
    {
      title: "On-Campus",
      tag: "Smart Presence",
      desc: "Encrypted GPS geofencing authenticates daily scholar & faculty arrival in under 30 seconds with 0 proxy roll-calls and instant SMS parent notifications.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600",
    },
    {
      title: "In-Residence",
      tag: "Supervised Living",
      desc: "Separate secure dormitories, nutritious hygienic dining, morning yoga, and structured evening study halls under 24/7 senior warden care.",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1600",
    },
    {
      title: "Connected",
      tag: "Guardian Sync",
      desc: "Real-time morning arrival verification, terminal exam scorecards, digital fee receipts, and official circulars delivered directly to parents' phones.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600",
    },
  ],
  features: [
    {
      title: "Smart Geofenced Presence",
      tag: "Automated Attendance",
      stat: "< 30s Scan",
      desc: "Encrypted GPS boundaries authenticate student & faculty arrival with zero manual paper registers and instant morning SMS arrival delivery to guardians.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600",
      bullets: ["Zero proxy roll-calls", "Real-time guardian notification", "Encrypted coordinate verification"],
    },
    {
      title: "Practical STEM Laboratories",
      tag: "Experiential Learning",
      stat: "100% Practical Distinction",
      desc: "Hands-on physics optics benches, chemical titration stations, and robotics programming preparing scholars for state-level board practical excellence.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600",
      bullets: ["Dedicated lab mentors", "Hands-on experimentation", "Olympiad & concept preparation"],
    },
    {
      title: "24/7 Supervised Hostels",
      tag: "Residential Life",
      stat: "24/7 Warden Care",
      desc: "Safe dormitories, nutritious hygienic dining mess, morning yoga sessions, and disciplined evening study halls under dedicated warden supervision.",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1600",
      bullets: ["Separate boys/girls wings", "Nutritious balanced dining", "Structured evening study"],
    },
    {
      title: "Instant Results Engine",
      tag: "Academic Analytics",
      stat: "1-Click PDF Report",
      desc: "Standardized terminal exam marks evaluation, automated rank analytics, subject progress trackers, and instant downloadable gradebooks for parents.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600",
      bullets: ["Automated rank generation", "Subject breakdown charts", "1-click verified PDF cards"],
    },
  ],
  stories: [
    {
      title: "Real-Time Transparency with Geofenced Attendance",
      author: "Rajesh Kumar",
      role: "Parent of Class 8 Scholar",
      date: "Session 2025–26",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
      quote: "Getting an instant SMS notification the minute my son enters the campus gives our entire family absolute peace of mind.",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800",
    },
    {
      title: "From RMSPS Classrooms to Board Distinction",
      author: "Pooja Kumari",
      role: "BSEB 2024 State Rank Holder",
      date: "Batch of 2024",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
      quote: "The personalized mentorship and mock tests helped me secure top percentile in the BSEB Matric examination.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800",
    },
    {
      title: "High-Impact Concept Learning in Science Labs",
      author: "Dr. S. K. Verma",
      role: "Senior Physics Faculty",
      date: "Faculty Review",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200",
      quote: "Our physics and chemistry labs allow scholars to test formulas practically, turning theoretical rote into lifelong scientific mastery.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800",
    },
    {
      title: "Nurturing Environment with Supervised Evening Study",
      author: "Sunita Devi",
      role: "Residential Hosteler Parent",
      date: "Hostel Review",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
      quote: "The residential warden care and structured evening study routine have instilled tremendous discipline and confidence in my daughter.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800",
    },
  ],
  portals: [
    {
      role: "Student Hub",
      category: "SCHOLARS",
      route: "/login?role=student",
      accent: "#81B29A",
      headline: "Terminal Scorecards & Tasks",
      desc: "Instant access to BSEB exam scorecards, subject progress analytics, homework tasks, and leave applications.",
      stat: "94.8% Avg Scorecard",
    },
    {
      role: "Parent Portal",
      category: "GUARDIANS",
      route: "/login?role=parent",
      accent: "#D4AF6A",
      headline: "Live Ward Attendance & Receipts",
      desc: "Real-time morning arrival verification, terminal gradebooks, digital fee deposit history, and official school circulars.",
      stat: "Real-Time Tracking",
    },
    {
      role: "Teacher Desk",
      category: "FACULTY",
      route: "/login?role=teacher",
      accent: "#3E5C76",
      headline: "Geofenced Attendance & Marks",
      desc: "Fast geofenced classroom attendance marking, terminal marks entry, and direct student communication.",
      stat: "< 30s Attendance",
    },
    {
      role: "Admin Suite",
      category: "GOVERNANCE",
      route: "/login?role=admin",
      accent: "#F1917D",
      headline: "Institutional ERP & Audits",
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
    created_at: "2026-08-15T00:00:00.000Z",
  },
  {
    title: "BSEB Board Examination Guidance & Mock Series",
    content:
      "Special practical labs and structured mock evaluation tests for BSEB board candidates will commence this month. Consult your teacher portal for timetable schedules.",
    created_at: "2026-08-12T00:00:00.000Z",
  },
  {
    title: "Annual Science Exhibition & Sports Meet",
    content:
      "The annual inter-house science exhibition and athletics tournament schedule is officially published. Parents and guardians are cordially invited to attend.",
    created_at: "2026-08-10T00:00:00.000Z",
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
      <a
        href={`tel:${LANDING_CONFIG.contact.phone}`}
        className="underline hover:opacity-80 transition-opacity hidden sm:inline"
      >
        Helpline: {LANDING_CONFIG.contact.phone}
      </a>
    </div>
  );
}

/* ─── SECTION 2: NAVBAR WITH SHADCN NAVIGATION MENU & THEME TOGGLE ─── */
function Navbar({
  theme,
  onToggleTheme,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const isLight = theme === "light";

  return (
    <>
      <nav
        className={`fixed top-[32px] left-0 w-full z-[60] transition-all duration-300 ${
          scrolled
            ? isLight
              ? "py-3 bg-white/90 backdrop-blur-xl border-b border-black/10 shadow-sm"
              : "py-3 bg-[#0B0B10]/90 backdrop-blur-xl border-b border-white/10"
            : "py-4 sm:py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-[#FB7339] p-0.5 bg-black shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/icon-192.png"
                alt="RMSPS Logo"
                width={56}
                height={56}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-2xl sm:text-3xl font-display font-black tracking-widest uppercase leading-none transition-colors ${
                  isLight ? "text-[#0B0B10]" : "text-white"
                }`}
              >
                RMSPS
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-[#FB7339] font-bold mt-0.5">
                Pipra, Bihar
              </span>
            </div>
          </Link>

          {/* Desktop Radix/Shadcn Navigation Menu */}
          <div className="hidden md:flex items-center gap-2">
            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                {/* Academics Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-xs font-mono uppercase tracking-widest">
                    Academics
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[360px] gap-2 p-2">
                      <NavigationMenuLink asChild>
                        <a href="#experience" className="group/item flex items-start gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <BookOpen className="w-5 h-5 text-[#FB7339] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm font-display uppercase">BSEB Curriculum</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">Standardized board preparation and Olympiad coaching.</p>
                          </div>
                        </a>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <a href="#features" className="group/item flex items-start gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <Atom className="w-5 h-5 text-[#81B29A] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm font-display uppercase">Practical STEM Labs</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">Hands-on physics optics, chemistry titration & robotics.</p>
                          </div>
                        </a>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Campus Pillars Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-xs font-mono uppercase tracking-widest">
                    Campus Life
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[360px] gap-2 p-2">
                      <NavigationMenuLink asChild>
                        <a href="#experience" className="group/item flex items-start gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <Building2 className="w-5 h-5 text-[#D4AF6A] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm font-display uppercase">Supervised Hostels</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">24/7 warden supervision, nutritious dining & morning yoga.</p>
                          </div>
                        </a>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <a href="#features" className="group/item flex items-start gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <Shield className="w-5 h-5 text-[#3E5C76] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm font-display uppercase">Geofenced Smart Campus</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">Instant GPS arrival authentication & parent SMS sync.</p>
                          </div>
                        </a>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Portals Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-xs font-mono uppercase tracking-widest">
                    Portals
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-2 w-[420px] gap-2 p-2">
                      <NavigationMenuLink asChild>
                        <Link href="/login?role=student" className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="font-bold text-xs font-display text-[#81B29A] uppercase">Student Hub</div>
                          <p className="text-[11px] text-muted-foreground">Scorecards & Tasks</p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/login?role=parent" className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="font-bold text-xs font-display text-[#D4AF6A] uppercase">Parent Desk</div>
                          <p className="text-[11px] text-muted-foreground">Attendance & Fees</p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/login?role=teacher" className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="font-bold text-xs font-display text-[#3E5C76] uppercase">Teacher Desk</div>
                          <p className="text-[11px] text-muted-foreground">Marks & Attendance</p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/login?role=admin" className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="font-bold text-xs font-display text-[#F1917D] uppercase">Admin Suite</div>
                          <p className="text-[11px] text-muted-foreground">ERP & Ledgers</p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Direct Notice Link */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="#notices"
                      className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      Circulars
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-full border transition-all cursor-pointer ml-2 ${
                isLight
                  ? "bg-black/5 border-black/15 text-[#0B0B10] hover:bg-black/10"
                  : "bg-white/10 border-white/15 text-white hover:bg-white/20"
              }`}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle Theme"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <Link
              href="/login"
              className="bg-[#FB7339] text-white px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 font-bold shadow-md ml-1"
            >
              Portal Login
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-full border transition-all ${
                isLight
                  ? "bg-black/5 border-black/15 text-[#0B0B10]"
                  : "bg-white/10 border-white/15 text-white"
              }`}
              aria-label="Toggle Theme"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-lg border ${
                isLight ? "border-black/15 text-[#0B0B10]" : "border-white/10 text-white"
              }`}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-0 z-[100] p-6 sm:p-10 flex flex-col justify-between ${
              isLight ? "bg-[#F8F6F0] text-[#0B0B10]" : "bg-[#0B0B10] text-white"
            }`}
          >
            <div
              className={`flex justify-between items-center border-b pb-6 ${
                isLight ? "border-black/10" : "border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FB7339] p-0.5 bg-black shrink-0">
                  <Image
                    src="/icon-192.png"
                    alt="RMSPS Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-2xl font-display font-black tracking-widest uppercase">
                  RMSPS
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2"
                aria-label="Close Navigation Menu"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex flex-col gap-6 py-8">
              <a
                href="#experience"
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-display uppercase font-bold hover:text-[#FB7339] transition-colors"
              >
                Academics
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-display uppercase font-bold hover:text-[#FB7339] transition-colors"
              >
                Campus Life
              </a>
              <a
                href="#portals"
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-display uppercase font-bold hover:text-[#FB7339] transition-colors"
              >
                Portals
              </a>
              <a
                href="#notices"
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-display uppercase font-bold hover:text-[#FB7339] transition-colors"
              >
                Circulars
              </a>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#FB7339] text-3xl font-display uppercase font-bold"
              >
                Portal Login →
              </Link>
            </div>
            <div
              className={`text-xs font-mono uppercase border-t pt-6 ${
                isLight ? "border-black/10 text-black/50" : "border-white/10 text-white/50"
              }`}
            >
              BSEB Code: 852109 • Pipra, Bihar
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── SECTION 3: HERO SECTION (BALANCED SCHOOL NAME & SHAPING FUTURES) ─── */
function Hero({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";

  return (
    <section
      className={`relative min-h-[90svh] sm:min-h-screen w-full flex flex-col justify-between pt-28 sm:pt-36 pb-12 sm:pb-16 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden transition-colors ${
        isLight ? "text-[#0B0B10]" : "text-white"
      }`}
    >
      {/* High-Visibility Background Video & Image Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src={LANDING_CONFIG.hero.posterImage}
          alt="RMSPS Campus"
          fill
          priority
          className={`object-cover ${isLight ? "opacity-35" : "opacity-40"}`}
          sizes="100vw"
        />
        {LANDING_CONFIG.hero.videoUrl && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-cover ${
              isLight ? "opacity-55" : "opacity-75"
            }`}
          >
            <source src={LANDING_CONFIG.hero.videoUrl} type="video/webm" />
          </video>
        )}
        <div
          className={`absolute inset-0 ${
            isLight
              ? "bg-gradient-to-t from-[#F8F6F0] via-[#F8F6F0]/65 to-[#F8F6F0]/40"
              : "bg-gradient-to-t from-[#0B0B10] via-[#0B0B10]/75 to-[#0B0B10]/50"
          }`}
        />
      </div>

      {/* Top Metadata Strip */}
      <div
        className={`relative z-10 flex flex-wrap items-center justify-between gap-3 border-b pb-4 text-[11px] sm:text-xs font-mono ${
          isLight ? "border-black/15 text-[#575349]" : "border-white/15 text-mist"
        }`}
      >
        <div className="flex items-center gap-2 text-[#FB7339]">
          <span className="w-2 h-2 rounded-full bg-[#FB7339] animate-pulse" />
          <span className="uppercase tracking-widest font-bold">{LANDING_CONFIG.hero.badge}</span>
        </div>
        <div className="uppercase tracking-widest hidden sm:block">
          {LANDING_CONFIG.hero.location}
        </div>
      </div>

      {/* Main Educational Hero Typography */}
      <div className="relative z-10 py-6 sm:py-12 text-left space-y-4 sm:space-y-6">
        <h1
          className={`font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.12] tracking-tight max-w-4xl ${
            isLight ? "text-[#0B0B10]" : "text-white"
          }`}
        >
          {LANDING_CONFIG.hero.schoolName}
        </h1>

        {/* SHAPING FUTURES with matching Intro text style & gradient */}
        <p className="font-display font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight bg-gradient-to-r from-[#FB7339] via-[#D4AF6A] to-[#FB7339] bg-clip-text text-transparent">
          {LANDING_CONFIG.hero.taglineHeading}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
          <p
            className={`lg:col-span-7 text-sm sm:text-lg leading-relaxed font-light max-w-xl ${
              isLight ? "text-[#4A453C]" : "text-white/85"
            }`}
          >
            {LANDING_CONFIG.hero.subheading}
          </p>
          <div className="lg:col-span-5 flex flex-wrap gap-3 sm:gap-4 items-center lg:justify-end">
            <Link
              href="/login"
              className="btn-primary px-8 sm:px-10 py-4 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-[#FB7339]/25 cursor-pointer"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Portal Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Authority Metrics Matrix */}
      <div
        className={`relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t pt-6 ${
          isLight ? "border-black/15" : "border-white/15"
        }`}
      >
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#FB7339]">98%</p>
          <p className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider ${isLight ? "text-[#575349]" : "text-mist"}`}>
            Board Pass Distinction
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#D4AF6A]">15+ Yrs</p>
          <p className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider ${isLight ? "text-[#575349]" : "text-mist"}`}>
            Educational Heritage
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#81B29A]">1,000+</p>
          <p className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider ${isLight ? "text-[#575349]" : "text-mist"}`}>
            Active Scholars
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#3E5C76]">20+</p>
          <p className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider ${isLight ? "text-[#575349]" : "text-mist"}`}>
            Master Faculty
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── CONTINUOUS GPU HARDWARE TICKER ─── */
function InfiniteMarquee({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";
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
    <div
      className={`w-full border-y py-3.5 overflow-hidden relative select-none transition-colors ${
        isLight
          ? "bg-[#EFEAE1] border-black/10 text-[#2B2925]"
          : "bg-[#0B0B10] border-white/10 text-mist"
      }`}
    >
      <div className="flex items-center gap-10 text-xs sm:text-sm font-semibold tracking-wider uppercase w-max animate-marquee">
        {[...items, ...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-8 shrink-0">
            <span className="flex items-center gap-2.5 hover:text-[#FB7339] transition-colors cursor-default font-mono">
              <span className="w-2 h-2 rounded-full bg-[#FB7339] inline-block shadow-[0_0_8px_rgba(251,115,57,0.8)] animate-pulse" />
              {item}
            </span>
            <span className="opacity-30 font-mono text-xs">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SECTION 4: INTRO TEXT REVEAL (SCROLL ILLUMINATION) ─── */
function IntroText({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";
  const headingWords = LANDING_CONFIG.intro.heading.split(" ");

  return (
    <section
      className={`relative py-16 sm:py-24 text-center px-4 sm:px-8 overflow-hidden transition-colors ${
        isLight ? "bg-[#EAE5DC]" : "bg-[#14141A]"
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-5">
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#FB7339] font-bold block">
          ✦ Academic Philosophy
        </span>

        {/* Word-by-word smooth scroll illumination */}
        <h2
          className={`text-2xl sm:text-4xl md:text-5xl font-display font-black leading-tight tracking-tight ${
            isLight ? "text-[#1F1E1B]" : "text-white"
          }`}
        >
          {headingWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.3, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
              className="inline-block mr-2"
            >
              {word}
            </motion.span>
          ))}
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className={`text-sm sm:text-lg md:text-xl font-body leading-relaxed max-w-3xl mx-auto ${
            isLight ? "text-[#575349]" : "text-white/80"
          }`}
        >
          {LANDING_CONFIG.intro.subheading}
        </motion.p>
      </div>
    </section>
  );
}

/* ─── SECTION 5: THE 3-DIMENSIONAL CAMPUS (BOUNDED PARALLAX SLIDER) ─── */
function GridReveal({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";

  return (
    <section
      id="experience"
      className={`py-16 sm:py-24 px-4 sm:px-8 border-t transition-colors ${
        isLight
          ? "bg-[#F8F6F0] border-black/10 text-[#0B0B10]"
          : "bg-[#0B0B10] border-white/10 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between border-b pb-4 gap-4 ${
            isLight ? "border-black/10" : "border-white/10"
          }`}
        >
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-1">
              ✦ Smart Campus Architecture
            </span>
            <h2 className="font-display font-black text-2xl sm:text-4xl md:text-5xl tracking-tight uppercase">
              The 3-Dimensional Campus.
            </h2>
          </div>
          <p className="text-xs font-mono uppercase text-muted-foreground hidden sm:block">
            Dimensions 01–03 • Bounded Glide
          </p>
        </div>

        <BoundedParallaxSlider items={LANDING_CONFIG.states} />
      </div>
    </section>
  );
}

/* ─── SECTION 6: PRESS & ACCREDITATION HEADER ─── */
function PressHeader({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";
  const BADGES = [
    "BSEB PATNA CODE #852109",
    "100% BOARD PASS RECORD",
    "ADVANCED ROBOTICS & STEM",
    "SUPERVISED HOSTELS",
    "15+ YEARS HERITAGE",
    "KATING CHOWK PIPRA",
  ];

  return (
    <section
      className={`py-10 sm:py-14 border-y transition-colors ${
        isLight
          ? "bg-[#EAE5DC] border-black/10 text-[#2B2925]"
          : "bg-[#101015] border-white/10 text-white"
      }`}
    >
      <div className="mb-3 text-center">
        <p className="text-[10px] sm:text-xs font-mono uppercase tracking-widest font-bold opacity-75">
          Institutional Credentials & Affiliation
        </p>
      </div>
      <div className="flex overflow-hidden select-none">
        <div className="flex gap-12 sm:gap-16 items-center whitespace-nowrap px-8 animate-marquee">
          {[...BADGES, ...BADGES, ...BADGES, ...BADGES].map((badge, i) => (
            <span
              key={i}
              className="text-base sm:text-xl font-display font-black italic tracking-tighter uppercase opacity-80"
            >
              ✦ {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 7: COMMUNITY STORIES & REVIEWS (BOUNDED PARALLAX SLIDER) ─── */
function CredibilitySlider({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";

  return (
    <section
      className={`py-16 sm:py-24 px-4 sm:px-8 transition-colors border-t ${
        isLight ? "bg-[#EAE5DC] text-[#2B2925] border-black/10" : "bg-[#16161C] text-white border-white/10"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-1">
              ✦ Community Voices & Verified Reviews
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-black uppercase tracking-tight">
              What Others Are Saying About RMSPS
            </h2>
          </div>
          <p className="text-xs font-mono uppercase text-muted-foreground hidden sm:block">
            Verified Stories 01–04 • Bounded Glide
          </p>
        </div>

        <BoundedParallaxSlider
          items={LANDING_CONFIG.stories}
          badge="✦ Verified Community Reviews"
        />
      </div>
    </section>
  );
}

/* ─── SECTION 8: CORE INSTITUTIONAL PILLARS (BOUNDED PARALLAX SLIDER) ─── */
function FeatureStickySlider() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-[#3E3A32] px-4 sm:px-8 text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-white/15 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-1">
              ✦ Core Institutional Pillars
            </span>
            <h2 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight uppercase">
              Engineered For Excellence.
            </h2>
          </div>
          <p className="text-xs font-mono uppercase text-white/70 hidden sm:block">
            Pillars 01–04 • Bounded Glide
          </p>
        </div>

        <BoundedParallaxSlider
          items={LANDING_CONFIG.features}
          badge="✦ Core Pillars 01–04"
        />
      </div>
    </section>
  );
}

/* ─── SECTION 8.5: 4 EXPANDED DIGITAL PORTALS ─── */
function PortalsSection({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";

  return (
    <section
      id="portals"
      className={`py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto transition-colors ${
        isLight ? "bg-[#F8F6F0] text-[#0B0B10]" : "bg-[#0B0B10] text-white"
      }`}
    >
      <div
        className={`mb-8 border-b pb-6 flex justify-between items-end ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-1">
            ✦ Authenticated Access
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl md:text-5xl tracking-tight uppercase">
            4 Dedicated Digital Portals.
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {LANDING_CONFIG.portals.map((portal) => (
          <div
            key={portal.role}
            className={`p-6 sm:p-8 rounded-[2rem] border transition-all flex flex-col justify-between min-h-[260px] shadow-sm ${
              isLight
                ? "bg-white border-black/10 hover:border-[#FB7339]/50 hover:shadow-md"
                : "bg-white/[0.02] border-white/10 hover:border-white/30"
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-5">
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
                <span className={`text-xs font-mono ${isLight ? "text-black/50" : "text-white/50"}`}>
                  {portal.stat}
                </span>
              </div>
              <h3 className="font-display font-black text-2xl mb-1 uppercase">{portal.role}</h3>
              <p className={`font-medium text-sm mb-2 ${isLight ? "text-[#575349]" : "text-white/85"}`}>
                {portal.headline}
              </p>
              <p className={`text-xs sm:text-sm font-light mb-6 leading-relaxed ${isLight ? "text-black/70" : "text-white/60"}`}>
                {portal.desc}
              </p>
            </div>

            <Link
              href={portal.route}
              className={`inline-flex items-center justify-between w-full py-3.5 px-5 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-colors ${
                isLight
                  ? "border-black/15 text-[#0B0B10] hover:bg-black/5 bg-[#F8F6F0]"
                  : "border-white/15 text-white hover:bg-white/10 bg-black/40"
              }`}
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

/* ─── SECTION 8.8: LIVE NOTICES ─── */
function NoticesSection({
  notices,
  onOpenNotice,
  theme,
}: {
  notices: { title: string; content: string; created_at: string }[];
  onOpenNotice: (n: { title: string; content: string; created_at: string }) => void;
  theme: "light" | "dark";
}) {
  const isLight = theme === "light";

  return (
    <section
      id="notices"
      className={`py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t transition-colors ${
        isLight
          ? "bg-[#F8F6F0] border-black/10 text-[#0B0B10]"
          : "bg-[#0B0B10] border-white/10 text-white"
      }`}
    >
      <div
        className={`mb-8 border-b pb-6 flex justify-between items-end ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#FB7339] font-bold block mb-1">
            ✦ Official Circulars
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl md:text-5xl tracking-tight uppercase">
            Live Notice Board.
          </h2>
        </div>
        <p className={`text-xs font-mono uppercase hidden sm:block ${isLight ? "text-black/50" : "text-white/50"}`}>
          Updated in Real-Time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {notices.map((notice, idx) => (
          <div
            key={idx}
            onClick={() => onOpenNotice(notice)}
            className={`p-6 sm:p-8 rounded-[2rem] border transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm ${
              isLight
                ? "bg-white border-black/10 hover:border-[#FB7339]/50 hover:shadow-md"
                : "bg-white/[0.02] border-white/10 hover:border-[#FB7339]/50 hover:bg-white/[0.04]"
            }`}
          >
            <div className="space-y-3">
              <div className={`flex items-center justify-between text-xs font-mono ${isLight ? "text-black/50" : "text-white/50"}`}>
                <span className="text-[#FB7339]">✦ Circular</span>
                <span suppressHydrationWarning>{new Date(notice.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl line-clamp-2 uppercase">
                {notice.title}
              </h3>
              <p className={`text-xs sm:text-sm line-clamp-3 leading-relaxed font-light ${isLight ? "text-black/70" : "text-white/70"}`}>
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
    <section className="relative min-h-[75svh] w-full flex flex-col justify-center items-center text-white text-center px-4 sm:px-8 py-16 sm:py-24 bg-[#1F1E1B] overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600"
          alt="Campus View"
          fill
          className="object-cover opacity-35"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-3xl space-y-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FB7339]/40 bg-[#FB7339]/15 text-[#FB7339] text-xs font-mono uppercase tracking-widest font-bold">
          <span className="w-2 h-2 rounded-full bg-[#FB7339] animate-pulse" />
          Academic Session 2026–27 Open
        </span>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black leading-tight tracking-tight uppercase text-white">
          Empowering Minds, <br />
          <span className="bg-gradient-to-r from-[#FB7339] via-[#D4AF6A] to-[#FB7339] bg-clip-text text-transparent">
            Shaping Tomorrow.
          </span>
        </h2>

        <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
          Give your child the foundation of disciplined residential education, modern science laboratories, and dedicated faculty mentorship in Bihar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 max-w-md mx-auto">
          <Link
            href="/register"
            className="btn-primary py-4 px-8 rounded-xl font-mono uppercase text-xs font-bold tracking-widest text-center shadow-xl hover:scale-105 transition-transform"
          >
            Apply for Online Admission
          </Link>
          <a
            href={`tel:${LANDING_CONFIG.contact.phone}`}
            className="bg-white/15 backdrop-blur-xl border border-white/25 py-4 px-8 rounded-xl font-mono uppercase text-xs font-bold tracking-widest text-center text-white hover:bg-white/25 transition-colors"
          >
            Call Admissions Desk
          </a>
        </div>

        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60 pt-2">
          BSEB Affiliated Code: {LANDING_CONFIG.contact.bsebCode} • Pipra, Bihar
        </p>
      </motion.div>
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
    <footer className="bg-[#141310] text-[#F2EFE9] px-4 sm:px-8 py-16 sm:py-20 border-t border-white/10">
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedNotice, setSelectedNotice] = useState<{ title: string; content: string; created_at: string } | null>(null);

  // Initialize theme from localStorage (default to light)
  useEffect(() => {
    const saved = localStorage.getItem("rmsps_theme") as "light" | "dark" | null;
    if (saved && (saved === "light" || saved === "dark")) {
      setTheme(saved);
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("rmsps_theme", next);
  };

  const displayNotices = notices.length > 0 ? notices : defaultNotices;

  return (
    <main
      className={`relative min-h-screen selection:bg-[#FB7339] selection:text-white overflow-x-hidden transition-colors duration-300 ${
        theme === "light" ? "bg-[#F8F6F0] text-[#1F1E1B]" : "bg-[#0B0B10] text-[#F3EFE6]"
      }`}
    >
      {/* ── CINEMATIC ZERO-FLASH INTRO PRELOADER (Runs once per session) ── */}
      <IntroPreloader />

      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Navbar with Radix NavigationMenu & Theme Toggle */}
      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      {/* 3. Hero Section */}
      <Hero theme={theme} />

      {/* 4. Infinite Marquee */}
      <InfiniteMarquee theme={theme} />

      {/* 5. (Rank 2) Live Circulars & Notice Board */}
      <NoticesSection notices={displayNotices} onOpenNotice={setSelectedNotice} theme={theme} />

      {/* 6. (Rank 3) Apply for Admission & Call Admission Desk CTA */}
      <PreFooter />

      {/* 7. (Rank 4) 4 Dedicated Digital Portals */}
      <PortalsSection theme={theme} />

      {/* 8. Institutional Mission Statement */}
      <IntroText theme={theme} />

      {/* 9. The 3-Dimensional Campus (Bounded Parallax Slider) */}
      <GridReveal theme={theme} />

      {/* 10. Press & Accreditation Badges */}
      <PressHeader theme={theme} />

      {/* 11. Community Stories (Bounded Parallax Reviews) */}
      <CredibilitySlider theme={theme} />

      {/* 12. Core Institutional Pillars (Bounded Parallax Pillars) */}
      <FeatureStickySlider />

      {/* 13. Footer */}
      <Footer />

      {/* Notice Inspection Modal */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-3xl border w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 ${
                theme === "light"
                  ? "bg-white text-[#0B0B10] border-black/15"
                  : "bg-[#0B0B10] text-white border-white/20"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b pb-4 ${
                  theme === "light" ? "border-black/10" : "border-white/10"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-mono text-[#FB7339]">
                  <Bell className="w-4 h-4" />
                  <span>Official Circular</span>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    theme === "light"
                      ? "border-black/15 text-black/70 hover:text-black"
                      : "border-white/10 text-white/70 hover:text-white"
                  }`}
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p suppressHydrationWarning className={`text-xs font-mono ${theme === "light" ? "text-black/50" : "text-white/50"}`}>
                  Published:{" "}
                  {new Date(selectedNotice.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h3 className="font-display font-bold text-xl uppercase">
                  {selectedNotice.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap font-light ${
                    theme === "light" ? "text-black/80" : "text-white/80"
                  }`}
                >
                  {selectedNotice.content}
                </p>
              </div>

              <div
                className={`pt-4 border-t flex justify-end ${
                  theme === "light" ? "border-black/10" : "border-white/10"
                }`}
              >
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
