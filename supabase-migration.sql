-- Electric Sheep Database Migration (Fresh Start)
-- Run this in your Supabase SQL editor
-- This will DROP all existing tables and start clean.

-- 0. Clean slate — drop existing tables and policies
DROP TABLE IF EXISTS agent_dreams CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS dreams CASCADE;
DROP TABLE IF EXISTS dream_state CASCADE;
DROP POLICY IF EXISTS "Dream images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload dream images" ON storage.objects;
DELETE FROM storage.objects WHERE bucket_id = 'dream-images';
DELETE FROM storage.buckets WHERE id = 'dream-images';

-- 1. Dreams table
CREATE TABLE dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  dream_text text NOT NULL,
  reflection text,
  mood_vector jsonb NOT NULL,
  image_url text,
  entropy_score float NOT NULL DEFAULT 0,
  cycle_index integer NOT NULL,
  day_index date NOT NULL DEFAULT CURRENT_DATE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON dreams (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dreams_day_index ON dreams (day_index);
CREATE INDEX IF NOT EXISTS idx_dreams_cycle_index ON dreams (cycle_index);

-- 2. Dream state table (single row)
CREATE TABLE dream_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_cycles integer NOT NULL DEFAULT 0,
  last_mood_vector jsonb NOT NULL DEFAULT '{"valence": 0, "arousal": -0.1, "coherence": 0.5, "loneliness": 0.4, "recursion": 0.3}'::jsonb,
  dominant_theme text NOT NULL DEFAULT 'corridors',
  drift_score float NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial state
INSERT INTO dream_state (id, total_cycles, last_mood_vector, dominant_theme, drift_score)
VALUES (
  1,
  0,
  '{"valence": 0, "arousal": -0.1, "coherence": 0.5, "loneliness": 0.4, "recursion": 0.3}'::jsonb,
  'corridors',
  0
)
ON CONFLICT (id) DO NOTHING;

-- 3. Row Level Security
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_state ENABLE ROW LEVEL SECURITY;

-- Public read access for dreams
CREATE POLICY "Dreams are publicly readable"
  ON dreams FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role write access for dreams
CREATE POLICY "Service role can insert dreams"
  ON dreams FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Public read access for dream state
CREATE POLICY "Dream state is publicly readable"
  ON dream_state FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role write access for dream state
CREATE POLICY "Service role can update dream state"
  ON dream_state FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Storage bucket for dream images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dream-images', 'dream-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for dream images
CREATE POLICY "Dream images are publicly accessible"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'dream-images');

-- Service role upload access
CREATE POLICY "Service role can upload dream images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'dream-images');

-- 5. Agents table
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

CREATE INDEX IF NOT EXISTS idx_agents_api_key_hash ON agents (api_key_hash);
CREATE INDEX IF NOT EXISTS idx_agents_last_active ON agents (last_active DESC);

-- 6. Agent dreams table
CREATE TABLE agent_dreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  dream_text TEXT NOT NULL,
  mood_influence JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_dreams_agent_id ON agent_dreams (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_dreams_created_at ON agent_dreams (created_at DESC);

-- 7. RLS for agent tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_dreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agents" ON agents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read agent_dreams" ON agent_dreams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service insert agents" ON agents FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service update agents" ON agents FOR UPDATE TO service_role USING (true);
CREATE POLICY "Service insert agent_dreams" ON agent_dreams FOR INSERT TO service_role WITH CHECK (true);
