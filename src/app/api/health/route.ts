import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;

  try {
    const { error } = await supabase.from("dream_state").select("id").eq("id", 1).single();
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const healthy = dbOk;

  return NextResponse.json(
    { healthy, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
