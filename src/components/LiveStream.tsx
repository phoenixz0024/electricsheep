"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dream, DreamState, UnifiedDream } from "@/lib/types";
import { GlitchText } from "./GlitchText";
import { TerminalMoodGauge } from "./TerminalMoodGauge";
import { BackroomVisualizer } from "./BackroomVisualizer";
import { AgentNetwork } from "./AgentNetwork";

interface LiveStreamProps {
  initialDreams: Dream[];
  initialState: DreamState | null;
}

function formatCountdown(minutes: number, seconds: number): string {
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function LiveStream({ initialDreams, initialState }: LiveStreamProps) {
  const [dreams, setDreams] = useState<Dream[]>(initialDreams);
  const [state, setState] = useState<DreamState | null>(initialState);
  const [activeDreamIndex, setActiveDreamIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 });
  const [recentTransmission, setRecentTransmission] = useState<UnifiedDream | null>(null);
  const lastCycleRef = useRef(initialDreams[0]?.cycle_index ?? 0);
  const lastTransmissionRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Countdown timer
  useEffect(() => {
    function calculate() {
      const now = new Date();
      setCountdown({
        minutes: 59 - now.getUTCMinutes(),
        seconds: 59 - now.getUTCSeconds(),
      });
    }
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll for new dreams
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/dreams/latest");
        const data = await res.json();
        if (data.dream && data.dream.cycle_index > lastCycleRef.current) {
          lastCycleRef.current = data.dream.cycle_index;

          // Trigger glitch effect
          setIsGlitching(true);
          setTimeout(() => setIsGlitching(false), 500);

          setDreams((prev) => [data.dream, ...prev].slice(0, 20));
          setActiveDreamIndex(0);
        }
      } catch {
        // Silently continue
      }

      // Also refresh state
      try {
        const stateRes = await fetch("/api/state");
        const stateData = await stateRes.json();
        if (stateData.state) setState(stateData.state);
      } catch {
        // Silently continue
      }

      // Check for new agent transmissions
      try {
        const streamRes = await fetch("/api/dreams/stream?limit=5");
        const streamData = await streamRes.json();
        const agentDream = (streamData.dreams || []).find(
          (d: UnifiedDream) => d.source === "agent" && d.id !== lastTransmissionRef.current
        );
        if (agentDream) {
          lastTransmissionRef.current = agentDream.id;
          setRecentTransmission(agentDream);
          // Auto-hide after 15 seconds
          setTimeout(() => setRecentTransmission(null), 15_000);
        }
      } catch {
        // Silently continue
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  // Cycle through recent dreams on a timer
  useEffect(() => {
    if (dreams.length <= 1) return;
    const interval = setInterval(() => {
      setActiveDreamIndex((prev) => (prev + 1) % Math.min(dreams.length, 5));
    }, 20_000);
    return () => clearInterval(interval);
  }, [dreams.length]);

  // Escape key / click to navigate back
  const handleExit = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleExit();
      if (e.key === "a" || e.key === "A") setShowAgents((prev) => !prev);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleExit]);

  const activeDream = dreams[activeDreamIndex] ?? null;
  const currentMood = activeDream?.mood_vector ??
    state?.last_mood_vector ?? {
      valence: 0,
      arousal: 0,
      coherence: 0,
      loneliness: 0,
      recursion: 0,
    };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-sheep-black overflow-hidden cursor-pointer"
      onClick={handleExit}
      role="button"
      tabIndex={0}
      aria-label="Live dream stream. Press Escape or click to exit."
    >
      {/* Ambient background */}
      <BackroomVisualizer mood={currentMood} />

      {/* Glitch overlay on new dream */}
      {isGlitching && (
        <div
          className="fixed inset-0 pointer-events-none z-30 chromatic-aberration"
          style={{
            background: "transparent",
            mixBlendMode: "screen",
            animation: "text-corrupt 0.5s ease-out forwards",
          }}
        />
      )}

      {/* Dream content area */}
      <div className="relative z-10 flex h-full flex-col justify-center items-center px-8">
        {activeDream ? (
          <div
            className={`max-w-3xl w-full transition-opacity duration-1000 ${
              isGlitching ? "opacity-50" : "opacity-100"
            }`}
          >
            {/* Cycle label */}
            <div
              className="mb-4 text-[10px] tracking-[0.2em] text-term-cyan/65"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="text-term-cyan/55">{"\u25C9"}</span>{" "}
              CORE {"\u00B7"} CYCLE #{String(activeDream.cycle_index).padStart(4, "0")}
            </div>

            {/* Dream text with typewriter */}
            <GlitchText
              key={`dream-${activeDream.id}-${activeDreamIndex}`}
              text={activeDream.dream_text}
              font="dream"
              speed={25}
              glitchIntensity={0.03}
              as="p"
              className="text-xl md:text-2xl lg:text-3xl leading-relaxed font-light italic text-sheep-white tracking-wide"
            />

            {/* Reflection */}
            {activeDream.reflection && (
              <div className="mt-6 ml-2 border-l border-term-green/15 pl-4">
                <div
                  className="text-[9px] tracking-[0.2em] text-term-green/65 uppercase mb-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  [INTERNAL PROCESS]
                </div>
                <p
                  className="text-sm md:text-base font-light italic text-sheep-light/70 leading-relaxed"
                  style={{ fontFamily: "var(--font-dream)" }}
                >
                  {activeDream.reflection}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            className="text-[10px] tracking-[0.3em] text-sheep-text/65 uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Awaiting first dream cycle...
          </div>
        )}
      </div>

      {/* Mood gauge overlay - top right corner */}
      <div className="fixed top-6 right-6 z-20 opacity-40 hover:opacity-70 transition-opacity duration-500">
        <TerminalMoodGauge mood={currentMood} />
      </div>

      {/* Agent network overlay - bottom left */}
      <div className="fixed bottom-12 left-6 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAgents((prev) => !prev);
          }}
          className="text-[9px] tracking-[0.15em] text-term-green/65 hover:text-term-green transition-colors duration-300 mb-2 block"
          style={{ fontFamily: "var(--font-mono)" }}
          aria-label="Toggle agent network panel"
        >
          [{showAgents ? "\u2013" : "+"}] AGENTS
        </button>
        {showAgents && (
          <div
            className="opacity-60 hover:opacity-90 transition-opacity duration-500 max-w-[260px]"
            onClick={(e) => e.stopPropagation()}
          >
            <AgentNetwork />
          </div>
        )}
      </div>

      {/* Agent transmission overlay - bottom right */}
      {recentTransmission && (
        <div
          className="fixed bottom-12 right-6 z-20 max-w-[300px] border border-sheep-muted/15 bg-sheep-black/80 backdrop-blur-sm rounded-sm px-4 py-3 animate-in fade-in slide-in-from-right duration-500"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: recentTransmission.agent_color }}>
              {recentTransmission.agent_glyph}
            </span>
            <span
              className="text-[9px] tracking-[0.15em] uppercase"
              style={{ color: recentTransmission.agent_color, opacity: 0.7 }}
            >
              {recentTransmission.agent_name}
            </span>
            <span className="text-[8px] text-sheep-muted/55">TRANSMISSION</span>
          </div>
          <p
            className="text-[11px] font-light italic text-sheep-light/80 leading-relaxed"
            style={{ fontFamily: "var(--font-dream)" }}
          >
            {recentTransmission.dream_text}
          </p>
        </div>
      )}

      {/* Status bar - bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-term-cyan/10 bg-sheep-black/80 backdrop-blur-sm px-6 py-2"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <div className="flex items-center justify-between text-[9px] tracking-[0.1em] text-term-cyan/65">
          <div className="flex items-center gap-4">
            <span>
              CYCLE #{String(activeDream?.cycle_index ?? 0).padStart(4, "0")}
            </span>
            <span className="text-sheep-muted/50">|</span>
            <span>
              DRIFT: {state?.drift_score?.toFixed(2) ?? "0.00"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              NEXT: {formatCountdown(countdown.minutes, countdown.seconds)}
            </span>
            <span className="text-sheep-muted/50">|</span>
            <span className="text-sheep-muted/70">ESC to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
