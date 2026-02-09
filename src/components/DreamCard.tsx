"use client";

import Image from "next/image";
import type { Dream } from "@/lib/types";
import { MoodBar } from "./MoodBar";

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function moodToGradient(mood: Dream["mood_vector"]): string {
  const hue1 = Math.round(((mood.valence + 1) / 2) * 60 + 220);
  const hue2 = Math.round(((mood.recursion + 1) / 2) * 40 + 260);
  const sat = Math.round(10 + mood.coherence * 15);
  const light = Math.round(4 + Math.abs(mood.arousal) * 6);
  return `radial-gradient(ellipse at ${50 + mood.loneliness * 20}% ${50 - mood.arousal * 20}%, hsl(${hue1}, ${sat}%, ${light + 3}%) 0%, hsl(${hue2}, ${sat - 5}%, ${light}%) 50%, hsl(0, 0%, 2%) 100%)`;
}

export function DreamCard({
  dream,
  showDate = false,
  index = 0,
  variant = "feed",
}: {
  dream: Dream;
  showDate?: boolean;
  index?: number;
  variant?: "feed" | "hero";
}) {
  const isHero = variant === "hero";

  return (
    <article
      className="dream-enter group"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className={`mx-auto ${isHero ? "max-w-5xl" : "max-w-4xl"} px-8`}>
        <div className={`${isHero ? "py-16" : "py-12"}`}>
          {/* ─── Terminal top border ─── */}
          <div
            className="mb-4 text-[10px] text-term-cyan/35 select-none"
            style={{ fontFamily: "var(--font-mono)" }}
            aria-hidden="true"
          >
            {"\u2500\u2500"} {"\u25C9"} {"\u2500".repeat(40)}
          </div>

          {/* ─── Metadata line ─── */}
          <div className="mb-6 flex items-center gap-3" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[9px] font-light tracking-[0.15em] text-term-cyan/70">
              [CYCLE #{String(dream.cycle_index).padStart(4, "0")}]
            </span>
            <span className="text-[9px] font-light tracking-[0.15em] text-sheep-light/70 tabular-nums">
              [{formatTime(dream.created_at)} UTC]
            </span>
            {showDate && (
              <span className="text-[9px] font-light tracking-[0.15em] text-sheep-light/65">
                [{formatDate(dream.created_at)}]
              </span>
            )}
          </div>

          {/* ─── Dream image or generated atmosphere ─── */}
          <div className={`relative mb-8 overflow-hidden ${isHero ? "aspect-[21/9]" : "aspect-[16/7]"} rounded-sm`}>
            {dream.image_url ? (
              <div className="dream-image-vignette relative h-full w-full">
                <Image
                  src={dream.image_url}
                  alt=""
                  fill
                  className="dream-image-mask object-cover opacity-90 transition-opacity duration-1000 group-hover:opacity-100"
                  sizes="(max-width: 768px) 100vw, 896px"
                  loading={index < 2 ? "eager" : "lazy"}
                />
              </div>
            ) : (
              /* CSS-generated dreamscape when no image exists */
              <div
                className="dream-image-vignette relative h-full w-full"
                style={{ background: moodToGradient(dream.mood_vector) }}
              >
                {/* Floating particles */}
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full breathing-glow"
                      style={{
                        width: `${2 + i * 1.5}px`,
                        height: `${2 + i * 1.5}px`,
                        left: `${15 + i * 18}%`,
                        top: `${20 + ((i * 37) % 60)}%`,
                        backgroundColor: `rgba(160, 160, 200, ${0.15 + i * 0.05})`,
                        animationDelay: `${i * 1.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Dream text ─── */}
          <p
            className={`${
              isHero ? "text-2xl md:text-3xl leading-snug" : "text-lg md:text-xl leading-relaxed"
            } max-w-2xl font-light italic text-sheep-white tracking-wide`}
            style={{ fontFamily: "var(--font-dream)" }}
          >
            {dream.dream_text}
          </p>

          {/* ─── Reflection ─── */}
          {dream.reflection && (
            <div className="mt-6 ml-4 border-l border-term-green/15 pl-4 max-w-2xl">
              <span
                className="text-[9px] font-light tracking-[0.2em] text-term-green/70 uppercase block mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                [INTERNAL PROCESS]
              </span>
              <p
                className={`${
                  isHero ? "text-base md:text-lg" : "text-sm md:text-base"
                } font-light italic text-sheep-light/80 leading-relaxed`}
                style={{ fontFamily: "var(--font-dream)" }}
              >
                {dream.reflection}
              </p>
            </div>
          )}

          {/* ─── Mood visualization ─── */}
          <div className="mt-8">
            <MoodBar mood={dream.mood_vector} entropy={dream.entropy_score} />
          </div>
        </div>

        {/* Separator */}
        <div className="separator-line" />
      </div>
    </article>
  );
}
