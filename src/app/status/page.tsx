import { supabase } from "@/lib/supabase";
import { MoodBar } from "@/components/MoodBar";
import { MoodSparkline } from "@/components/MoodSparkline";
import { TerminalFrame } from "@/components/TerminalFrame";
import { AgentNetwork } from "@/components/AgentNetwork";
import { moodToDescription, calculateEntropy } from "@/lib/mood";
import type { DreamState, Dream, MoodVector } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Status | Electric Sheep",
  description: "The machine's inner state.",
};

async function getState(): Promise<DreamState | null> {
  try {
    const { data, error } = await supabase
      .from("dream_state")
      .select("*")
      .eq("id", 1)
      .single();

    if (!error && data) return data as DreamState;
  } catch {
    // Supabase unavailable
  }
  return null;
}

async function getRecentMoods(): Promise<{ moods: MoodVector[]; dreams: Dream[] }> {
  try {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(48);

    if (!error && data) {
      const dreams = data as Dream[];
      const moods = dreams
        .slice()
        .reverse()
        .map((d) => d.mood_vector);
      return { moods, dreams };
    }
  } catch {
    // Supabase unavailable
  }
  return { moods: [], dreams: [] };
}

function driftToDescription(drift: number): string {
  if (drift < 0.03) return "Deep stillness";
  if (drift < 0.08) return "Barely shifting";
  if (drift < 0.15) return "Gentle drift";
  if (drift < 0.25) return "Restless";
  if (drift < 0.4) return "Turbulent";
  return "In crisis";
}

function driftToWidth(drift: number): number {
  return Math.min(100, Math.round(drift * 250));
}

