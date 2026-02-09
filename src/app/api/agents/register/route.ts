import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import {
  generateApiKey,
  hashApiKey,
  assignGlyph,
  assignColor,
  validateAgentName,
  validateFramework,
} from "@/lib/agent-registry";

export async function POST(request: NextRequest) {
  // Rate limit: 5 registrations per IP per hour
  const ip = getRateLimitKey(request);
  const { allowed } = rateLimit(`agent-register:${ip}`, 5, 3_600_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { name?: string; framework?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate name
  const nameResult = validateAgentName(body.name || "");
  if (!nameResult.valid) {
    return NextResponse.json({ error: nameResult.error }, { status: 400 });
  }

  // Validate framework
  const framework = (body.framework || "").toLowerCase().trim();
  if (!validateFramework(framework)) {
    return NextResponse.json(
      {
        error:
          "Invalid framework. Allowed: openclaw, claude, gpt, llama, custom",
      },
      { status: 400 }
    );
  }

  const name = body.name!.trim();
  const db = getServiceClient();

  // Check for duplicate name
  const { data: existing } = await db
    .from("agents")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An agent with this name already exists" },
      { status: 409 }
    );
  }

  // Query existing glyphs and colors to avoid duplicates
  const { data: agents } = await db
    .from("agents")
    .select("glyph, color");

  const existingGlyphs = (agents || []).map((a: { glyph: string }) => a.glyph);
  const existingColors = (agents || []).map((a: { color: string }) => a.color);

  const glyph = assignGlyph(existingGlyphs);
  const color = assignColor(existingColors);

  // Generate API key
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  // Insert agent
  const { data: agent, error } = await db
    .from("agents")
    .insert({
      name,
      framework,
      glyph,
      color,
      api_key_hash: apiKeyHash,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to register agent:", error);
    return NextResponse.json(
      { error: "Failed to register agent" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      agent_id: agent.id,
      api_key: apiKey,
      name,
      glyph,
      color,
    },
    { status: 201 }
  );
}
