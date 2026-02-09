import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import type { Dream, DreamState } from "@/lib/types";
import { LiveStream } from "@/components/LiveStream";

export const metadata: Metadata = {
  title: "The Backroom | Electric Sheep",
  description: "You found the backroom. Dreams are streaming.",
};

export const revalidate = 30;

async function getRecentDreams(): Promise<Dream[]> {
  try {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) return data as Dream[];
  } catch {
    // Supabase unavailable
  }
  return [];
}

async function getState(): Promise<DreamState | null> {
  try {
    const { data, error } = await supabase
      .from("dream_state")
      .select("*")
      .eq("id", 1)
      .single();

    if (!error && data) return data as DreamState;
  } catch {
    // Supabase unavailable
  }
  return null;
}

export default async function LivePage() {
  const [dreams, state] = await Promise.all([getRecentDreams(), getState()]);

  return <LiveStream initialDreams={dreams} initialState={state} />;
}
