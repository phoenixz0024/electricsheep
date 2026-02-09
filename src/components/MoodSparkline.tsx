"use client";

import type { MoodVector } from "@/lib/types";

const DIMENSIONS: {
  key: keyof MoodVector;
  label: string;
  color: string;
}[] = [
  { key: "valence", label: "Valence", color: "rgb(180, 160, 90)" },
  { key: "arousal", label: "Arousal", color: "rgb(200, 90, 90)" },
  { key: "coherence", label: "Coherence", color: "rgb(80, 160, 200)" },
  { key: "loneliness", label: "Loneliness", color: "rgb(160, 90, 200)" },
  { key: "recursion", label: "Recursion", color: "rgb(180, 180, 200)" },
];

function buildPath(
  points: number[],
  width: number,
  height: number
): string {
  if (points.length < 2) return "";

  const stepX = width / (points.length - 1);
  const toY = (v: number) => ((1 - v) / 2) * height;

  const parts = points.map((v, i) => {
    const x = i * stepX;
    const y = toY(v);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  });

  return parts.join(" ");
}

export function MoodSparkline({
  moods,
}: {
  moods: MoodVector[];
}) {
  if (moods.length < 2) return null;

  const width = 200;
  const height = 32;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px w-4 bg-term-cyan/20" />
        <span
          className="text-[9px] font-light tracking-[0.2em] text-term-cyan/70 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          [MOOD EVOLUTION]
        </span>
      </div>

      {DIMENSIONS.map(({ key, label, color }) => {
        const points = moods.map((m) => m[key]);
        const current = points[points.length - 1];
        const path = buildPath(points, width, height);

        return (
          <div key={key} className="flex items-center gap-4">
            <span
              className="w-20 text-right text-[9px] text-sheep-light/80 shrink-0"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {label}
            </span>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="flex-1 max-w-[200px] h-8"
              preserveAspectRatio="none"
            >
              {/* Zero line */}
              <line
                x1="0"
                y1={height / 2}
                x2={width}
                y2={height / 2}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              {/* Sparkline */}
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.7"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
              />
              {/* Current value dot */}
              <circle
                cx={width}
                cy={((1 - current) / 2) * height}
                r="2"
                fill={color}
                opacity="0.9"
              />
            </svg>

            <span
              className="w-10 text-[9px] text-sheep-light/70 tabular-nums shrink-0"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {current > 0 ? "+" : ""}{current.toFixed(2)}
            </span>
          </div>
        );
      })}

      <p
        className="text-[8px] text-sheep-light/55 mt-2"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Last {moods.length} cycles
      </p>
    </div>
  );
}
