"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
  useInView,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Globe, Shield, Microscope, Trophy, Users, Menu, X,
  BookOpen, Star, CheckCircle, MapPin, Phone, Mail, ChevronRight,
  Bell, GraduationCap, Award, Zap,
} from "lucide-react";

/* ─── ANIMATED COUNTER (useMotionValue + useEffect — no RAF setState loop) ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  // Drive animation via Framer Motion's motion value engine (not a RAF setState loop)
  // useEffect triggers only when isInView becomes true
  // The motion.animate utility drives the count without React re-renders on every frame
  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, prefersReducedMotion]);

  return (
    <span ref={ref}>
      {isInView ? `${display}${suffix}` : "0"}
    </span>
  );
}


/* ─── SECTION HEADER ─── */
function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
      <span className="text-coral font-mono text-xs uppercase tracking-[0.2em] mb-3 block">{label}</span>
      <h2 className="font-display text-4xl md:text-5xl font-bold text-parchment mb-4">{title}</h2>
      {subtitle && <p className="text-mist text-lg max-w-2xl mx-auto">{subtitle}</p>}
    </motion.div>
  );
}

/* ─── PORTAL CARD ─── */
function PortalCard({ title, desc, icon: Icon, colorVar, features, link, delay }: {
  title: string; desc: string; icon: React.ElementType; colorVar: string; features: string[]; link: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="group relative surface-card rounded-3xl p-8 flex flex-col gap-5 border border-hairline overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 0% 0%, ${colorVar}18 0%, transparent 60%)` }} />
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border"
        style={{ background: `${colorVar}18`, borderColor: `${colorVar}40`, color: colorVar }}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-parchment mb-2">{title}</h3>
        <p className="text-mist text-sm leading-relaxed">{desc}</p>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-mist">
            <CheckCircle className="w-4 h-4 shrink-0" style={{ color: colorVar }} />{f}
          </li>
        ))}
      </ul>
      <Link href={link} className="mt-auto inline-flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3" style={{ color: colorVar }}>
        Enter Portal <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

/* ─── TESTIMONIAL CARD ─── */
function TestimonialCard({ quote, name, role, initial, color, delay }: {
  quote: string; name: string; role: string; initial: string; color: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className="surface-card rounded-3xl p-8 flex flex-col gap-6">
      <div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}</div>
      <p className="text-mist leading-relaxed text-sm flex-1">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-ink" style={{ background: color }}>{initial}</div>
        <div><p className="font-semibold text-parchment text-sm">{name}</p><p className="text-mist text-xs">{role}</p></div>
      </div>
    </motion.div>
  );
}

/* ─── STAT ITEM (hooks called at top level in parent map) ─── */
function StatItem({ value, suffix, label, icon: Icon, delay }: {
  value: number; suffix: string; label: string; icon: React.ElementType; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className="flex flex-col items-center text-center gap-2">
      <Icon className="w-6 h-6 text-coral mb-1" />
      <div className="font-display text-4xl md:text-5xl font-bold text-parchment">
        <AnimatedCounter target={value} suffix={suffix} />
      </div>
      <p className="text-mist text-xs uppercase tracking-widest font-mono">{label}</p>
    </motion.div>
  );
}

/* ─── FEATURE ITEM ─── */
function FeatureItem({ icon: Icon, title, desc, color, delay }: {
  icon: React.ElementType; title: string; desc: string; color: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className="surface-card rounded-3xl p-8 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-parchment">{title}</h3>
      <p className="text-mist leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ─── GALLERY ITEM ─── */
function GalleryItem({ src, alt, delay }: { src: string; alt: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay }}
      className="relative w-72 md:w-96 h-56 md:h-72 shrink-0 rounded-2xl overflow-hidden snap-start group"
    >
      <Image src={src} alt={alt} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 288px, 384px" />
      <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/0 transition-colors duration-500" />
    </motion.div>
  );
}

