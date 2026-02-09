import type { MoodVector } from "@/lib/types";

const DIMENSIONS: {
  key: keyof MoodVector;
  label: string;
  color: string;
  colorClass: string;
}[] = [
  { key: "valence", label: "valence", color: "var(--color-term-cyan)", colorClass: "text-term-cyan" },
  { key: "arousal", label: "arousal", color: "var(--color-term-red)", colorClass: "text-term-red" },
  { key: "coherence", label: "coherence", color: "var(--color-term-green)", colorClass: "text-term-green" },
  { key: "loneliness", label: "loneliness", color: "var(--color-term-magenta)", colorClass: "text-term-magenta" },
  { key: "recursion", label: "recursion", color: "var(--color-term-amber)", colorClass: "text-term-amber" },
];

const BAR_WIDTH = 10;

function buildBar(value: number): string {
  // value is -1 to 1, map to 0-BAR_WIDTH
  const filled = Math.round(((value + 1) / 2) * BAR_WIDTH);
  const full = "\u2588";
  const empty = "\u2591";
  return full.repeat(filled) + empty.repeat(BAR_WIDTH - filled);
}

interface TerminalMoodGaugeProps {
  mood: MoodVector;
  className?: string;
}

export function TerminalMoodGauge({ mood, className = "" }: TerminalMoodGaugeProps) {
  return (
    <div
      className={`space-y-0.5 ${className}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {DIMENSIONS.map(({ key, label, color, colorClass }) => {
        const value = mood[key];
        const bar = buildBar(value);
        const sign = value >= 0 ? "+" : "";

        return (
          <div key={key} className="flex items-center gap-2 text-[10px] leading-relaxed">
            <span className="w-[9ch] text-right text-sheep-light/70 shrink-0">
              {label}
            </span>
            <span className="text-sheep-muted/80">[</span>
            <span style={{ color }} className="tracking-[0.05em]">
              {bar}
            </span>
            <span className="text-sheep-muted/80">]</span>
            <span className={`w-[5ch] tabular-nums ${colorClass}/70`}>
              {sign}{value.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
