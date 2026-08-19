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
  ArrowRight, Shield, Microscope, Trophy, Users, Menu, X,
  Star, CheckCircle, Mail, ChevronRight,
  Bell, GraduationCap, Award, BookOpen, Phone, MapPin,
  Sparkles, ArrowUpRight, Compass, Laptop, HeartHandshake,
  CheckCircle2, Building2, Layers, Check, Radio, Activity,
  Cpu, Flame, Compass as CompassIcon, FileText, CheckCheck,
} from "lucide-react";

import IntroPreloader from "@/components/landing/IntroPreloader";

/* ─── SINGLE ROLLING DIGIT COLUMN ─── */
function DigitColumn({ digit, delay, isInView }: { digit: number; delay: number; isInView: boolean }) {
  const targetIndex = digit === 0 ? 10 : digit;
  const digitsList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <span className="relative inline-block h-[1em] overflow-hidden align-baseline">
      <motion.span
        initial={{ y: "0%" }}
        animate={isInView ? { y: `-${(targetIndex / digitsList.length) * 100}%` } : { y: "0%" }}
        transition={{
          duration: 2.2,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex flex-col text-center"
      >
        {digitsList.map((num, idx) => (
          <span key={idx} className="h-[1em] leading-none flex items-center justify-center">
            {num}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/* ─── PREMIUM ROLLING REEL COUNTER ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const digits = target.toString().split("");

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="inline-flex items-baseline font-display tabular-nums font-extrabold tracking-tight"
    >
      {digits.map((char, idx) => {
        const digit = parseInt(char, 10);
        return (
          <DigitColumn
            key={idx}
            digit={digit}
            delay={idx * 0.12}
            isInView={isInView}
          />
        );
      })}
      {suffix && <span className="inline-block ml-0.5">{suffix}</span>}
    </motion.span>
  );
}

/* ─── SECTION HEADER ─── */
function SectionHeader({
  label,
  title,
  subtitle,
  badgeIcon: BadgeIcon,
}: {
  label: string;
  title: string;
  subtitle?: string;
  badgeIcon?: React.ElementType;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center mb-16 space-y-3"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-coral/30 bg-coral/10 text-coral text-xs font-mono uppercase tracking-[0.2em] shadow-sm">
        {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
        <span>{label}</span>
      </div>
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-parchment tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-mist text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* ─── INFINITE MARQUEE STRIP (100% GPU Hardware Accelerated) ─── */
function InfiniteMarquee() {
  const items = [
    "Residential Maa Saraswati Public School",
    "BSEB Affiliated Co-Educational Campus",
    "Smart Geofenced Attendance ERP",
    "100% Board Examination Pass Record",
    "Advanced Science, Computer & Robotics Labs",
    "Supervised Residential Hostels & Dining",
    "Integrated Olympiad & Competitive Coaching",
  ];

  return (
    <div className="w-full bg-ink/80 border-y border-hairline py-4 overflow-hidden relative select-none backdrop-blur-md">
      <div className="flex items-center gap-12 text-xs sm:text-sm font-semibold tracking-wider uppercase text-mist w-max animate-marquee">
        {[...items, ...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-8 shrink-0">
            <span className="flex items-center gap-2.5 text-parchment/90 hover:text-coral transition-colors cursor-default">
              <span className="w-2 h-2 rounded-full bg-coral inline-block shadow-[0_0_8px_rgba(241,145,125,0.6)]" />
              {item}
            </span>
            <span className="text-mist/30 font-mono text-xs">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── NOTICE CARD WITH MODAL PREVIEW ─── */
function NoticeCard({
  title,
  content,
  created_at,
  delay,
  onOpen,
}: {
  title: string;
  content: string;
  created_at: string;
  delay: number;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      onClick={onOpen}
      className="group w-80 sm:w-96 shrink-0 snap-start spotlight-card rounded-2xl p-6 border-l-4 border-coral border-y border-r border-hairline hover:border-coral/40 transition-all flex flex-col cursor-pointer bg-ink/70 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-coral shrink-0" />
          <span className="text-mist text-xs font-mono">
            {new Date(created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/20 font-bold">
          Circular
        </span>
      </div>
      <h3 className="font-display text-lg font-bold text-parchment mb-2 group-hover:text-coral transition-colors line-clamp-2">
        {title}
      </h3>
      <p className="text-mist text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
        {content}
      </p>
      <div className="flex items-center text-xs font-semibold text-coral group-hover:translate-x-1.5 transition-transform">
        <span>View Full Notice</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
      </div>
    </motion.div>
  );
}

/* ─── DIGITAL PORTAL BENTO CARD ─── */
function PortalCard({
  title,
  role,
  desc,
  icon: Icon,
  colorVar,
  features,
  previewText,
  link,
  delay,
}: {
  title: string;
  role: string;
  desc: string;
  icon: React.ElementType;
  colorVar: string;
  features: string[];
  previewText: string;
  link: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="group relative spotlight-card rounded-3xl p-8 flex flex-col justify-between border border-hairline overflow-hidden cursor-pointer"
      style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(11, 11, 16, 0.85) 100%)",
      }}
    >
      {/* Radiant Hover Ambient Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${colorVar}20 0%, transparent 65%)`,
        }}
      />

      <div>
        {/* Top Role Header */}
        <div className="flex items-center justify-between mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105"
            style={{
              background: `${colorVar}15`,
              borderColor: `${colorVar}40`,
              color: colorVar,
            }}
          >
            <Icon className="w-7 h-7" />
          </div>
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
            style={{
              background: `${colorVar}10`,
              borderColor: `${colorVar}30`,
              color: colorVar,
            }}
          >
            {role}
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold text-parchment mb-2 group-hover:text-parchment transition-colors">
          {title}
        </h3>
        <p className="text-mist text-sm leading-relaxed mb-6">{desc}</p>

        {/* Live Interface Preview Pill */}
        <div
          className="p-3.5 rounded-xl border mb-6 text-xs font-mono flex items-center gap-2.5 transition-colors"
          style={{
            background: "rgba(11, 11, 16, 0.6)",
            borderColor: `${colorVar}30`,
          }}
        >
          <div className="w-2 h-2 rounded-full animate-ping shrink-0" style={{ background: colorVar }} />
          <span className="text-mist truncate">{previewText}</span>
        </div>

        {/* Feature List */}
        <ul className="space-y-2.5 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-xs text-mist font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: colorVar }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Enter Action Button */}
      <Link
        href={link}
        className="mt-auto inline-flex items-center justify-between w-full py-3.5 px-5 rounded-xl border border-hairline group-hover:border-mist text-sm font-bold text-parchment transition-all shadow-md"
        style={{
          background: "rgba(11, 11, 16, 0.7)",
        }}
      >
        <span>Enter Portal</span>
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: colorVar }} />
      </Link>
    </motion.div>
  );
}

/* ─── TESTIMONIAL CARD ─── */
function TestimonialCard({
  quote,
  name,
  role,
  initial,
  color,
  delay,
}: {
  quote: string;
  name: string;
  role: string;
  initial: string;
  color: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group relative spotlight-card rounded-3xl p-8 flex flex-col justify-between gap-6 border border-hairline hover:border-coral/30 transition-all overflow-hidden"
    >
      <div className="flex gap-1.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-gold text-gold" />
        ))}
      </div>
      <p className="text-parchment/90 leading-relaxed text-sm flex-1 font-body">
        &quot;{quote}&quot;
      </p>
      <div className="flex items-center gap-3.5 pt-4 border-t border-hairline/60">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-ink text-sm shrink-0 shadow-md"
          style={{ background: color }}
        >
          {initial}
        </div>
        <div>
          <p className="font-bold text-parchment text-sm">{name}</p>
          <p className="text-mist text-xs font-mono">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─── */
export default function LandingPage({
  notices = [],
}: {
  notices?: { title: string; content: string; created_at: string }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const prefersReducedMotion = useReducedMotion();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNotice, setSelectedNotice] = useState<{ title: string; content: string; created_at: string } | null>(null);

  const navBackground = useTransform(scrollYProgress, [0, 0.05], ["rgba(11,11,16,0)", "rgba(11,11,16,0.92)"]);
  const navBorder = useTransform(scrollYProgress, [0, 0.05], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.18], ["0%", "-8%"]);

  const academicTabs = [
    {
      label: "Primary Wing",
      grades: "Classes I – V",
      board: "Foundational & Activity-Based",
      tagline: "Nurturing curiosity, foundational literacy, character building, and social confidence.",
      subjects: [
        { name: "English Language & Phonics", tag: "Daily Drill" },
        { name: "Hindi & Sanskrit Basics", tag: "Cultural Roots" },
        { name: "Mathematics & Logic", tag: "Mental Math" },
        { name: "Environmental Studies (EVS)", tag: "Nature Lab" },
        { name: "Art, Craft & Creative Expression", tag: "Studio Hours" },
        { name: "Daily Yoga & Morning Assembly", tag: "Physical Vitality" },
      ],
      highlights: [
        "Interactive activity-based learning modules",
        "Morning meditation, prayer & moral value education",
        "Dedicated music, art & creative expression sessions",
        "Safe, nurturing residential supervision",
      ],
    },
    {
      label: "Secondary Wing",
      grades: "Classes VI – X",
      board: "BSEB Affiliated Curriculum",
      tagline: "Rigorous academic preparation with modern science & computer laboratory practicals.",
      subjects: [
        { name: "English Language & Literature", tag: "Advanced Grammar" },
        { name: "Hindi & Sanskrit", tag: "Board Syllabus" },
        { name: "Mathematics & Geometry", tag: "Board Problem Sets" },
        { name: "Science (Physics, Chemistry, Biology)", tag: "Practical Labs" },
        { name: "Social Sciences (History, Civics, Geo)", tag: "Case Studies" },
        { name: "Computer Science & Digital Literacy", tag: "Hands-on Coding" },
      ],
      highlights: [
        "Hands-on Science & Computer Lab practical sessions",
        "Comprehensive BSEB Board examination preparation",
        "Regular Olympiad & competitive aptitude test series",
        "Structured daily evening study halls for boarders",
      ],
    },
    {
      label: "Senior Secondary",
      grades: "Classes XI – XII",
      board: "BSEB Specialized Streams",
      tagline: "Focused streams in Science, Commerce & Arts with entrance exam orientation.",
      subjects: [
        { name: "Physics, Chemistry, Math / Biology", tag: "JEE & NEET Track" },
        { name: "Accountancy, Business Studies & Economics", tag: "CA Foundation Track" },
        { name: "History, Political Science & Sociology", tag: "UPSC / Law Track" },
        { name: "English Core & Informatics Practices", tag: "Digital Proficiency" },
      ],
      highlights: [
        "Subject-matter expert faculty for each academic discipline",
        "Rigorous mock board test series & individual evaluation",
        "Integrated coaching support for JEE, NEET, and CA Foundation",
        "Individual career counselling & guidance mentorship",
      ],
    },
  ];

  const stats = [
    { value: 98, suffix: "%", label: "Board Pass Rate", icon: Trophy },
    { value: 15, suffix: "+", label: "Years of Excellence", icon: Award },
    { value: 1000, suffix: "+", label: "Active Scholars", icon: Users },
    { value: 20, suffix: "+", label: "Master Faculty", icon: GraduationCap },
  ];

  const portals = [
    {
      title: "Admin Portal",
      role: "Governance & ERP",
      desc: "Full institutional governance: approve registrations, manage faculty assignments, configure attendance geofence, and inspect financial ledgers.",
      icon: Shield,
      colorVar: "#F1917D",
      previewText: "ERP Audit: 100% Verified • 0 Pending Approvals",
      features: ["Admissions verification & approvals", "Faculty & classroom assignments", "Location geofence control", "Financial ledgers & fee audits"],
      link: "/login?role=admin",
    },
    {
      title: "Teacher Portal",
      role: "Faculty & Academics",
      desc: "Instant geofenced attendance marking, examination result entries, homework distribution, and direct student communication.",
      icon: BookOpen,
      colorVar: "#3E5C76",
      previewText: "Geofence: Inside Campus • 35 Marked Present",
      features: ["Geofenced instant attendance", "Terminal exam marks publishing", "Homework assignments & tracking", "Direct scholar mentorship chat"],
      link: "/login?role=teacher",
    },
    {
      title: "Parent Portal",
      role: "Guardian View",
      desc: "Real-time visibility into your ward's daily attendance records, examination report cards, fee deposit ledgers, and official circulars.",
      icon: Users,
      colorVar: "#D4AF6A",
      previewText: "Today's Status: Present at 07:45 AM • Fee Paid",
      features: ["Live attendance notification", "Fee deposits & digital receipts", "Terminal report card summaries", "Official school circulars"],
      link: "/login?role=parent",
    },
    {
      title: "Student Portal",
      role: "Scholar Hub",
      desc: "Personal academic dashboard: check subject marks, download homework assignments, monitor attendance percentage, and apply for leave.",
      icon: GraduationCap,
      colorVar: "#81B29A",
      previewText: "Term Exam Score: 94.8% (A+) • 2 Tasks Due",
      features: ["Exam scorecards & analytics", "Homework tasks & submissions", "Leave applications & tracking", "Direct teacher query portal"],
      link: "/login?role=student",
    },
  ];

  const facilities = [
    {
      title: "Advanced Science & Robotics Labs",
      desc: "State-of-the-art physics, chemistry, biology, and robotics laboratories fostering scientific curiosity and practical experiments.",
      icon: Microscope,
      tag: "Practical Science",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800",
    },
    {
      title: "Smart Digital Classrooms",
      desc: "Spacious, well-ventilated classrooms equipped with digital learning displays for immersive audio-visual education.",
      icon: Laptop,
      tag: "Digital Infrastructure",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800",
    },
    {
      title: "Supervised Residential Hostels",
      desc: "Safe, hygienic hostel facilities with nutritious dining, 24/7 warden supervision, medical care, and disciplined study hours.",
      icon: HeartHandshake,
      tag: "Campus Living",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800",
    },
    {
      title: "Athletic Grounds & Sports Complex",
      desc: "Large outdoor athletic fields for cricket, football, volleyball, and indoor sports promoting physical vigor and team spirit.",
      icon: Trophy,
      tag: "Physical Fitness",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800",
    },
  ];

  const testimonials = [
    {
      quote:
        "The parent portal has completely transformed how I stay connected with my son's daily attendance and terminal results. As a working parent, this real-time transparency is remarkable.",
      name: "Ramesh Kumar Sinha",
      role: "Parent, Class IX Student",
      initial: "R",
      color: "#D4AF6A",
    },
    {
      quote:
        "RMSPS gave me the academic discipline, faculty guidance, and conceptual foundations that helped me excel in my BSEB board exams and secure competitive admission.",
      name: "Priya Sharma",
      role: "Alumni, Batch of 2024",
      initial: "P",
      color: "#81B29A",
    },
    {
      quote:
        "The geofenced smart attendance system and digital gradebook save valuable administrative hours, allowing us teachers to dedicate our full energy to each student's progress.",
      name: "Mrs. Kavita Pandey",
      role: "Senior Faculty, Mathematics",
      initial: "K",
      color: "#F1917D",
    },
  ];

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

  const displayNotices = notices.length > 0 ? notices : defaultNotices;

  return (
    <div
      ref={containerRef}
      className="bg-ink text-parchment min-h-screen overflow-x-hidden selection:bg-coral selection:text-ink relative"
    >
      {/* ── CINEMATIC BRAND INTRO PRELOADER ── */}
      <IntroPreloader />

      {/* ── BACKGROUND AMBIENT RADIAL LIGHTING ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-coral/5 blur-[160px]" />
        <div className="absolute top-[30%] -right-40 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[160px]" />
        <div className="absolute top-[70%] left-[20%] w-[600px] h-[600px] rounded-full bg-veena-blue/8 blur-[180px]" />
      </div>

      {/* ── NAVBAR ── */}
      <motion.nav
        style={{
          backgroundColor: navBackground,
          borderColor: navBorder,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-ink shrink-0 border border-hairline group-hover:border-coral transition-colors p-0.5">
              <Image
                src="/icon-192.png"
                alt="RMSPS Official Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-wider text-parchment group-hover:text-coral transition-colors">
                RMSPS
              </span>
              <span className="text-[10px] font-mono text-mist tracking-widest uppercase">
                Residential School
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {[
              ["Academics", "#academics"],
              ["Portals", "#portals"],
              ["Facilities", "#facilities"],
              ["Notice Board", "#notices"],
              ["Admissions", "#admissions"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-mist hover:text-parchment transition-colors text-xs font-semibold uppercase tracking-wider"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right Portal Login & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn-primary px-5 py-2.5 rounded-full text-xs uppercase font-bold tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-coral/10"
            >
              <span>Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              className="lg:hidden p-2 rounded-xl border border-hairline text-mist hover:text-parchment"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-ink/98 border-t border-hairline mt-4 -mx-6 px-6"
            >
              <div className="flex flex-col gap-5 py-6">
                {[
                  ["Academics", "#academics"],
                  ["Portals", "#portals"],
                  ["Facilities", "#facilities"],
                  ["Notice Board", "#notices"],
                  ["Admissions", "#admissions"],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-semibold text-mist hover:text-parchment transition-colors"
                  >
                    {label}
                  </a>
                ))}
                <Link
                  href="/login"
                  className="btn-primary px-6 py-3 rounded-xl text-center font-bold text-sm"
                >
                  Enter Portal Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO SECTION: PRESTIGIOUS SCHOOL IDENTITY & SMART COCKPIT ── */}
      <div className="relative min-h-[100svh] w-full flex items-center justify-center pt-28 pb-16 overflow-hidden">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1920"
            alt="RMSPS School Campus Exterior"
            fill
            priority
            className="object-cover object-center opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/90 to-ink/60" />
          <div className="absolute inset-0 bg-radial-vignette opacity-80" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: prefersReducedMotion ? "0%" : heroY }}
          className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Left Column: Official School Name Headline & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Live Admissions Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-coral/30 bg-coral/10 text-coral text-xs font-mono uppercase tracking-widest shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              <span>Admissions Open • Session 2026–27</span>
            </motion.div>

            {/* Official School Name Headline */}
            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-[4rem] leading-[1.1] tracking-tight text-parchment">
                Residential Maa Saraswati Public School
              </h1>
              <p className="font-mono text-sm sm:text-base text-coral tracking-widest uppercase font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-coral inline-block" />
                <span>R.M.S. Public School • Kating Chowk, Pipra</span>
              </p>
            </div>

            {/* Sub-headline / Mission Statement */}
            <p className="text-mist text-base sm:text-lg max-w-xl leading-relaxed">
              A premier BSEB-affiliated residential institution delivering academic excellence, modern science practicals, and disciplined character education since 2016.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/student"
                className="btn-primary inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide hover:scale-105 transition-transform shadow-xl shadow-coral/10"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Student Portal</span>
              </Link>
              <Link
                href="/parent"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide border border-hairline hover:border-gold/40 text-parchment hover:bg-surface transition-all bg-ink/60"
              >
                <Users className="w-5 h-5 text-gold" />
                <span>Parent Portal</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-xs font-mono text-coral hover:text-parchment transition-colors uppercase tracking-wider"
              >
                <span>Apply for Admission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Hero HUD Bento Card (Smart Campus Cockpit) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="spotlight-card rounded-3xl p-6 sm:p-8 border border-hairline bg-ink/80 backdrop-blur-xl shadow-2xl space-y-6"
            >
              {/* Card Top Title */}
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center border border-coral/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-parchment text-base">
                      Institutional Credentials
                    </h3>
                    <p className="text-[11px] font-mono text-mist">BSEB Code: 852109 • Est. 2016</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active ERP
                </span>
              </div>

              {/* 2x2 Metric Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface border border-hairline">
                  <p className="text-2xl sm:text-3xl font-display font-bold text-coral">98%</p>
                  <p className="text-xs text-mist font-medium mt-1">Board Pass Rate</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-hairline">
                  <p className="text-2xl sm:text-3xl font-display font-bold text-gold">15+ Yrs</p>
                  <p className="text-xs text-mist font-medium mt-1">Academic Legacy</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-hairline">
                  <p className="text-2xl sm:text-3xl font-display font-bold text-[#81B29A]">1000+</p>
                  <p className="text-xs text-mist font-medium mt-1">Active Scholars</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-hairline">
                  <p className="text-2xl sm:text-3xl font-display font-bold text-veena-blue">20+</p>
                  <p className="text-xs text-mist font-medium mt-1">Master Faculty</p>
                </div>
              </div>

              {/* Key Trust Check */}
              <div className="p-4 rounded-2xl bg-coral/5 border border-coral/20 flex items-center gap-3 text-xs text-mist">
                <Shield className="w-5 h-5 text-coral shrink-0" />
                <span>Geofenced smart attendance & verified terminal gradebooks for all students.</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Beacon Indicator */}
        <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3 text-mist text-xs font-mono uppercase tracking-widest">
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-[1px] h-8 bg-gradient-to-b from-coral to-transparent"
          />
          <span>Scroll to explore</span>
        </div>
      </div>

      {/* ── INFINITE MARQUEE TICKER ── */}
      <InfiniteMarquee />

      {/* ── STATS BAR ── */}
      <div className="w-full border-y border-hairline bg-surface/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <Icon className="w-6 h-6 text-coral mb-1" />
              <div className="font-display text-4xl md:text-5xl font-bold text-parchment">
                <AnimatedCounter target={value} suffix={suffix} />
              </div>
              <p className="text-mist text-xs uppercase tracking-widest font-mono">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── NOTICE BOARD CAROUSEL ── */}
      <div id="notices" className="border-t border-hairline py-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            label="Latest Announcements"
            title="Official Notice Board"
            subtitle="Real-time circulars, examination schedules, and institutional events."
            badgeIcon={Bell}
          />

          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 no-scrollbar">
            {displayNotices.map((notice, idx) => (
              <NoticeCard
                key={idx}
                {...notice}
                delay={idx * 0.08}
                onOpen={() => setSelectedNotice(notice)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── DIGITAL PORTAL SHOWCASE (BENTO GRID) ── */}
      <div id="portals" className="border-t border-hairline py-24 bg-surface/20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            label="Dedicated Portals"
            title="Engineered for Every Stakeholder"
            subtitle="Tailored digital workflows for administrators, educators, parents, and scholars."
            badgeIcon={Compass}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {portals.map((portal, idx) => (
              <PortalCard key={portal.title} {...portal} delay={idx * 0.08} />
            ))}
          </div>
        </div>
      </div>

      {/* ── ACADEMIC STRUCTURE (TABS) ── */}
      <div id="academics" className="border-t border-hairline py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            label="Academic Curriculum"
            title="Pillars of Education"
            subtitle="A complete BSEB-affiliated journey from Primary foundational classes to Senior Secondary specialization."
            badgeIcon={GraduationCap}
          />

          {/* Tab Selector */}
          <div className="flex bg-ink/70 p-1.5 rounded-2xl border border-hairline w-fit max-w-full mx-auto overflow-x-auto mb-10 no-scrollbar shadow-inner">
            {academicTabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`relative shrink-0 whitespace-nowrap px-6 py-3 rounded-xl text-sm font-semibold transition-colors z-10 ${
                  activeTab === i ? "text-ink font-bold" : "text-mist hover:text-parchment"
                }`}
              >
                {tab.label}
                {activeTab === i && (
                  <motion.div
                    layoutId="academic-tab-indicator"
                    className="absolute inset-0 bg-coral rounded-xl -z-10 shadow-lg shadow-coral/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Active Tab Content Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Grade Summary */}
              <div className="lg:col-span-5 spotlight-card rounded-3xl p-8 border border-hairline space-y-6">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-coral bg-coral/10 px-3 py-1 rounded-full border border-coral/20">
                  {academicTabs[activeTab].grades}
                </span>
                <h3 className="font-display text-3xl font-bold text-parchment">
                  {academicTabs[activeTab].label}
                </h3>
                <p className="text-mist text-sm leading-relaxed">
                  {academicTabs[activeTab].tagline}
                </p>
                <div className="pt-4 border-t border-hairline space-y-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-parchment font-bold">
                    Key Highlights:
                  </p>
                  {academicTabs[activeTab].highlights.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-xs text-mist">
                      <CheckCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Core Subjects Grid */}
              <div className="lg:col-span-7 spotlight-card rounded-3xl p-8 border border-hairline space-y-6">
                <p className="text-xs font-mono uppercase tracking-wider text-parchment font-bold">
                  Curriculum & Core Subjects:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {academicTabs[activeTab].subjects.map((subj) => (
                    <div
                      key={subj.name}
                      className="p-4 rounded-xl bg-surface border border-hairline flex items-center justify-between gap-3 hover:border-coral/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-coral shrink-0" />
                        <span className="text-sm font-medium text-parchment">{subj.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 shrink-0">
                        {subj.tag}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-surface-hover border border-hairline flex items-center justify-between text-xs text-mist">
                  <span>Standard BSEB Board Curriculum with Continuous Practical Labs</span>
                  <Award className="w-4 h-4 text-gold" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── CAMPUS FACILITIES (BENTO SHOWCASE) ── */}
      <div id="facilities" className="border-t border-hairline py-24 bg-surface/10">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            label="Campus Infrastructure"
            title="World-Class Learning Environment"
            subtitle="Equipped with specialized laboratories, digital classrooms, secure residential hostels, and athletic grounds."
            badgeIcon={Sparkles}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilities.map((fac) => (
              <div
                key={fac.title}
                className="group spotlight-card rounded-3xl overflow-hidden border border-hairline relative flex flex-col justify-end min-h-[320px] p-8"
              >
                {/* Background Image with Zoom */}
                <Image
                  src={fac.image}
                  alt={fac.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-30"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" />

                {/* Content Overlay */}
                <div className="relative z-10 space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-coral px-3 py-1 rounded-full bg-coral/10 border border-coral/20 inline-block font-bold">
                    {fac.tag}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-parchment group-hover:text-coral transition-colors">
                    {fac.title}
                  </h3>
                  <p className="text-mist text-sm leading-relaxed max-w-md">
                    {fac.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── VOICES OF TRUST (TESTIMONIALS) ── */}
      <div className="border-t border-hairline py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            label="Community Voices"
            title="Trusted by Families & Scholars"
            subtitle="Hear from the parents, alumni, and educators that define RMSPS."
            badgeIcon={Star}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <TestimonialCard key={t.name} {...t} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </div>

      {/* ── ADMISSIONS CONVERSION CTA BANNER ── */}
      <div id="admissions" className="border-t border-hairline py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-coral/15 via-surface to-ink border border-coral/30 p-10 sm:p-14 md:p-16 text-center shadow-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(241,145,125,0.15),transparent_65%)] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-coral/40 bg-coral/15 text-coral text-xs font-mono uppercase tracking-widest font-bold">
                <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                Session 2026–27 Open
              </span>

              <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold text-parchment tracking-tight">
                Begin Your Journey at RMSPS.
              </h2>

              <p className="text-mist text-base sm:text-lg leading-relaxed">
                Give your child the gift of disciplined residential education, modern laboratory practicals, and dedicated faculty mentorship. Applications for the 2026–27 session are now being processed.
              </p>

              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Link
                  href="/register"
                  className="btn-primary inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-base hover:scale-105 transition-transform shadow-xl shadow-coral/20"
                >
                  <span>Apply for Admission</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="tel:+919546536279"
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-base border border-hairline hover:border-coral/40 text-parchment hover:bg-surface transition-all bg-ink/80"
                >
                  <Phone className="w-5 h-5 text-coral" />
                  <span>Call Admissions: +91 95465 36279</span>
                </a>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-6 pt-6 text-mist text-xs font-mono uppercase tracking-wider border-t border-hairline/60">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-coral" /> Instant Online Registration
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gold" /> Direct Office Guidance
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Limited Residential Seats
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-hairline bg-ink/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Column 1: School Identity */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-hairline shrink-0 p-0.5">
                  <Image
                    src="/icon-192.png"
                    alt="RMSPS Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="font-display font-bold text-xl text-coral tracking-wider">
                  RMSPS
                </span>
              </div>
              <p className="text-mist text-sm leading-relaxed max-w-sm">
                Residential Maa Saraswati Public School — A premier BSEB-affiliated residential institution committed to cultivating intellectual excellence and leadership.
              </p>
              <div className="space-y-2.5 text-xs text-mist pt-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                  <span>Kating Chowk, Maheshpur road, Pipra, Bihar 852109</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-coral shrink-0" />
                  <a href="tel:+919546536279" className="hover:text-parchment transition-colors">
                    +91 95465 36279
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-coral shrink-0" />
                  <a
                    href="mailto:srzsurazzrajput@gmail.com"
                    className="hover:text-parchment transition-colors"
                  >
                    srzsurazzrajput@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Digital Portals */}
            <div>
              <h4 className="font-display font-bold text-parchment mb-5 text-xs uppercase tracking-widest">
                Digital Portals
              </h4>
              <ul className="space-y-3 text-xs">
                {[
                  ["Admin Portal", "/login?role=admin"],
                  ["Teacher Portal", "/login?role=teacher"],
                  ["Parent Portal", "/login?role=parent"],
                  ["Student Portal", "/login?role=student"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-mist hover:text-parchment flex items-center gap-2 transition-colors group"
                    >
                      <ChevronRight className="w-3 h-3 text-coral group-hover:translate-x-1 transition-transform" />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Quick Navigation */}
            <div>
              <h4 className="font-display font-bold text-parchment mb-5 text-xs uppercase tracking-widest">
                Quick Navigation
              </h4>
              <ul className="space-y-3 text-xs">
                {[
                  ["Online Admissions", "/register"],
                  ["Academic Curriculum", "#academics"],
                  ["Campus Facilities", "#facilities"],
                  ["Notice Board", "#notices"],
                  ["Portal Sign In", "/login"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-mist hover:text-parchment flex items-center gap-2 transition-colors group"
                    >
                      <ChevronRight className="w-3 h-3 text-gold group-hover:translate-x-1 transition-transform" />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-hairline pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-mist">
            <p>© 2026 Residential Maa Saraswati Public School. All rights reserved.</p>
            <p className="text-coral">FLAGSHIP SYSTEM V3.0 • BSEB AFFILIATED</p>
          </div>
        </div>
      </footer>

      {/* ── NOTICE DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="spotlight-card rounded-3xl border border-hairline w-full max-w-lg p-6 sm:p-8 bg-ink text-parchment shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-coral">
                  <Bell className="w-4 h-4" />
                  <span>Official Circular</span>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-1.5 rounded-lg border border-hairline hover:border-mist text-mist hover:text-parchment transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-mono text-mist">
                  Published:{" "}
                  {new Date(selectedNotice.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h3 className="font-display text-xl font-bold text-parchment">
                  {selectedNotice.title}
                </h3>
                <p className="text-mist text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.content}
                </p>
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
                >
                  Close Circular
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
