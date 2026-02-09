"use client";

import { GlitchText } from "./GlitchText";

export function HeroGlitch({ tagline }: { tagline: string }) {
  return (
    <div className="mb-10">
      <GlitchText
        text={tagline}
        font="dream"
        speed={40}
        glitchIntensity={0.05}
        as="p"
        className="text-base font-light italic text-sheep-light tracking-wide md:text-lg"
      />
    </div>
  );
}
