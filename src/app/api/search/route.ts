import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import type { Dream } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const key = getRateLimitKey(request);
  const { allowed } = rateLimit(key, 30, 60_000);

  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ dreams: [], query: query || "" });
  }

  // Cap at 100 chars to prevent abuse
  const safeQuery = query.slice(0, 100);

  try {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .or(`dream_text.ilike.%${safeQuery}%,reflection.ilike.%${safeQuery}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      dreams: (data || []) as Dream[],
      query: safeQuery,
      count: data?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
