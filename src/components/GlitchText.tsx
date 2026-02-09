"use client";

import { useEffect, useRef, useState } from "react";

const GLITCH_CHARS = [
  "\u2591", "\u2592", "\u2593", "\u25C8", "\u25CA", "\u2666",
  "\u2588", "\u2580", "\u2584", "\u25A0", "\u25AA", "\u00B6",
  "\u00A7", "\u2302", "\u263A", "\u2261",
];

interface GlitchTextProps {
  text: string;
  speed?: number;
  glitchIntensity?: number;
  font?: "mono" | "dream";
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
}

export function GlitchText({
  text,
  speed = 30,
  glitchIntensity = 0.08,
  font = "mono",
  className = "",
  as: Tag = "span",
}: GlitchTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    setIsComplete(false);

    let rafId: number;
    let lastTime = 0;

    function step(timestamp: number) {
      if (timestamp - lastTime < speed) {
        rafId = requestAnimationFrame(step);
        return;
      }
      lastTime = timestamp;

      if (indexRef.current >= text.length) {
        setDisplayed(text);
        setIsComplete(true);
        return;
      }

      const currentIndex = indexRef.current;
      const shouldGlitch = Math.random() < glitchIntensity;

      if (shouldGlitch) {
        const glyphChar =
          GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        const glitched =
          text.slice(0, currentIndex) +
          glyphChar +
          text.slice(currentIndex + 1);
        setDisplayed(glitched.slice(0, currentIndex + 1));

        // Correct after a short delay
        if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
        glitchTimeoutRef.current = setTimeout(() => {
          setDisplayed(text.slice(0, currentIndex + 1));
        }, 50 + Math.random() * 60);
      } else {
        setDisplayed(text.slice(0, currentIndex + 1));
      }

      indexRef.current++;
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    };
  }, [text, speed, glitchIntensity]);

  const fontFamily =
    font === "dream" ? "var(--font-dream)" : "var(--font-mono)";

  return (
    <Tag className={className} style={{ fontFamily }}>
      {displayed}
      {!isComplete && (
        <span className="terminal-cursor inline-block w-[0.5em] text-term-cyan">
          _
        </span>
      )}
    </Tag>
  );
}
