"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface CharacterSpanProps {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}

function CharacterSpan({ char, progress, range }: CharacterSpanProps) {
  const opacity = useTransform(progress, range, [0.2, 1]);

  return (
    <span className="relative inline-block">
      <span className="opacity-0">{char === " " ? "\u00A0" : char}</span>
      <motion.span style={{ opacity }} className="absolute inset-0">
        {char === " " ? "\u00A0" : char}
      </motion.span>
    </span>
  );
}

interface AnimatedTextProps {
  text: string;
  className?: string;
}

export default function AnimatedText({ text, className = "" }: AnimatedTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.2"],
  });

  const totalChars = text.length;
  // Split text into words to prevent unnatural mid-word line breaks
  const words = text.split(" ");
  let charIndexCounter = 0;

  return (
    <p ref={containerRef} className={className}>
      {words.map((word, wordIndex) => {
        const wordChars = word.split("");
        const isLastWord = wordIndex === words.length - 1;

        return (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {wordChars.map((char) => {
              const currentIndex = charIndexCounter++;
              const start = currentIndex / totalChars;
              const end = Math.min(1, (currentIndex + 1) / totalChars);

              return (
                <CharacterSpan
                  key={currentIndex}
                  char={char}
                  progress={scrollYProgress}
                  range={[start, end]}
                />
              );
            })}
            {!isLastWord && (
              <CharacterSpan
                key={`space-${wordIndex}`}
                char=" "
                progress={scrollYProgress}
                range={[
                  charIndexCounter / totalChars,
                  Math.min(1, (charIndexCounter + 1) / totalChars),
                ]}
              />
            )}
          </span>
        );
      })}
    </p>
  );
}
