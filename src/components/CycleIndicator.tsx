"use client";

import { useEffect, useState } from "react";
import { TerminalFrame } from "./TerminalFrame";

export function CycleIndicator() {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    function calculate() {
      const now = new Date();
      setMinutesLeft(59 - now.getUTCMinutes());
      setSecondsLeft(59 - now.getUTCSeconds());
    }
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  if (minutesLeft === null) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <TerminalFrame title="NEXT CYCLE" variant="system">
      <div className="flex items-center gap-3 px-1">
        {/* Pulsing orb - now terminal green */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-3 w-3 rounded-full bg-term-green/20 pulse-indicator" />
          <div className="h-1.5 w-1.5 rounded-full bg-term-green/60" />
        </div>

        <span
          className="text-[12px] font-light tracking-[0.15em] text-term-green/80 tabular-nums terminal-glow-green"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          T-{pad(minutesLeft)}:{pad(secondsLeft)}
        </span>
      </div>
    </TerminalFrame>
  );
}
