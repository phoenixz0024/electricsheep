import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { allowed } = rateLimit(getRateLimitKey(request), 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("public_agents")
    .select("*")
    .order("last_active", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }

  return NextResponse.json(
    { agents: data || [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
