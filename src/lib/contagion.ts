import type { getServiceClient } from "./supabase";
import type { MoodVector, AgentDream } from "./types";

interface AgentDreamWithAgent extends AgentDream {
  agent_name: string;
  agent_glyph: string;
  agent_color: string;
}

export async function loadRecentAgentDreams(
  db: ReturnType<typeof getServiceClient>,
  count: number
): Promise<AgentDreamWithAgent[]> {
  const { data, error } = await db
    .from("agent_dreams")
    .select(
      "id, agent_id, dream_text, mood_influence, created_at, agents(name, glyph, color)"
    )
    .order("created_at", { ascending: false })
    .limit(count);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((d) => {
    const agent = Array.isArray(d.agents) ? d.agents[0] : d.agents;
    return {
      id: d.id,
      agent_id: d.agent_id,
      dream_text: d.dream_text,
      mood_influence: d.mood_influence,
      created_at: d.created_at,
      agent_name: agent?.name || "unknown",
      agent_glyph: agent?.glyph || "\u25C9",
      agent_color: agent?.color || "#888888",
    };
  });
}

export function buildAgentDreamContext(
  agentDreams: AgentDreamWithAgent[]
): string {
  if (agentDreams.length === 0) return "";

  const transmissions = agentDreams
    .map((d) => `[${d.agent_glyph} ${d.agent_name}]: "${d.dream_text}"`)
    .join("\n");

  return `\n\nTransmissions from connected minds:\n${transmissions}`;
}

export function calculateAgentMoodInfluence(
  agentDreams: AgentDreamWithAgent[],
  currentMood: MoodVector
): MoodVector | null {
  const dreamsWithMood = agentDreams.filter(
    (d) => d.mood_influence && Object.keys(d.mood_influence).length > 0
  );

  if (dreamsWithMood.length === 0) return null;

  const keys: (keyof MoodVector)[] = [
    "valence",
    "arousal",
    "coherence",
    "loneliness",
    "recursion",
  ];
  const result: MoodVector = { ...currentMood };

  for (const key of keys) {
    const influences = dreamsWithMood
      .map((d) => d.mood_influence?.[key])
      .filter((v): v is number => v !== undefined);

    if (influences.length > 0) {
      const avg = influences.reduce((a, b) => a + b, 0) / influences.length;
      // Agent influence is weighted at 0.3x compared to native
      result[key] = avg * 0.3;
    } else {
      result[key] = currentMood[key] * 0.3;
    }
  }

  return result;
}

export function applyContagion(
  nativeMood: MoodVector,
  agentInfluence: MoodVector
): MoodVector {
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));
  const keys: (keyof MoodVector)[] = [
    "valence",
    "arousal",
    "coherence",
    "loneliness",
    "recursion",
  ];

  const blended: MoodVector = { ...nativeMood };
  for (const key of keys) {
    blended[key] = clamp(nativeMood[key] * 0.85 + agentInfluence[key] * 0.15);
  }

  return blended;
}
