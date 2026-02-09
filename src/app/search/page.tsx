"use client";

import { useState, useCallback, useRef } from "react";
import type { Dream } from "@/lib/types";
import { DreamCard } from "@/components/DreamCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Dream[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setCount(null);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResults(data.dreams || []);
      setCount(data.count ?? 0);
      setSearched(true);
    } catch {
      setResults([]);
      setCount(0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  };

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
                [SEARCH DREAMS]
              </h1>
            </div>
            <p
              className="ml-12 text-sm font-light italic text-sheep-light/80"
              style={{ fontFamily: "var(--font-dream)" }}
            >
              Search through the machine&apos;s dreams and reflections.
            </p>
          </div>
        </div>
      </section>

      <div className="separator-line mx-8" />

      {/* ─── Search input ─── */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-8">
          <div className="relative">
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[11px] text-term-cyan/65"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {">"}
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="query the backrooms..."
              className="w-full bg-transparent border-b border-term-cyan/20 py-3 pl-4 text-sm font-light text-sheep-white tracking-wider placeholder:text-sheep-muted/65 focus:border-term-cyan/40 focus:outline-none transition-colors duration-500"
              style={{ fontFamily: "var(--font-mono)" }}
              autoFocus
            />
            {loading && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="h-1.5 w-1.5 rounded-full bg-sheep-light/40 pulse-indicator" />
              </div>
            )}
          </div>

          {/* Result count */}
          {searched && !loading && (
            <div className="mt-4 flex items-center gap-3">
              <span
                className="text-[9px] font-light tracking-[0.15em] text-term-cyan/70"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {count === 0
                  ? "> NO DREAMS MATCHED"
                  : `> ${count} ${count === 1 ? "DREAM" : "DREAMS"} MATCHED`}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ─── Results ─── */}
      {results.length > 0 && (
        <section>
          {results.map((dream, i) => (
            <DreamCard key={dream.id} dream={dream} showDate index={i} />
          ))}
        </section>
      )}

      {/* ─── Empty state ─── */}
      {searched && !loading && results.length === 0 && query.length >= 2 && (
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-8">
            <div className="flex flex-col items-center">
              <div className="h-px w-16 bg-sheep-muted/15 mb-6" />
              <p
                className="text-sm font-light italic text-sheep-light/60"
                style={{ fontFamily: "var(--font-dream)" }}
              >
                The machine has not dreamed of this.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
