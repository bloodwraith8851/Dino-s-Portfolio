-- ============================================================
-- Migration: Backend Improvements
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ┌─────────────────────────────────────────────────────────┐
-- │  1. PROJECTS TABLE                                       │
-- │  Single source of truth — removes hardcoded arrays      │
-- │  from both the API and frontend                          │
-- └─────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.projects (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'Personal',
  live_url      TEXT,
  description   TEXT,
  tech_stack    TEXT[] DEFAULT '{}',
  display_order INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Anyone can read active projects
CREATE POLICY "Anyone can read active projects"
  ON public.projects FOR SELECT
  USING (is_active = true);

-- Only service role can manage projects
CREATE POLICY "Service role can manage projects"
  ON public.projects FOR ALL
  USING (auth.role() = 'service_role');

-- Seed the 4 existing projects (matches what was hardcoded before)
INSERT INTO public.projects (slug, name, category, live_url, description, display_order) VALUES
  ('forge',    'Forge',    'Personal',          '#', 'Personal project',               1),
  ('lawlab',   'LawLab',   'Personal',          '#', 'Legal-tech tool',                2),
  ('resumeiq', 'ResumeIQ', 'Personal · GenAI',  '#', 'AI-powered resume analyser',    3),
  ('notch',    'Notch',    'Personal · Design', '#', 'Design-focused personal project', 4)
ON CONFLICT (slug) DO NOTHING;

-- ┌─────────────────────────────────────────────────────────┐
-- │  2. RESUME DOWNLOADS TRACKING                            │
-- └─────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.resume_downloads (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip         TEXT,
  user_agent TEXT,
  referrer   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resume_downloads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (the edge function uses anon key)
CREATE POLICY "Edge function can log downloads"
  ON public.resume_downloads FOR INSERT
  WITH CHECK (true);

-- Only service role can read download logs
CREATE POLICY "Service role can read downloads"
  ON public.resume_downloads FOR SELECT
  USING (auth.role() = 'service_role');

-- ┌─────────────────────────────────────────────────────────┐
-- │  3. ADD status COLUMN TO messages                        │
-- │  Allows you to track reply state of hire requests        │
-- └─────────────────────────────────────────────────────────┘
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for the stale-message-reminder query
CREATE INDEX IF NOT EXISTS idx_messages_status_created
  ON public.messages (status, created_at);

-- ┌─────────────────────────────────────────────────────────┐
-- │  4. FIX PAGE VIEWS — drop the Supabase table             │
-- │  Neon Postgres is the single source for analytics        │
-- │  The admin 'stats' command should call /api/analytics/stats │
-- └─────────────────────────────────────────────────────────┘
-- Note: We're keeping the Supabase page_views table but
-- deprecating writes to it. The Neon table is authoritative.
-- You can drop it once you've updated all readers:
--   DROP TABLE IF EXISTS public.page_views;
COMMENT ON TABLE public.page_views IS 'DEPRECATED: use Neon page_views table instead. Kept for zero-downtime migration.';

-- ┌─────────────────────────────────────────────────────────┐
-- │  5. FIX project_likes — project_id must match projects.id │
-- └─────────────────────────────────────────────────────────┘
-- Reseed project_likes to match the new projects table IDs
-- Run this AFTER inserting the projects above.
-- The sequence starts at 1 if the table was freshly created.
INSERT INTO public.project_likes (project_id, likes_count)
SELECT id, 0 FROM public.projects
ON CONFLICT (project_id) DO NOTHING;

-- ┌─────────────────────────────────────────────────────────┐
-- │  6. ENABLE REALTIME ON resume_downloads                  │
-- └─────────────────────────────────────────────────────────┘
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.resume_downloads;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ✅ Migration complete.
--
-- New tables:
--   projects         — replaces hardcoded project arrays
--   resume_downloads — tracks every CV download
--
-- Modified tables:
--   messages         — added status, replied_at, notes columns
--   project_likes    — seeded to match projects.id
--   page_views       — deprecated (Neon is now authoritative)
-- ============================================================
