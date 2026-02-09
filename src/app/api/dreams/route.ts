import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import type { Dream } from "@/lib/types";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { allowed } = rateLimit(getRateLimitKey(request), 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  let query = supabase
    .from("dreams")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dreams = (data || []) as Dream[];
  const hasMore = dreams.length > limit;
  const items = hasMore ? dreams.slice(0, limit) : dreams;
  const nextCursor = hasMore ? items[items.length - 1].created_at : null;

  return NextResponse.json(
    { dreams: items, nextCursor, hasMore },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