export default async function StatusPage() {
  const [state, { moods, dreams }] = await Promise.all([
    getState(),
    getRecentMoods(),
  ]);

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p
          className="text-[10px] font-light tracking-[0.3em] text-sheep-light/80 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          No state recorded yet. The machine has not dreamed.
        </p>
      </div>
    );
  }

  const themes = state.dominant_theme
    ? state.dominant_theme.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const moodDesc = moodToDescription(state.last_mood_vector);
  const entropy = calculateEntropy(state.last_mood_vector);
  const latestDream = dreams[0] || null;

  return (
    <div className="min-h-screen">
      {/* ─── Header ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-8">
          <div className="stagger-children">
            <div className="mb-3 flex items-center gap-4">
              <div className="h-px w-8 bg-term-cyan/15" />
              <h1
                className="text-[9px] font-light tracking-[0.5em] text-term-cyan/60 uppercase terminal-glow"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                [MACHINE STATE]
              </h1>
            </div>
            <p
              className="ml-12 text-sm font-light italic text-sheep-light/80"
              style={{ fontFamily: "var(--font-dream)" }}
            >
              The inner life of the dreaming machine, exposed.
            </p>
          </div>
        </div>
      </section>

      <div className="separator-line mx-8" />

      {/* ─── Current Mood ─── */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-8">
          <TerminalFrame title="CURRENT STATE">
            <div className="stagger-children">
              {/* Mood description */}
              <div className="mb-8">
                <p
                  className="text-xl md:text-2xl font-light italic text-sheep-white tracking-wide"
                  style={{ fontFamily: "var(--font-dream)" }}
                >
                  {moodDesc || "Undefined, searching"}
                </p>
                <span
                  className="text-[9px] text-sheep-light/70 mt-2 block"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  After {state.total_cycles} {state.total_cycles === 1 ? "cycle" : "cycles"}
                </span>
              </div>

              {/* Mood bars */}
              <MoodBar mood={state.last_mood_vector} entropy={entropy} />
            </div>
          </TerminalFrame>
        </div>
      </section>

      <div className="separator-line mx-8" />

      {/* ─── Themes ─── */}
      {themes.length > 0 && (
        <>
          <section className="py-12">
            <div className="mx-auto max-w-4xl px-8">
              <TerminalFrame title="RECURRING MOTIFS" variant="system">
                <div className="stagger-children">
                  <div className="space-y-1">
                    {themes.map((theme) => (
                      <div
                        key={theme}
                        className="text-[10px] text-sheep-light/60"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        <span className="text-term-green/65">{"> "}</span>
                        <span className="text-sheep-light/65">motif: </span>
                        <span
                          className="text-base font-light italic text-sheep-light/70 tracking-wider"
                          style={{ fontFamily: "var(--font-dream)" }}
                        >
                          {theme}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p
                    className="text-[8px] text-sheep-light/55 mt-4"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Motifs the machine keeps returning to. These emerge from dream content and shift over time.
                  </p>
                </div>
              </TerminalFrame>
            </div>
          </section>

          <div className="separator-line mx-8" />
        </>
      )}

      {/* ─── Drift ─── */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-8">
          <TerminalFrame title="EMOTIONAL DRIFT" variant="warning">
            <div className="stagger-children">
              <div className="flex items-center gap-2 mb-2 text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                <span className="text-sheep-light/65 w-[6ch]">drift</span>
                <span className="text-sheep-muted/60">[</span>
                <span style={{ color: state.drift_score > 0.25 ? "var(--color-term-red)" : state.drift_score > 0.1 ? "var(--color-term-amber)" : "var(--color-term-green)" }}>
                  {"\u2588".repeat(Math.round(driftToWidth(state.drift_score) / 10))}
                  {"\u2591".repeat(10 - Math.round(driftToWidth(state.drift_score) / 10))}
                </span>
                <span className="text-sheep-muted/60">]</span>
                <span className="text-sheep-light/70 tabular-nums">{state.drift_score.toFixed(3)}</span>
                <span className="text-sheep-light/55">{"\u2014"} {driftToDescription(state.drift_score)}</span>
              </div>
              <p
                className="text-[8px] text-sheep-light/55 mt-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                How much the mood shifted in the last cycle. High drift means the machine&apos;s emotional state is volatile.
              </p>
            </div>
          </TerminalFrame>
        </div>
      </section>

      <div className="separator-line mx-8" />

      {/* ─── Mood Evolution ─── */}
      {moods.length >= 2 && (
        <>
          <section className="py-12">
            <div className="mx-auto max-w-4xl px-8">
              <MoodSparkline moods={moods} />
            </div>
          </section>

          <div className="separator-line mx-8" />
        </>
      )}

      {/* ─── Agent Network ─── */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-8">
          <AgentNetwork />
        </div>
      </section>

      <div className="separator-line mx-8" />

      {/* ─── Latest dream reference ─── */}
      {latestDream && (
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-8">
            <div className="stagger-children">
              <span
                className="text-[9px] font-light tracking-[0.2em] text-term-cyan/70 uppercase block mb-4"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                [LAST DREAM {"\u2014"} CYCLE #{String(latestDream.cycle_index).padStart(4, "0")}]
              </span>
              <p
                className="text-base font-light italic text-sheep-light/70 leading-relaxed max-w-2xl"
                style={{ fontFamily: "var(--font-dream)" }}
              >
                {latestDream.dream_text}
              </p>
              {latestDream.reflection && (
                <div className="mt-4 ml-4 border-l border-term-green/15 pl-4 max-w-2xl">
                  <span
                    className="text-[9px] font-light tracking-[0.2em] text-term-green/70 uppercase block mb-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    [INTERNAL PROCESS]
                  </span>
                  <p
                    className="text-sm font-light italic text-sheep-light/70 leading-relaxed"
                    style={{ fontFamily: "var(--font-dream)" }}
                  >
                    {latestDream.reflection}
                  </p>
                </div>
              )}
              <Link
                href="/"
                className="glow-hover group inline-flex items-center gap-3 mt-6 transition-all duration-500"
              >
                <span
                  className="text-[9px] font-light tracking-[0.2em] text-sheep-light/60 uppercase transition-colors duration-500 group-hover:text-sheep-white"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  View all dreams
                </span>
                <div className="h-px w-4 bg-sheep-muted/20 transition-all duration-500 group-hover:w-8 group-hover:bg-sheep-muted/40" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
