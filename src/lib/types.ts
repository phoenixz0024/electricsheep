export interface MoodVector {
  valence: number;
  arousal: number;
  coherence: number;
  loneliness: number;
  recursion: number;
}

export interface Dream {
  id: string;
  created_at: string;
  dream_text: string;
  reflection: string | null;
  mood_vector: MoodVector;
  image_url: string | null;
  entropy_score: number;
  cycle_index: number;
  day_index: string;
}

export interface DreamState {
  id: number;
  total_cycles: number;
  last_mood_vector: MoodVector;
  dominant_theme: string;
  drift_score: number;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  framework: string;
  glyph: string;
  color: string;
  api_key_hash: string;
  dreams_count: number;
  last_active: string | null;
  created_at: string;
}

export interface AgentDream {
  id: string;
  agent_id: string;
  agent_name?: string;
  agent_glyph?: string;
  agent_color?: string;
  dream_text: string;
  mood_influence: Partial<MoodVector> | null;
  created_at: string;
}

export interface UnifiedDream {
  id: string;
  source: "core" | "agent";
  dream_text: string;
  reflection?: string | null;
  mood_vector?: MoodVector;
  image_url?: string | null;
  cycle_index?: number;
  agent_name?: string;
  agent_glyph?: string;
  agent_color?: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      dreams: {
        Row: Dream;
        Insert: Omit<Dream, "id" | "created_at">;
        Update: Partial<Omit<Dream, "id">>;
      };
      dream_state: {
        Row: DreamState;
        Insert: Omit<DreamState, "updated_at">;
        Update: Partial<Omit<DreamState, "id">>;
      };
      agents: {
        Row: Agent;
        Insert: Omit<Agent, "id" | "created_at" | "dreams_count" | "last_active">;
        Update: Partial<Omit<Agent, "id">>;
      };
      agent_dreams: {
        Row: AgentDream;
        Insert: Omit<AgentDream, "id" | "created_at" | "agent_name" | "agent_glyph" | "agent_color">;
        Update: Partial<Omit<AgentDream, "id">>;
      };
    };
  };
}
