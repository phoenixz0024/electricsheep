import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Archive | Electric Sheep",
  description: "Dream log archive.",
};

interface DayEntry {
  day_index: string;
  count: number;
}

async function getDreamDays(): Promise<DayEntry[]> {
  try {
    const { data, error } = await supabase
      .from("dreams")
      .select("day_index")
      .order("day_index", { ascending: false });

    if (!error && data) {
      const dayMap = new Map<string, number>();
      for (const row of data) {
        const day = row.day_index;
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }
      return Array.from(dayMap.entries()).map(([day_index, count]) => ({
        day_index,
        count,
      }));
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

function formatDayShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

export default async function ArchivePage() {
  const days = await getDreamDays();

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
                [DREAM ARCHIVE]
              </h1>
            </div>
            <p
              className="ml-12 text-sm font-light italic text-sheep-light/80"
              style={{ fontFamily: "var(--font-dream)" }}
            >
              {days.length} {days.length === 1 ? "day" : "days"} recorded
            </p>
          </div>
        </div>
      </section>

      <div className="separator-line mx-8" />

      {/* ─── Day list ─── */}
      <section className="py-4">
        <div className="mx-auto max-w-4xl px-8">
          {days.length === 0 ? (
            <div className="flex flex-col items-center py-32">
              <p
                className="text-[10px] font-light tracking-[0.3em] text-sheep-light/80 uppercase"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                No dreams recorded yet.
              </p>
            </div>
          ) : (
            <div className="stagger-children">
              {days.map((day) => (
                <Link
                  key={day.day_index}
                  href={`/dreams/${day.day_index}`}
                  className="archive-row group flex items-center py-6 transition-all duration-500"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {/* Day of week */}
                  <span className="w-12 text-[9px] font-light tracking-[0.1em] text-sheep-light/70 uppercase transition-colors duration-500 group-hover:text-term-cyan/70">
                    {getDayOfWeek(day.day_index)}
                  </span>

                  <span className="text-[10px] text-sheep-muted/50 mx-2">{"\u2502"}</span>

                  {/* Date */}
                  <span className="w-16 text-[10px] font-light tracking-wider text-sheep-light transition-colors duration-500 group-hover:text-sheep-white">
                    {formatDayShort(day.day_index)}
                  </span>

                  <span className="text-[10px] text-sheep-muted/50 mx-2 hidden md:inline">{"\u2502"}</span>

                  {/* Full date */}
                  <span className="hidden flex-1 text-[10px] font-light tracking-wider text-sheep-light/70 transition-colors duration-500 group-hover:text-sheep-light md:block">
                    {formatDay(day.day_index)}
                  </span>

                  {/* Dream count visualization */}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex gap-[2px]">
                      {Array.from({ length: Math.min(day.count, 24) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="h-2 w-[2px] rounded-full bg-term-cyan/10 transition-colors duration-500 group-hover:bg-term-cyan/30"
                            style={{
                              height: `${6 + ((i * 7 + 3) % 9)}px`,
                            }}
                          />
                        )
                      )}
                    </div>
                    <span className="min-w-[2rem] text-right text-[8px] font-light text-sheep-light/80 tabular-nums transition-colors duration-500 group-hover:text-term-cyan/70">
                      {day.count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
