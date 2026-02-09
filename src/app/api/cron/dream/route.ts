import { NextRequest, NextResponse } from "next/server";
import { runDreamCycle } from "@/lib/dream-engine";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret — always require it (fail closed)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate required env vars
  if (!process.env.OPENROUTER_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const result = await runDreamCycle();

    return NextResponse.json({
      success: true,
      cycle: result.cycleIndex,
      dream: result.dreamText,
      reflection: result.reflection,
      hasImage: !!result.imageUrl,
    });
  } catch (error) {
    console.error("Dream cycle failed:", error);
    return NextResponse.json(
      { success: false, error: "Dream cycle failed" },
      { status: 500 }
    );
  }
}
