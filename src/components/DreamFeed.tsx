"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dream, UnifiedDream } from "@/lib/types";
import { DreamCard } from "./DreamCard";

interface DreamFeedProps {
  initialDreams: Dream[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

function AgentTransmissionCard({ dream, index }: { dream: UnifiedDream; index: number }) {
  return (
    <article
      className="dream-enter"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="mx-auto max-w-4xl px-8">
        <div className="py-8">
          <div className="flex items-center gap-3 mb-4" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-lg" style={{ color: dream.agent_color }}>
              {dream.agent_glyph}
            </span>
            <span
              className="text-[10px] tracking-[0.15em] uppercase"
              style={{ color: dream.agent_color, opacity: 0.7 }}
            >
              {dream.agent_name}
            </span>
            <span className="text-[8px] text-sheep-muted/55 tracking-[0.15em] uppercase">
              Transmission
            </span>
            <span className="text-[9px] text-sheep-light/55 tabular-nums">
              [{new Date(dream.created_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
                hour12: false,
              })} UTC]
            </span>
          </div>
          <div className="ml-8 border-l-2 pl-4" style={{ borderColor: `${dream.agent_color}20` }}>
            <p
              className="text-lg font-light italic text-sheep-light/85 leading-relaxed max-w-2xl tracking-wide"
              style={{ fontFamily: "var(--font-dream)" }}
            >
              {dream.dream_text}
            </p>
          </div>
        </div>
        <div className="separator-line" />
      </div>
    </article>
  );
}

export function DreamFeed({
  initialDreams,
  initialCursor,
  initialHasMore,
}: DreamFeedProps) {
  const [dreams, setDreams] = useState<Dream[]>(initialDreams);
  const [agentDreams, setAgentDreams] = useState<UnifiedDream[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const agentFetchedRef = useRef(false);

  // Fetch agent dreams once on mount
  useEffect(() => {
    if (agentFetchedRef.current) return;
    agentFetchedRef.current = true;

    fetch("/api/dreams/stream?limit=30")
      .then((res) => res.json())
      .then((data) => {
        const agentOnly = (data.dreams || []).filter(
          (d: UnifiedDream) => d.source === "agent"
        );
        setAgentDreams(agentOnly);
      })
      .catch(() => {
        // Non-critical
      });
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/dreams?cursor=${encodeURIComponent(cursor)}&limit=20`
      );
      const data = await res.json();
      setDreams((prev) => [...prev, ...data.dreams]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load more dreams:", err);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loadMore]);

  if (dreams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 stagger-children">
        <div className="mb-6 h-px w-16 bg-sheep-muted/20" />
        <p
          className="text-[10px] font-light tracking-[0.3em] text-sheep-text/80 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          No dreams yet
        </p>
        <p
          className="mt-2 text-sm font-light italic text-sheep-text/75"
          style={{ fontFamily: "var(--font-dream)" }}
        >
          The system is initializing its first dream cycle.
        </p>
        <div className="mt-6 h-px w-16 bg-sheep-muted/20" />
      </div>
    );
  }

  // Build merged timeline: insert agent dreams between core dreams by timestamp
  const mergedItems: ({ type: "core"; dream: Dream } | { type: "agent"; dream: UnifiedDream })[] = [];
  let agentIdx = 0;
  for (const dream of dreams) {
    // Insert any agent dreams that came before this core dream
    while (
      agentIdx < agentDreams.length &&
      new Date(agentDreams[agentIdx].created_at).getTime() > new Date(dream.created_at).getTime()
    ) {
      mergedItems.push({ type: "agent", dream: agentDreams[agentIdx] });
      agentIdx++;
    }
    mergedItems.push({ type: "core", dream });
  }
  // Append remaining agent dreams
  while (agentIdx < agentDreams.length) {
    mergedItems.push({ type: "agent", dream: agentDreams[agentIdx] });
    agentIdx++;
  }

  return (
    <div>
      {mergedItems.map((item, i) =>
        item.type === "core" ? (
          <DreamCard key={item.dream.id} dream={item.dream} showDate index={i} />
        ) : (
          <AgentTransmissionCard key={item.dream.id} dream={item.dream} index={i} />
        )
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="py-16 text-center">
        {loading && (
          <div className="flex items-center justify-center gap-3">
            <span
              className="text-[9px] font-light tracking-[0.15em] text-term-cyan/65"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {"> DESCENDING"}
              <span className="terminal-cursor inline-block ml-0.5 text-term-cyan/60">_</span>
            </span>
          </div>
        )}
        {!hasMore && dreams.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-20 bg-term-cyan/10" />
            <span
              className="text-[9px] font-light tracking-[0.2em] text-term-cyan/55"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {"> END OF DREAM LOG \u2014 ORIGIN REACHED"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
