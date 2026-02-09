/*
  SQL for Supabase table creation — run these manually in the Supabase SQL editor:

  -- Agents table
  CREATE TABLE agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    framework TEXT NOT NULL,
    glyph TEXT NOT NULL,
    color TEXT NOT NULL,
    api_key_hash TEXT NOT NULL,
    dreams_count INTEGER NOT NULL DEFAULT 0,
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
  );

  CREATE INDEX idx_agents_api_key_hash ON agents (api_key_hash);
  CREATE INDEX idx_agents_last_active ON agents (last_active DESC);

  -- Agent dreams table
  CREATE TABLE agent_dreams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    dream_text TEXT NOT NULL,
    mood_influence JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
  );

  CREATE INDEX idx_agent_dreams_agent_id ON agent_dreams (agent_id);
  CREATE INDEX idx_agent_dreams_created_at ON agent_dreams (created_at DESC);

  -- RLS policies (enable RLS on both tables)
  ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_dreams ENABLE ROW LEVEL SECURITY;

  -- Public read access for agents (excluding api_key_hash)
  CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);

  -- Public read access for agent dreams
  CREATE POLICY "Public read agent_dreams" ON agent_dreams FOR SELECT USING (true);

  -- Service role can do everything (for API routes using service key)
  CREATE POLICY "Service insert agents" ON agents FOR INSERT WITH CHECK (true);
  CREATE POLICY "Service update agents" ON agents FOR UPDATE USING (true);
  CREATE POLICY "Service insert agent_dreams" ON agent_dreams FOR INSERT WITH CHECK (true);
*/

import { createHash, randomBytes } from "crypto";

export const ALLOWED_FRAMEWORKS = [
  "openclaw",
  "claude",
  "moltbook",
  "gpt",
  "llama",
  "custom",
] as const;

export type AgentFramework = (typeof ALLOWED_FRAMEWORKS)[number];

export const AGENT_GLYPHS = [
  "\u25C8", // ◈
  "\u263E", // ☾
  "\u25B3", // △
  "\u2B21", // ⬡
  "\u25CE", // ◎
  "\u27D0", // ⟐
  "\u229B", // ⊛
  "\u2B22", // ⬢
  "\u25C7", // ◇
  "\u2295", // ⊕
];

export const AGENT_COLORS = [
  "#00ffd5",
  "#ff00ff",
  "#39ff14",
  "#ffb000",
  "#ff6b6b",
  "#a78bfa",
  "#38bdf8",
  "#fb923c",
];

export function generateApiKey(): string {
  return randomBytes(16).toString("hex");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function assignGlyph(existingGlyphs: string[]): string {
  const available = AGENT_GLYPHS.filter((g) => !existingGlyphs.includes(g));
  if (available.length > 0) return available[0];
  // If all glyphs are taken, cycle back around
  return AGENT_GLYPHS[existingGlyphs.length % AGENT_GLYPHS.length];
}

export function assignColor(existingColors: string[]): string {
  const available = AGENT_COLORS.filter((c) => !existingColors.includes(c));
  if (available.length > 0) return available[0];
  return AGENT_COLORS[existingColors.length % AGENT_COLORS.length];
}

export function validateAgentDream(text: string): {
  valid: boolean;
  error?: string;
} {
  if (!text || typeof text !== "string") {
    return { valid: false, error: "Dream text is required" };
  }

  const trimmed = text.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: "Dream text cannot be empty" };
  }

  if (trimmed.length > 500) {
    return {
      valid: false,
      error: "Dream text must be 500 characters or fewer",
    };
  }

  // Basic spam detection: reject if entirely repeated characters or whitespace
  if (/^(.)\1+$/.test(trimmed)) {
    return { valid: false, error: "Dream text appears to be spam" };
  }

  return { valid: true };
}

export function validateAgentName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Agent name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: "Agent name must be at least 3 characters" };
  }

  if (trimmed.length > 30) {
    return {
      valid: false,
      error: "Agent name must be 30 characters or fewer",
    };
  }

  // Only allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Agent name can only contain letters, numbers, spaces, hyphens, and underscores",
    };
  }

  return { valid: true };
}

export function validateFramework(
  framework: string
): framework is AgentFramework {
  return ALLOWED_FRAMEWORKS.includes(framework as AgentFramework);
}
