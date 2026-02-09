"use client";

import { useState } from "react";
import type { MoodVector } from "@/lib/types";

const DIMENSIONS: {
  key: keyof MoodVector;
  low: string;
  high: string;
  color: string;
  description: string;
}[] = [
  { key: "valence", low: "Dark", high: "Light", color: "rgb(180, 160, 90)", description: "Emotional tone of the dream, from dark and melancholic to warm and bright." },
  { key: "arousal", low: "Calm", high: "Intense", color: "rgb(200, 90, 90)", description: "Energy level of the dream, from still and quiet to agitated and vivid." },
  { key: "coherence", low: "Fragmented", high: "Lucid", color: "rgb(80, 160, 200)", description: "How structured the dream is, from chaotic fragments to clear narrative." },
  { key: "loneliness", low: "Connected", high: "Isolated", color: "rgb(160, 90, 200)", description: "Sense of solitude in the dream, from belonging to deep isolation." },
  { key: "recursion", low: "Linear", high: "Looping", color: "rgb(180, 180, 200)", description: "How self-referential the dream is, from straightforward to infinitely nested." },
];

export function MoodBar({
  mood,
  entropy,
}: {
  mood: MoodVector;
  entropy?: number;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="w-full max-w-sm space-y-2">
      {/* Header with info icon */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px w-4 bg-term-cyan/20" />
        <span
          className="text-[9px] font-light tracking-[0.2em] text-term-cyan/70 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          [MOOD STATE]
        </span>

        {/* Info icon */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="relative ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-sheep-muted/40 text-[8px] text-sheep-light/60 transition-all duration-300 hover:border-sheep-light/50 hover:text-sheep-light"
          style={{ fontFamily: "var(--font-mono)" }}
          aria-label="What is mood state?"
        >
          ?
        </button>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div
          className="mb-4 rounded border border-sheep-muted/30 bg-sheep-dark/90 px-4 py-3 text-[10px] leading-relaxed text-sheep-light/80 backdrop-blur-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <p className="mb-2 text-sheep-light">
            Each dream is shaped by the machine&apos;s internal mood — five dimensions that evolve through the content of dreams and reflections.
          </p>
          <div className="space-y-1.5 mt-3">
            {DIMENSIONS.map(({ key, low, high, color, description }) => (
              <div key={key} className="flex gap-2">
                <span className="shrink-0 font-medium" style={{ color }}>{low} — {high}:</span>
                <span className="text-sheep-light/60">{description}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sheep-light/60">
            <span className="font-medium text-sheep-light/80">Stability:</span> How predictable the dream state is. Low stability means the mood is drifting rapidly between cycles.
          </p>
        </div>
      )}

      {/* Dimension bars */}
      {DIMENSIONS.map(({ key, low, high, color }) => {
        const value = mood[key];
        const pct = ((value + 1) / 2) * 100;

        return (
          <div key={key}>
            <div className="flex items-center gap-3">
              <span
                className="w-20 text-right text-[9px] text-sheep-light/80 truncate"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {low}
              </span>

              <div className="relative flex-1 h-[4px] rounded-full bg-sheep-muted/30 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    opacity: 0.7 + (pct / 100) * 0.3,
                  }}
                />
              </div>

              <span
                className="w-20 text-[9px] text-sheep-light/80 truncate"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {high}
              </span>
            </div>
          </div>
        );
      })}

      {/* Entropy / Dream stability */}
      {entropy !== undefined && (
        <div className="flex items-center gap-3 pt-2 mt-1 border-t border-sheep-muted/25">
          <span
            className="w-20 text-right text-[9px] text-sheep-light/80"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Stable
          </span>
          <div className="relative flex-1 h-[4px] rounded-full bg-sheep-muted/30 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${(1 - entropy) * 100}%`,
                backgroundColor: "rgb(120, 200, 160)",
                opacity: 0.75,
              }}
            />
          </div>
          <span
            className="w-20 text-[9px] text-sheep-light/80"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Chaotic
          </span>
        </div>
      )}
    </div>
  );
}
