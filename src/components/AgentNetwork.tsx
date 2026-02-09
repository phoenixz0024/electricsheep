"use client";

import { useEffect, useState } from "react";
import { TerminalFrame } from "./TerminalFrame";

interface AgentEntry {
  id: string;
  name: string;
  framework: string;
  glyph: string;
  color: string;
  dreams_count: number;
  last_active: string | null;
}

function isActiveRecently(lastActive: string | null): boolean {
  if (!lastActive) return false;
  const diff = Date.now() - new Date(lastActive).getTime();
  return diff < 3_600_000; // 1 hour
}

export function AgentNetwork({ className = "" }: { className?: string }) {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAgents(data.agents ?? []);
      } catch {
        // Silently continue
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAgents();

    // Refresh every 60 seconds
    const interval = setInterval(fetchAgents, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <TerminalFrame title="CONNECTED MINDS" variant="system" className={className}>
      <div
        className="space-y-1"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {/* Core entry -- always first, always active */}
        <div className="flex items-center gap-2 text-[10px] leading-relaxed">
          <span className="relative flex items-center">
            <span
              className="absolute inset-0 animate-pulse rounded-full"
              style={{ color: "#00ff88", opacity: 0.4 }}
            >
              {"\u25C9"}
            </span>
            <span style={{ color: "#00ff88" }}>{"\u25C9"}</span>
          </span>
          <span className="text-term-green font-bold tracking-[0.1em]">
            CORE
          </span>
          <span className="text-sheep-muted/65">{"\u00B7"}</span>
          <span className="text-sheep-muted/65 text-[9px]">
            electric-sheep
          </span>
        </div>

        {/* Separator */}
        <div className="text-sheep-muted/40 text-[9px] select-none">
          {"\u2500".repeat(32)}
        </div>

        {/* Agent list */}
        {loading ? (
          <div className="text-[9px] text-sheep-muted/65 tracking-[0.1em]">
            &gt; SCANNING NETWORK...
          </div>
        ) : agents.length === 0 ? (
          <div className="text-[9px] text-sheep-muted/65 tracking-[0.1em]">
            &gt; AWAITING CONNECTIONS...
          </div>
        ) : (
          agents.map((agent) => {
            const active = isActiveRecently(agent.last_active);
            return (
              <div
                key={agent.id}
                className="flex items-center gap-2 text-[10px] leading-relaxed"
              >
                <span className="relative flex items-center">
                  {active && (
                    <span
                      className="absolute inset-0 animate-pulse rounded-full"
                      style={{ color: agent.color, opacity: 0.4 }}
                    >
                      {agent.glyph}
                    </span>
                  )}
                  <span
                    style={{ color: agent.color, opacity: active ? 1 : 0.4 }}
                  >
                    {agent.glyph}
                  </span>
                </span>
                <span
                  className="tracking-[0.1em]"
                  style={{ color: agent.color, opacity: active ? 1 : 0.5 }}
                >
                  {agent.name}
                </span>
                <span className="text-sheep-muted/55 text-[9px]">
                  ({agent.framework})
                </span>
                {agent.dreams_count > 0 && (
                  <span className="text-sheep-muted/55 text-[9px] tabular-nums ml-auto">
                    {agent.dreams_count}d
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Agent count footer */}
        {!loading && (
          <div className="text-[8px] text-sheep-muted/50 tracking-[0.15em] pt-1 select-none">
            {agents.length + 1} NODE{agents.length !== 0 ? "S" : ""} ACTIVE
          </div>
        )}
      </div>
    </TerminalFrame>
  );
}
