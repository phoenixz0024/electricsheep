import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import type { Dream, UnifiedDream } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { allowed } = rateLimit(getRateLimitKey(request), 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  // Fetch core dreams
  let coreQuery = supabase
    .from("dreams")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    coreQuery = coreQuery.lt("created_at", cursor);
  }

  // Fetch agent dreams with agent info
  let agentQuery = supabase
    .from("agent_dreams")
    .select("id, agent_id, dream_text, mood_influence, created_at, agents(name, glyph, color)")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    agentQuery = agentQuery.lt("created_at", cursor);
  }

  const [coreResult, agentResult] = await Promise.all([
    coreQuery,
    agentQuery,
  ]);

  if (coreResult.error) {
    return NextResponse.json(
      { error: coreResult.error.message },
      { status: 500 }
    );
  }

  // Map core dreams to unified format
  const coreDreams: UnifiedDream[] = ((coreResult.data || []) as Dream[]).map(
    (d) => ({
      id: d.id,
      source: "core" as const,
      dream_text: d.dream_text,
      reflection: d.reflection,
      mood_vector: d.mood_vector,
      image_url: d.image_url,
      cycle_index: d.cycle_index,
      created_at: d.created_at,
    })
  );

  // Map agent dreams to unified format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentDreams: UnifiedDream[] = ((agentResult.data || []) as any[]).map(
    (d) => {
      const agent = Array.isArray(d.agents) ? d.agents[0] : d.agents;
      return {
        id: d.id,
        source: "agent" as const,
        dream_text: d.dream_text,
        agent_name: agent?.name,
        agent_glyph: agent?.glyph,
        agent_color: agent?.color,
        created_at: d.created_at,
      };
    }
  );

  // Merge and sort by created_at descending
  const merged = [...coreDreams, ...agentDreams].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Apply limit and cursor
  const items = merged.slice(0, limit);
  const hasMore = merged.length > limit;
  const nextCursor = hasMore ? items[items.length - 1].created_at : null;

  return NextResponse.json(
    { dreams: items, nextCursor, hasMore },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
