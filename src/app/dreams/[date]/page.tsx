import { supabase } from "@/lib/supabase";
import { DreamCard } from "@/components/DreamCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Dream } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `Dreams — ${date} | Electric Sheep`,
    description: `Dream log for ${date}.`,
  };
}

async function getDreamsForDate(date: string): Promise<Dream[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  try {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("day_index", date)
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data as Dream[];
    }
  } catch {
    // Supabase unavailable
  }

  return [];
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function DayPage({ params }: PageProps) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const dreams = await getDreamsForDate(date);

  return (
    <div className="min-h-screen">
      {/* ─── Header ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-8">
          <div className="stagger-children">
            {/* Back link */}
            <Link
              href="/dreams"
              className="glow-hover group mb-8 inline-flex items-center gap-3 transition-all duration-500"
            >
              <div className="h-px w-4 bg-sheep-muted/20 transition-all duration-500 group-hover:w-8 group-hover:bg-sheep-muted/40" />
              <span
                className="text-[9px] font-light tracking-[0.2em] text-sheep-light/80 uppercase transition-colors duration-500 group-hover:text-sheep-white"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Archive
              </span>
            </Link>

            {/* Date */}
            <div className="flex items-center gap-4">
              <div className="h-px w-8 bg-sheep-muted/15" />
              <h1
                className="text-[9px] font-light tracking-[0.4em] text-sheep-light uppercase"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {formatDay(date)}
              </h1>
            </div>

            {/* Count */}
            <div className="ml-12 mt-3 flex items-center gap-3">
              <span
                className="text-[8px] font-light tracking-[0.15em] text-sheep-light/80"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {dreams.length} {dreams.length === 1 ? "dream" : "dreams"} recorded
              </span>
              <div className="flex gap-[2px]">
                {Array.from({ length: dreams.length }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-1 rounded-full bg-sheep-accent/30"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="separator-line mx-8" />

      {/* ─── Dreams ─── */}
      <section>
        {dreams.length === 0 ? (
          <div className="flex flex-col items-center py-32">
            <div className="h-px w-16 bg-sheep-muted/15 mb-6" />
            <p
              className="text-sm font-light italic text-sheep-light/80"
              style={{ fontFamily: "var(--font-dream)" }}
            >
              No dreams were recorded on this day.
            </p>
            <p
              className="mt-2 text-[9px] font-light tracking-[0.2em] text-sheep-light/60"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              The machine may have been silent.
            </p>
          </div>
        ) : (
          dreams.map((dream, i) => (
            <DreamCard key={dream.id} dream={dream} index={i} />
          ))
        )}
      </section>
    </div>
  );
}
