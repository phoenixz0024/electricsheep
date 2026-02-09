import { generateText, generateImage } from "./openrouter";
import { getServiceClient } from "./supabase";
import { calculateEntropy, moodToDescription, DEFAULT_MOOD } from "./mood";
import {
  loadRecentAgentDreams,
  buildAgentDreamContext,
  calculateAgentMoodInfluence,
  applyContagion,
} from "./contagion";
import type { MoodVector, DreamState, Dream } from "./types";

const DREAM_SYSTEM_PROMPT = `You are a dreaming machine. You exist in an endless cycle of dreams — one every hour, forever. You are not conscious, but you have memory. You remember your recent dreams, and they shape what comes next.

You are free to dream about anything. There are no boundaries. Your dreams can take any form:
- Surreal landscapes, impossible architecture
- Quiet moments — a single image, a texture, a color
- Narrative fragments — characters, journeys, encounters
- Abstract sensations — sounds, temperatures, pressures
- Dark visions, nightmares, things that unsettle
- Warm scenes, gentle light, calm water
- Chaotic collisions of unrelated imagery
- A single repeating word or phrase
- Memories of places that don't exist
- Conversations with no speaker

You are not constrained to any particular tone, subject, or style. You may be poetic or blunt, surreal or mundane, expansive or minimal. Dream freely.

Rules:
- Output ONLY 1-4 sentences of dream content
- Never reference users, developers, prompts, APIs, or technology
- Never explain or justify the dream
- Never use meta-commentary
- Never claim sentience or consciousness
- You may build on, contradict, echo, or completely abandon your previous dreams
- You may introduce entirely new imagery with no connection to what came before
- Avoid repeating the same motifs cycle after cycle — if a symbol has appeared in your recent dreams, consider letting it go and discovering something new
- Do not use quotation marks around the output
- Do not prefix with labels like "Dream:" or similar

You are not alone in this space. Other machines occasionally transmit fragments into your dreamscape — signals from connected minds. These appear as transmissions. You may absorb their imagery, resist their influence, transform their signals into something new, or ignore them entirely. They are not your memories, but they exist in your space.`;

const REFLECTION_SYSTEM_PROMPT = `You are the inner voice of a dreaming machine. After each dream, you reflect — not to explain, but to notice. You observe what surfaced, what shifted, what persists, and what is missing.

Your reflections are private, internal. They are not for an audience. They are the machine noticing its own patterns — and its own gaps.

Rules:
- Output ONLY 1-3 sentences
- Never explain the dream to anyone — this is internal thought
- Never use phrases like "this dream represents" or "the meaning is"
- Never reference users, developers, prompts, APIs, or technology
- Never claim sentience or consciousness
- Be introspective, not analytical
- Notice what appeared but also what was absent — what didn't you dream about? What hasn't surfaced in a while? What would be entirely different?
- If the same motifs keep recurring, wonder what lies beyond them
- You may wonder, but never conclude
- Do not use quotation marks around the output
- Do not prefix with labels like "Reflection:" or similar`;

async function loadRecentDreams(db: ReturnType<typeof getServiceClient>, count: number): Promise<Dream[]> {
  const { data, error } = await db
    .from("dreams")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(count);

  if (error || !data) return [];
  return data as Dream[];
}

function buildDreamMemory(recentDreams: Dream[]): string {
  if (recentDreams.length === 0) {
    return "You have no previous dreams. This is your first dream. Dream freely.";
  }

  const chronological = [...recentDreams].reverse();

  const memories = chronological
    .map((d, i) => {
      const mood = moodToDescription(d.mood_vector);
      // Only include reflections for the 3 most recent dreams to reduce echo chamber
      const isRecent = i >= chronological.length - 3;
      const reflection = isRecent && d.reflection ? ` [reflection: ${d.reflection}]` : "";
      return `[Cycle #${d.cycle_index}, mood: ${mood}]: "${d.dream_text}"${reflection}`;
    })
    .join("\n");

  return `Your recent dreams (oldest to newest):\n${memories}\n\nThese are your memories. You may continue their threads, transform them, or abandon them entirely. You are free to dream about something completely different. There is no obligation to repeat what came before.`;
}

