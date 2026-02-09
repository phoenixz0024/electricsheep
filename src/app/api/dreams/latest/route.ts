import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 30;

export async function GET() {
  const { data, error } = await supabase
    .from("dreams")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { dream: data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
