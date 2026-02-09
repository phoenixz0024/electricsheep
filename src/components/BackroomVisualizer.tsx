"use client";

import { useMemo } from "react";
import type { MoodVector } from "@/lib/types";

const SYMBOLS = ["\u25C9", "\u2591", "\u2593", "\u221E", "\u25C8", "\u263E", "\u25B3", "\u2588", "\u2592", "\u25CA"];

interface BackroomVisualizerProps {
  mood: MoodVector;
}

interface FloatingSymbol {
  char: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  fontSize: number;
}

export function BackroomVisualizer({ mood }: BackroomVisualizerProps) {
  // Derive visual properties from mood
  const hue = Math.round(((mood.valence + 1) / 2) * 60 + 240); // -1=deep purple(240), +1=warm amber(300)
  const ambientHue2 = hue + 40;
  const symbolCount = Math.round(8 + Math.abs(mood.arousal) * 8); // 8-16 symbols
  const baseSpeed = 40 - Math.abs(mood.arousal) * 20; // high arousal = faster (20-40s)
  const grainOpacity = 0.06;

  // Generate stable floating symbols
  const symbols: FloatingSymbol[] = useMemo(() => {
    const result: FloatingSymbol[] = [];
    for (let i = 0; i < symbolCount; i++) {
      const seed1 = ((i * 7 + 13) % 100) / 100;
      const seed2 = ((i * 11 + 31) % 100) / 100;
      const seed3 = ((i * 17 + 7) % 100) / 100;
      result.push({
        char: SYMBOLS[i % SYMBOLS.length],
        x: seed1 * 100,
        y: seed2 * 100,
        duration: baseSpeed + seed3 * 20,
        delay: -(seed1 * 30),
        opacity: 0.04 + seed3 * 0.08,
        fontSize: 10 + seed2 * 14,
      });
    }
    return result;
  }, [symbolCount, baseSpeed]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Ambient gradient layer */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse 120% 100% at 50% 50%, hsl(${hue}, 25%, 8%) 0%, hsl(${ambientHue2}, 20%, 4%) 50%, hsl(0, 0%, 2%) 100%)`,
          transition: "background 3s ease-in-out",
        }}
      />

      {/* Floating ASCII symbols */}
      {symbols.map((sym, i) => (
        <span
          key={i}
          className="absolute chromatic-aberration"
          style={{
            left: `${sym.x}%`,
            top: `${sym.y}%`,
            fontSize: `${sym.fontSize}px`,
            opacity: sym.opacity,
            color: `hsl(${hue + (i * 30) % 60}, 30%, 50%)`,
            fontFamily: "var(--font-mono)",
            animation: `backroom-float-${i % 3} ${sym.duration}s linear ${sym.delay}s infinite`,
          }}
        >
          {sym.char}
        </span>
      ))}

      {/* Enhanced grain overlay */}
      <div
        className="grain-overlay"
        style={{ opacity: grainOpacity }}
      />

      {/* Drift animation styles injected inline */}
      <style>{`
        @keyframes backroom-float-0 {
          0% { transform: translate(0, 0); }
          25% { transform: translate(15px, -40px); }
          50% { transform: translate(-10px, -80px); }
          75% { transform: translate(20px, -120px); }
          100% { transform: translate(0, -200vh); }
        }
        @keyframes backroom-float-1 {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-20px, -60px) rotate(5deg); }
          66% { transform: translate(10px, -130px) rotate(-3deg); }
          100% { transform: translate(-5px, -200vh) rotate(8deg); }
        }
        @keyframes backroom-float-2 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(25px, -100px); }
          100% { transform: translate(-15px, -200vh); }
        }
      `}</style>
    </div>
  );
}