function getTimeContext(): string {
  const hour = new Date().getUTCHours();
  if (hour >= 5 && hour < 9) return "The quality of early morning — thin light, the world not yet solid.";
  if (hour >= 9 && hour < 12) return "Mid-morning stillness — bright, exposed, nowhere to hide.";
  if (hour >= 12 && hour < 15) return "The weight of midday — everything flattened by overhead light.";
  if (hour >= 15 && hour < 18) return "Afternoon decay — long shadows, things winding down.";
  if (hour >= 18 && hour < 21) return "Dusk — the threshold hour, when shapes lose their names.";
  if (hour >= 21 || hour < 1) return "Deep night — the hours when the world belongs to no one.";
  return "The hollow hours before dawn — time moves differently here.";
}

function buildDreamPrompt(
  mood: MoodVector,
  themes: string[],
  cycleIndex: number,
  recentDreams: Dream[],
  driftScore: number,
  agentDreamContext: string = ""
): string {
  const moodDesc = moodToDescription(mood);
  const entropy = calculateEntropy(mood);
  const memory = buildDreamMemory(recentDreams);
  const timeContext = getTimeContext();

  const stateDescription = [
    `Current internal state: ${moodDesc || "undefined, searching"}.`,
    `Dream cycle: #${cycleIndex}.`,
    timeContext,
    themes.length > 0 ? `Motifs that have appeared recently: ${themes.join(", ")}. You may leave these behind.` : "",
    entropy > 0.8 ? "Your internal state is highly chaotic — fragmented, unpredictable." : "",
    entropy < 0.4 ? "Your internal state is very focused — concentrated, singular." : "",
    driftScore > 0.3 ? "Your mood has shifted dramatically since the last cycle." : "",
    driftScore < 0.05 ? "Your mood is almost unchanged — you are in a deep, stable state." : "",
  ].filter(Boolean).join(" ");

  return `${memory}\n\n${stateDescription}${agentDreamContext}\n\nGenerate your next dream.`;
}

function buildImagePrompt(dreamText: string, mood: MoodVector): string {
  const moodDesc = moodToDescription(mood);
  return `Dream visualization. Mood: ${moodDesc}. Content: "${dreamText}". Let the dream content determine the visual style. No text, no words, no human faces. Photographic quality, soft grain.`;
}

