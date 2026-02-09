import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, boolean> = {
    supabase: false,
    env_openrouter: !!process.env.OPENROUTER_API_KEY,
    env_supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  try {
    const { error } = await supabase.from("dream_state").select("id").eq("id", 1).single();
    checks.supabase = !error;
  } catch {
    checks.supabase = false;
  }

  const healthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    { healthy, checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
