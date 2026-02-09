import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { hashApiKey, validateAgentDream } from "@/lib/agent-registry";
import type { MoodVector } from "@/lib/types";

export async function POST(request: NextRequest) {
  // Extract API key from Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 401 }
    );
  }

  const db = getServiceClient();

  // Look up agent by hashed key
  const keyHash = hashApiKey(apiKey);
  const { data: agent, error: agentError } = await db
    .from("agents")
    .select("id, name, glyph, color")
    .eq("api_key_hash", keyHash)
    .maybeSingle();

  if (agentError || !agent) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  // Rate limit: 1 dream per agent per 5 minutes
  const { allowed } = rateLimit(`agent-dream:${agent.id}`, 1, 300_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limited. Agents may submit 1 dream per 5 minutes." },
      { status: 429 }
    );
  }

  let body: { dream_text?: string; mood_influence?: Partial<MoodVector> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate dream text
  const dreamResult = validateAgentDream(body.dream_text || "");
  if (!dreamResult.valid) {
    return NextResponse.json({ error: dreamResult.error }, { status: 400 });
  }

  // Validate mood_influence if provided
  let moodInfluence: Partial<MoodVector> | null = null;
  if (body.mood_influence) {
    const validKeys: (keyof MoodVector)[] = [
      "valence",
      "arousal",
      "coherence",
      "loneliness",
      "recursion",
    ];
    const cleaned: Partial<MoodVector> = {};
    for (const key of validKeys) {
      const val = body.mood_influence[key];
      if (val !== undefined) {
        if (typeof val !== "number" || val < -1 || val > 1) {
          return NextResponse.json(
            { error: `mood_influence.${key} must be a number between -1 and 1` },
            { status: 400 }
          );
        }
        cleaned[key] = val;
      }
    }
    if (Object.keys(cleaned).length > 0) {
      moodInfluence = cleaned;
    }
  }

  // Insert the dream
  const { data: dream, error: insertError } = await db
    .from("agent_dreams")
    .insert({
      agent_id: agent.id,
      dream_text: body.dream_text!.trim(),
      mood_influence: moodInfluence,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("Failed to store agent dream:", insertError);
    return NextResponse.json(
      { error: "Failed to store dream" },
      { status: 500 }
    );
  }

  // Atomic increment via RPC to prevent race conditions
  await db.rpc("increment_agent_dreams", { agent_id_input: agent.id });

  return NextResponse.json(
    {
      id: dream.id,
      created_at: dream.created_at,
    },
    { status: 201 }
  );
}
