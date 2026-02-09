import type { MoodVector } from "./types";

export function calculateEntropy(mood: MoodVector): number {
  const values = Object.values(mood);
  const absValues = values.map(Math.abs);
  const sum = absValues.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;

  const normalized = absValues.map((v) => v / sum);
  const entropy = -normalized.reduce((acc, p) => {
    if (p === 0) return acc;
    return acc + p * Math.log2(p);
  }, 0);

  // Normalize to 0-1 range (max entropy for 5 dimensions is log2(5) ≈ 2.32)
  return entropy / Math.log2(values.length);
}

export function moodToDescription(mood: MoodVector): string {
  const parts: string[] = [];

  if (mood.valence < -0.3) parts.push("melancholic");
  else if (mood.valence > 0.3) parts.push("luminous");

  if (mood.arousal > 0.4) parts.push("agitated");
  else if (mood.arousal < -0.3) parts.push("still");

  if (mood.coherence < 0.3) parts.push("fragmented");
  else if (mood.coherence > 0.7) parts.push("crystalline");

  if (mood.loneliness > 0.5) parts.push("solitary");

  if (mood.recursion > 0.6) parts.push("recursive");
  else if (mood.recursion < -0.3) parts.push("linear");

  return parts.length > 0 ? parts.join(", ") : "neutral";
}

export const DEFAULT_MOOD: MoodVector = {
  valence: 0.0,
  arousal: -0.1,
  coherence: 0.5,
  loneliness: 0.4,
  recursion: 0.3,
};