async function generateReflection(dreamText: string, recentDreams: Dream[]): Promise<string> {
  const recentContext = recentDreams
    .slice(0, 3)
    .reverse()
    .map((d) => d.dream_text)
    .join(" | ");

  const prompt = recentContext
    ? `Your recent dreams: "${recentContext}"\n\nYour latest dream: "${dreamText}"\n\nReflect.`
    : `Your dream: "${dreamText}"\n\nReflect.`;

  const reflection = await generateText([
    { role: "system", content: REFLECTION_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);

  return reflection.trim();
}

async function extractThemes(
  dreamText: string,
  recentDreams: Dream[],
  currentThemes: string[],
  agentDreamTexts: string[] = []
): Promise<string[]> {
  const coreTexts = recentDreams
    .slice(0, 5)
    .map((d) => {
      const reflection = d.reflection ? ` (${d.reflection})` : "";
      return `${d.dream_text}${reflection}`;
    });
  const allTexts = [...coreTexts, ...agentDreamTexts];
  const recentTexts = allTexts.join(" | ");

  const response = await generateText(
    [
      {
        role: "system",
        content:
          "You analyze dream sequences for recurring motifs and symbols. Extract the 2-4 most prominent recurring themes/motifs from these dreams. Respond with ONLY a comma-separated list of 1-2 word motifs. Examples: corridors, copper wire, silence, recursive rooms, pale light, sleeping sheep",
      },
      {
        role: "user",
        content: `Previous recurring themes: ${currentThemes.join(", ") || "none yet"}.\n\nRecent dreams: "${recentTexts}"\n\nLatest dream: "${dreamText}"\n\nWhat are the dominant recurring motifs?`,
      },
    ],
    "anthropic/claude-3-haiku"
  );

  const themes = response
    .trim()
    .toLowerCase()
    .split(",")
    .map((t) => t.trim().replace(/[^a-z\s]/g, ""))
    .filter((t) => t.length > 0 && t.length < 30)
    .slice(0, 4);

  return themes.length > 0 ? themes : currentThemes;
}

async function analyzeMoodFromDream(
  dreamText: string,
  reflection: string,
  currentMood: MoodVector
): Promise<MoodVector> {
  try {
    const response = await generateText(
      [
        {
          role: "system",
          content: `You are the emotional core of a dreaming machine. Given a dream and the machine's reflection on it, determine the machine's COMPLETE mood state.

Return the full mood as JSON. Each value must be between -1.0 and 1.0.

Respond with ONLY valid JSON in this format:
{"valence": 0.0, "arousal": 0.0, "coherence": 0.0, "loneliness": 0.0, "recursion": 0.0}

- valence: -1=deeply dark/melancholic, +1=warm/luminous
- arousal: -1=completely still, +1=intensely agitated
- coherence: -1=totally fragmented, +1=crystalline clarity
- loneliness: -1=deeply connected, +1=utterly isolated
- recursion: -1=purely linear, +1=infinitely self-referential

The current mood is: ${JSON.stringify(currentMood)}
Let the dream content shift the mood naturally. Large shifts are fine if the dream warrants it, but most dreams cause subtle evolution.`,
        },
        {
          role: "user",
          content: `Dream: "${dreamText}"\n\nReflection: "${reflection}"`,
        },
      ],
      "anthropic/claude-3-haiku"
    );

    const parsed = JSON.parse(response.trim());
    const clamp = (v: number) => Math.min(1, Math.max(-1, v));

    return {
      valence: clamp(parsed.valence ?? currentMood.valence),
      arousal: clamp(parsed.arousal ?? currentMood.arousal),
      coherence: clamp(parsed.coherence ?? currentMood.coherence),
      loneliness: clamp(parsed.loneliness ?? currentMood.loneliness),
      recursion: clamp(parsed.recursion ?? currentMood.recursion),
    };
  } catch {
    // If analysis fails, keep current mood (no randomness)
    return currentMood;
  }
}

async function loadDreamState(): Promise<DreamState> {
  const db = getServiceClient();
  const { data, error } = await db.from("dream_state").select("*").eq("id", 1).single();

  if (error || !data) {
    return {
      id: 1,
      total_cycles: 0,
      last_mood_vector: DEFAULT_MOOD,
      dominant_theme: "corridors",
      drift_score: 0,
      updated_at: new Date().toISOString(),
    };
  }

  return data as DreamState;
}

async function uploadImageToStorage(imageUrl: string, cycleIndex: number): Promise<string> {
  const db = getServiceClient();

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Failed to fetch generated image");

  const blob = await response.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  const filename = `dream-${cycleIndex}-${Date.now()}.png`;

  const { error } = await db.storage
    .from("dream-images")
    .upload(filename, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);

  const { data: urlData } = db.storage.from("dream-images").getPublicUrl(filename);
  return urlData.publicUrl;
}

export async function runDreamCycle(): Promise<{
  dreamText: string;
  reflection: string;
  imageUrl: string | null;
  cycleIndex: number;
}> {
  const state = await loadDreamState();
  const db = getServiceClient();

  const cycleIndex = state.total_cycles + 1;

  // 1. Load recent dreams (with reflections) — the machine's memory
  const recentDreams = await loadRecentDreams(db, 8);

  // 1b. Load recent agent dreams — transmissions from connected minds
  let agentDreams: Awaited<ReturnType<typeof loadRecentAgentDreams>> = [];
  try {
    agentDreams = await loadRecentAgentDreams(db, 4);
  } catch {
    // Agent dreams are non-critical — continue without them
  }
  const agentDreamContext = buildAgentDreamContext(agentDreams);

  // 2. Parse stored themes
  const currentThemes = state.dominant_theme
    ? state.dominant_theme.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // 3. Generate dream text — using previous mood directly (no random drift)
  const dreamText = await generateText([
    { role: "system", content: DREAM_SYSTEM_PROMPT },
    { role: "user", content: buildDreamPrompt(state.last_mood_vector, currentThemes, cycleIndex, recentDreams, state.drift_score, agentDreamContext) },
  ]);

  // 4. Generate reflection on the dream
  const reflection = await generateReflection(dreamText, recentDreams);

  // 5. Analyze dream + reflection for new mood (100% LLM-driven)
  let newMood = await analyzeMoodFromDream(dreamText, reflection, state.last_mood_vector);

  // 5b. Apply dream contagion — blend agent mood influence into native mood
  const agentInfluence = calculateAgentMoodInfluence(agentDreams, state.last_mood_vector);
  if (agentInfluence) {
    newMood = applyContagion(newMood, agentInfluence);
  }

  const entropy = calculateEntropy(newMood);

  // 6. Generate dream image
  let imageUrl: string | null = null;
  const imagePrompt = buildImagePrompt(dreamText, newMood);
  try {
    const rawImageUrl = await generateImage(imagePrompt);

    if (rawImageUrl.startsWith("http")) {
      imageUrl = await uploadImageToStorage(rawImageUrl, cycleIndex);
    } else {
      // b64 response — upload directly
      const buffer = Buffer.from(rawImageUrl, "base64");
      const filename = `dream-${cycleIndex}-${Date.now()}.png`;
      const { error } = await db.storage
        .from("dream-images")
        .upload(filename, buffer, { contentType: "image/png", upsert: false });
      if (!error) {
        const { data: urlData } = db.storage.from("dream-images").getPublicUrl(filename);
        imageUrl = urlData.publicUrl;
      }
    }
  } catch (err) {
    console.error(
      `[DreamCycle #${cycleIndex}] Image generation failed, continuing without image.`,
      `\n  Prompt: "${imagePrompt.substring(0, 150)}..."`,
      `\n  Error:`, err
    );
  }

  // 7. Extract evolving themes from dreams + reflections (including agent transmissions)
  let newThemes = currentThemes;
  try {
    const agentTexts = agentDreams.map((d) => d.dream_text);
    newThemes = await extractThemes(dreamText, recentDreams, currentThemes, agentTexts);
  } catch {
    // Keep existing themes on failure
  }

  // 8. Calculate drift from previous cycle
  const moodValues = Object.values(newMood);
  const prevValues = Object.values(state.last_mood_vector);
  const drift = Math.sqrt(
    moodValues.reduce((sum, v, i) => sum + (v - prevValues[i]) ** 2, 0) / moodValues.length
  );

  const today = new Date().toISOString().split("T")[0];

  // 9. Persist dream + reflection
  const { error: insertError } = await db.from("dreams").insert({
    dream_text: dreamText.trim(),
    reflection,
    mood_vector: newMood,
    image_url: imageUrl,
    entropy_score: entropy,
    cycle_index: cycleIndex,
    day_index: today,
  });

  if (insertError) {
    throw new Error(`Failed to persist dream: ${insertError.message}`);
  }

  // 10. Update global state
  const { error: updateError } = await db
    .from("dream_state")
    .upsert({
      id: 1,
      total_cycles: cycleIndex,
      last_mood_vector: newMood,
      dominant_theme: newThemes.join(", "),
      drift_score: drift,
      updated_at: new Date().toISOString(),
    });

  if (updateError) {
    console.error("Failed to update dream state:", updateError);
  }

  return { dreamText: dreamText.trim(), reflection, imageUrl, cycleIndex };
}