/* ─── NOTICE ITEM ─── */
function NoticeItem({ title, content, created_at, delay }: {
  title: string; content: string; created_at: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay }} className="w-72 sm:w-80 md:w-96 shrink-0 snap-start surface-card rounded-2xl p-6 border-l-2 border-coral flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-coral shrink-0" />
        <span className="text-mist text-xs font-mono">{new Date(created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
      </div>
      <h3 className="font-display text-lg font-bold text-parchment mb-2">{title}</h3>
      <p className="text-mist text-sm leading-relaxed line-clamp-3">{content}</p>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─── */
export default function LandingPage({ notices = [] }: {
  notices?: { title: string; content: string; created_at: string }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const prefersReducedMotion = useReducedMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const navBackground = useTransform(scrollYProgress, [0, 0.05], ["rgba(11,11,16,0)", "rgba(11,11,16,0.92)"]);
  const navBorder = useTransform(scrollYProgress, [0, 0.05], ["rgba(255,255,255,0)", "rgba(255,255,255,0.07)"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.18], ["0%", "-8%"]);

  const academicTabs = [
    { label: "Primary", grades: "Classes I – V", board: "CBSE Affiliated", subjects: ["English", "Hindi", "Mathematics", "Environmental Science", "Art & Craft", "Physical Education"], highlights: ["Activity-based learning", "Morning assembly & yoga", "Special drawing & music classes"] },
    { label: "Secondary", grades: "Classes VI – X", board: "BSEB Affiliated", subjects: ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit / Computer"], highlights: ["Science lab practicals", "Board exam preparation", "Career counselling sessions"] },
    { label: "Senior Secondary", grades: "Classes XI – XII", board: "BSEB Affiliated", subjects: ["Science (PCM / PCB)", "Commerce", "Humanities", "English Core", "Physical Education"], highlights: ["Dedicated faculty per subject", "Mock board examinations", "JEE / NEET / CA coaching support"] },
  ];

  const stats = [
    { value: 100, suffix: "%", label: "Board Passing Rate", icon: Trophy },
    { value: 15, suffix: "+", label: "Years of Excellence", icon: Award },
    { value: 800, suffix: "+", label: "Students Enrolled", icon: Users },
    { value: 50, suffix: "+", label: "Qualified Faculty", icon: GraduationCap },
  ];

  const features = [
    { icon: Zap, title: "Smart ERP Portals", desc: "Dedicated dashboards for admins, teachers, parents, and students. Manage attendance, fees, results, and notices — all in one place.", color: "#F1917D" },
    { icon: Microscope, title: "Modern Infrastructure", desc: "State-of-the-art science labs, a well-stocked library, computer lab, and sports facilities designed for 21st-century learning.", color: "#3E5C76" },
    { icon: Globe, title: "Holistic Development", desc: "Beyond textbooks — we nurture creativity, leadership, and character through sports, arts, cultural programs, and community service.", color: "#D4AF6A" },
  ];

  const portals = [
    { title: "Admin Portal", desc: "Full institutional oversight. Approve registrations, manage staff, publish notices, and track all financial records.", icon: Shield, colorVar: "#F1917D", features: ["Approve admissions", "Manage teachers & parents", "Publish notices", "View all reports"], link: "/login?role=admin" },
    { title: "Teacher Portal", desc: "Mark attendance with geolocation, upload results, and communicate with students securely.", icon: BookOpen, colorVar: "#3E5C76", features: ["Geofenced attendance", "Upload exam results", "Manage homework", "Chat with students"], link: "/login?role=teacher" },
    { title: "Parent Portal", desc: "Stay connected with your child's academic journey. Track attendance, fees, results, and school notices in real-time.", icon: Users, colorVar: "#D4AF6A", features: ["Child progress tracking", "Fee ledger & payments", "Attendance history", "School notices"], link: "/login?role=parent" },
    { title: "Student Portal", desc: "Your personal academic hub. Check results, homework, attendance, apply for leave, and chat with teachers.", icon: GraduationCap, colorVar: "#81B29A", features: ["View exam results", "Check attendance", "Submit homework", "Apply for leave"], link: "/login?role=student" },
  ];

  const testimonials = [
    { quote: "The parent portal has completely changed how I stay connected with my son's school life. I can see his attendance and results the same day. Truly a modern school.", name: "Ramesh Kumar Sinha", role: "Parent, Class IX Student", initial: "R", color: "#D4AF6A" },
    { quote: "RMSPS gave me more than just good marks. The teachers here genuinely care. I cleared JEE Advanced with the support of the dedicated faculty.", name: "Priya Sharma", role: "Alumni, Batch of 2024", initial: "P", color: "#81B29A" },
    { quote: "The geofenced attendance system is brilliant. As a teacher, I can now mark attendance in 2 minutes and focus entirely on teaching. The ERP portal is exceptional.", name: "Mrs. Kavita Pandey", role: "Senior Teacher, Mathematics", initial: "K", color: "#F1917D" },
  ];

  const galleryImages = [
    { src: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800", alt: "RMSPS school campus exterior" },
    { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800", alt: "Students engaged in classroom learning" },
    { src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800", alt: "School library reading room" },
    { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800", alt: "Science laboratory experiments" },
    { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800", alt: "Students in sports field" },
    { src: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800", alt: "School cultural program annual day" },
  ];


  return (
    <div ref={containerRef} className="bg-ink text-parchment overflow-x-hidden selection:bg-coral selection:text-ink">

      {/* ── NAVBAR ── */}
      <motion.nav
        style={{ backgroundColor: navBackground, borderColor: navBorder, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-5 border-b transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="font-display font-bold text-2xl tracking-widest flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-ink shrink-0 border border-hairline">
              <Image src="/icon-192.png" alt="RMSPS School Logo" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="text-coral">RMSPS</span>
          </motion.div>
          <div className="flex items-center gap-4 md:gap-8 text-sm font-medium">
            <div className="hidden md:flex items-center gap-8">
              {[["Academics", "#academics"], ["Portals", "#portals"], ["Campus", "#gallery"], ["Admissions", "#admissions"]].map(([label, href], i) => (
                <motion.a key={label} href={href} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05 }} className="text-mist hover:text-parchment transition-colors">{label}</motion.a>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-center gap-3">
              <Link href="/login" className="btn-primary px-5 py-2.5 rounded-full text-[11px] uppercase font-bold tracking-widest hover:scale-105 transition-transform whitespace-nowrap">Portal Login</Link>
              <button className="md:hidden p-2 text-mist hover:text-parchment" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle navigation menu">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </motion.div>
          </div>
        </div>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden bg-ink/98 border-t border-hairline mt-5 -mx-6 px-6">
              <div className="flex flex-col gap-6 py-8">
                {[["Academics", "#academics"], ["Portals", "#portals"], ["Campus", "#gallery"], ["Admissions", "#admissions"]].map(([label, href]) => (
                  <a key={label} href={href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-mist hover:text-parchment transition-colors">{label}</a>
                ))}
                <Link href="/login" className="btn-primary px-6 py-3 rounded-xl text-center font-bold">Portal Login</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO ── */}
      <div className="relative min-h-[100svh] w-full flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1920" alt="RMSPS School Campus — bright modern learning environment" fill priority className="object-cover object-center" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        </div>
        <div className="absolute top-1/3 left-1/4 w-[40vw] h-[40vh] bg-coral/8 blur-[120px] rounded-full pointer-events-none" />
        <motion.div style={{ opacity: heroOpacity, y: prefersReducedMotion ? "0%" : heroY }} className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-coral/30 bg-coral/10 text-coral text-xs font-mono uppercase tracking-widest mb-8 mt-12 md:mt-0">
            <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
            Admissions Open — Session 2026–27
          </motion.div>
          <h1 className="font-display font-extrabold text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.1] tracking-tight mb-8 max-w-4xl break-words">
            {["Shaping", "Tomorrow's", "Leaders,", "Today."].map((word, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }} className={`block ${i === 2 ? "text-coral" : ""}`}>{word}</motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }} className="text-mist text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
            R.M.S. Public School — a premier BSEB-affiliated residential school in Bihar, delivering academic excellence and holistic development since 2016.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.85 }} className="flex flex-wrap gap-4">
            <Link href="/student" className="inline-flex items-center gap-2 btn-primary px-8 py-4 rounded-xl font-bold tracking-wide text-base hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" /> Student Portal
            </Link>
            <Link href="/parent" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold tracking-wide border border-hairline hover:bg-surface hover:border-gold/40 transition-all text-parchment">
              <Users className="w-5 h-5 text-gold" /> Parent Portal
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-8 left-6 flex items-center gap-3 text-mist text-xs font-mono uppercase tracking-widest">
            <motion.div animate={prefersReducedMotion ? {} : { y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-[1px] h-10 bg-gradient-to-b from-coral to-transparent" />
            Scroll to explore
          </motion.div>
        </motion.div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="w-full border-y border-hairline bg-surface/50">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, icon }, i) => (
            <StatItem key={label} value={value} suffix={suffix} label={label} icon={icon} delay={i * 0.08} />
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <SectionHeader label="Why RMSPS" title="Built for Excellence" subtitle="Everything your child needs to learn, grow, and succeed — under one roof." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => <FeatureItem key={f.title} {...f} delay={i * 0.1} />)}
        </div>
      </div>

      {/* ── ACADEMIC PILLARS ── */}
      <div id="academics" className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <SectionHeader label="Academic Structure" title="Three Pillars of Learning" subtitle="A complete BSEB-affiliated journey from Primary to Senior Secondary." />
          <div className="flex gap-2 mb-10 p-1 bg-surface rounded-2xl w-fit max-w-full mx-auto overflow-x-auto snap-x" style={{ scrollbarWidth: "none" }}>
            {academicTabs.map((tab, i) => (
              <button key={tab.label} onClick={() => setActiveTab(i)} className={`shrink-0 snap-center whitespace-nowrap px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === i ? "bg-coral text-ink" : "text-mist hover:text-parchment"}`}>{tab.label}</button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 surface-card rounded-3xl p-8">
                <p className="text-mist text-xs font-mono uppercase tracking-widest mb-2">{academicTabs[activeTab].grades}</p>
                <h3 className="font-display text-3xl font-bold text-parchment mb-3">{academicTabs[activeTab].label}</h3>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-coral/30 bg-coral/10 text-coral text-xs font-semibold">
                  <Award className="w-3.5 h-3.5" />{academicTabs[activeTab].board}
                </span>
                <div className="mt-8 space-y-3">
                  {academicTabs[activeTab].highlights.map((h) => (
                    <div key={h} className="flex items-start gap-3 text-sm text-mist"><CheckCircle className="w-4 h-4 text-coral mt-0.5 shrink-0" />{h}</div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 surface-card rounded-3xl p-8">
                <p className="text-mist text-xs font-mono uppercase tracking-widest mb-6">Core Subjects</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {academicTabs[activeTab].subjects.map((subject) => (
                    <div key={subject} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-hairline text-sm text-parchment font-medium hover:border-coral/40 transition-colors">
                      <BookOpen className="w-4 h-4 text-coral shrink-0" />
                      <span className="truncate">{subject}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── PORTAL SHOWCASE ── */}
      <div id="portals" className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <SectionHeader label="Digital Portals" title="Engineered for Every Role" subtitle="Secure, role-specific dashboards for the entire school community." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {portals.map((portal, i) => <PortalCard key={portal.title} {...portal} delay={i * 0.08} />)}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <SectionHeader label="What People Say" title="Trusted by Families" subtitle="Real voices from our school community." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => <TestimonialCard key={t.name} {...t} delay={i * 0.1} />)}
          </div>
        </div>
      </div>

      {/* ── GALLERY STRIP ── */}
      <div id="gallery" className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-6">
          <SectionHeader label="Campus Life" title="Our Campus" />
        </div>
        <div className="flex gap-4 px-6 pb-12 overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {galleryImages.map((img, i) => <GalleryItem key={i} {...img} delay={i * 0.06} />)}
        </div>
      </div>

      {/* ── NOTICE BOARD ── */}
      <div id="notices" className="border-t border-hairline">
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-6 pb-6">
            <SectionHeader label="Latest Announcements" title="Notice Board" subtitle="Stay informed with official school announcements and updates." />
          </div>
          <div className="max-w-7xl mx-auto">
            {notices.length > 0 ? (
              <div className="flex gap-4 px-6 overflow-x-auto snap-x snap-mandatory pb-8" style={{ scrollbarWidth: "none" }}>
                {notices.map((notice, i) => <NoticeItem key={i} {...notice} delay={i * 0.05} />)}
              </div>
            ) : (
              <div className="text-center text-mist py-12 border border-dashed border-hairline rounded-2xl mx-6">
                No official announcements at this time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ADMISSIONS CTA ── */}
      <div id="admissions" className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-coral/15 via-surface to-ink border border-coral/25 p-12 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(241,145,125,0.12),transparent_60%)] pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-coral/40 bg-coral/15 text-coral text-xs font-mono uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" /> Applications Closing Soon
              </span>
              <h2 className="font-display text-4xl md:text-6xl font-bold text-parchment mb-4">Join RMSPS.</h2>
              <p className="text-mist text-lg mb-10 max-w-xl mx-auto">
                Secure your child&apos;s future with a BSEB-affiliated education that combines academic rigour with holistic development.{" "}
                <strong className="text-parchment">Session 2026–27 admissions are now open.</strong>
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/register" className="btn-primary inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-base hover:scale-105 transition-transform">
                  Apply Now <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="tel:+919546536279" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-base border border-hairline hover:border-coral/40 text-parchment hover:bg-surface transition-all">
                  <Phone className="w-5 h-5 text-coral" /> Call Admissions
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-hairline bg-surface/30">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-hairline shrink-0">
                  <Image src="/icon-192.png" alt="RMSPS School Logo" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-xl text-coral">RMSPS</span>
              </div>
              <p className="text-mist text-sm leading-relaxed max-w-xs mb-6">R.M.S. Public School — A premier BSEB-affiliated residential institution in Bihar committed to shaping future leaders.</p>
              <div className="space-y-3 text-sm text-mist">
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-coral mt-0.5 shrink-0" /><span>RMSPS Kating Chowk, Maheshpur road, Pipra, Bihar 852109</span></div>
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-coral shrink-0" /><a href="tel:+919546536279" className="hover:text-parchment transition-colors">+91 95465 36279</a></div>
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-coral shrink-0" /><a href="mailto:ekvillan222006@gmail.com" className="hover:text-parchment transition-colors">ekvillan222006@gmail.com</a></div>
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold text-parchment mb-6 text-sm uppercase tracking-widest">Portals</h4>
              <ul className="space-y-3">
                {[["Admin Portal", "/login"], ["Teacher Portal", "/login"], ["Parent Portal", "/login"], ["Student Portal", "/login"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-mist text-sm hover:text-parchment flex items-center gap-2 transition-colors group"><ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-parchment mb-6 text-sm uppercase tracking-widest">School</h4>
              <ul className="space-y-3">
                {[["Admissions", "/register"], ["Academic Info", "#academics"], ["Notice Board", "#notices"], ["Contact Us", "#admissions"]].map(([label, href]) => (
                  <li key={label}><a href={href} className="text-mist text-sm hover:text-parchment flex items-center gap-2 transition-colors group"><ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-hairline pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-mist text-xs font-mono">© 2026 R.M.S. Public School. All Rights Reserved.</p>
            <p className="text-mist text-xs font-mono">SYSTEM V3.0 — BSEB AFFILIATED</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
