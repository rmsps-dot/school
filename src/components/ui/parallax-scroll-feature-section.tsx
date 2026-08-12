'use client'

import { useRef } from "react"
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Sparkles } from "lucide-react"

export const ParallaxScrollFeatureSection = () => {
    // Array of school feature section data
    const sections = [
        {
            id: 1,
            tag: "INNOVATION IN ERP",
            title: "Smart Geofenced Attendance",
            description: "Real-time attendance verification using GPS location bounds, instant SMS/push alerts for parents, and automated attendance register compilation.",
            imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800',
            reverse: false,
            color: '#F1917D'
        },
        {
            id: 2,
            tag: "21ST CENTURY INFRASTRUCTURE",
            title: "Modern Science & Robotics Labs",
            description: "Hands-on practical learning equipped with modern physics, chemistry, biology equipment, and STEM robotics kits for experiential education.",
            imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800',
            reverse: true,
            color: '#3E5C76'
        },
        {
            id: 3,
            tag: "TRANSPARENT MANAGEMENT",
            title: "Digital Fee & Marksheet Ledger",
            description: "Instant online fee payments, detailed ledger tracking, printable BSEB marksheets, and multi-child academic analytics — accessible 24/7.",
            imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800',
            reverse: false,
            color: '#D4AF6A'
        }
    ]

    // Create refs and animations for each section
    const sectionRef0 = useRef(null);
    const sectionRef1 = useRef(null);
    const sectionRef2 = useRef(null);
    const sectionRefs = [sectionRef0, sectionRef1, sectionRef2];
    
    const scrollYProgress0 = useScroll({ target: sectionRef0, offset: ["start end", "center start"] }).scrollYProgress;
    const scrollYProgress1 = useScroll({ target: sectionRef1, offset: ["start end", "center start"] }).scrollYProgress;
    const scrollYProgress2 = useScroll({ target: sectionRef2, offset: ["start end", "center start"] }).scrollYProgress;
    const scrollYProgresses = [scrollYProgress0, scrollYProgress1, scrollYProgress2];

    // Create animations for each section
    const opacityContents = scrollYProgresses.map(progress => 
        useTransform(progress, [0, 0.7], [0, 1])
    );
    
    const clipProgresses = scrollYProgresses.map(progress => 
        useTransform(progress, [0, 0.7], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"])
    );
    
    const translateContents = scrollYProgresses.map(progress => 
        useTransform(progress, [0, 1], [-40, 0])
    );

  return (
    <div className="w-full bg-ink text-parchment py-16">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <span className="text-coral font-mono text-xs uppercase tracking-[0.2em] mb-3 inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Schooling
        </span>
        <h2 className="font-display text-4xl md:text-6xl font-bold text-parchment mb-4">
          Experience Excellence in Motion
        </h2>
        <p className="text-mist text-lg max-w-2xl mx-auto flex items-center justify-center gap-2">
          Scroll down to explore how RMSPS transforms education <ArrowDown className="w-4 h-4 text-coral animate-bounce" />
        </p>
      </div>

      <div className="flex flex-col max-w-7xl mx-auto px-6 md:px-12">
        {sections.map((section, index) => (
          <div 
            key={section.id}
            ref={sectionRefs[index]} 
            className={`min-h-[70vh] flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20 py-16 ${
              section.reverse ? 'md:flex-row-reverse' : ''
            }`}
          >
            <motion.div style={{ y: translateContents[index] }} className="flex-1 max-w-xl">
              <span className="text-xs font-mono tracking-widest uppercase mb-3 block" style={{ color: section.color }}>
                {section.tag}
              </span>
              <h3 className="font-display text-3xl md:text-5xl font-bold text-parchment mb-6 leading-tight">
                {section.title}
              </h3>
              <motion.p 
                style={{ y: translateContents[index] }} 
                className="text-mist text-base md:text-lg leading-relaxed"
              >
                {section.description}
              </motion.p>
            </motion.div>

            <motion.div 
              style={{ 
                opacity: opacityContents[index],
                clipPath: clipProgresses[index],
              }}
              className="relative flex-1 w-full max-w-md h-72 md:h-96 rounded-3xl overflow-hidden border border-hairline shadow-2xl group"
            >
              <img 
                src={section.imageUrl} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt={`Section ${section.title}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};
