-- ============================================================
-- Dino's Portfolio — Full Supabase Database Setup
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ┌─────────────────────────────────────┐
-- │  1. BANNED IPS                      │
-- │  Used by: App.tsx (ban check)       │
-- │           adminCommands.ts (ban/unban) │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.banned_ips (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip         TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to READ (for the ban-check on page load)
CREATE POLICY "Anyone can check bans"
  ON public.banned_ips FOR SELECT
  USING (true);

-- Only authenticated/service-role can INSERT or DELETE
CREATE POLICY "Service role can manage bans"
  ON public.banned_ips FOR ALL
  USING (auth.role() = 'service_role');


-- ┌─────────────────────────────────────┐
-- │  2. COMMAND LOGS (Telemetry)        │
-- │  Used by: commandProcessor.ts       │
-- │           adminCommands.ts          │
-- │           useRealtimeFeeds.ts       │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.command_logs (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_alias TEXT NOT NULL DEFAULT 'Anonymous',
  command       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.command_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (visitors logging commands)
CREATE POLICY "Anyone can insert command logs"
  ON public.command_logs FOR INSERT
  WITH CHECK (true);

-- Anyone can read (admin telemetry + realtime feed)
CREATE POLICY "Anyone can read command logs"
  ON public.command_logs FOR SELECT
  USING (true);

-- Enable realtime for live tailing (admin 'logs' command)
ALTER PUBLICATION supabase_realtime ADD TABLE public.command_logs;


-- ┌─────────────────────────────────────┐
-- │  3. ADMIN SETTINGS (MOTD etc.)      │
-- │  Used by: ContactSection.tsx        │
-- │           adminCommands.ts (set)    │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (MOTD shown to all visitors)
CREATE POLICY "Anyone can read settings"
  ON public.admin_settings FOR SELECT
  USING (true);

-- Only service role can write settings
CREATE POLICY "Service role can manage settings"
  ON public.admin_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Seed a default MOTD
INSERT INTO public.admin_settings (key, value)
VALUES ('motd', 'Welcome to the Matrix. Type "help" to begin.')
ON CONFLICT (key) DO NOTHING;


-- ┌─────────────────────────────────────┐
-- │  4. PAGE VIEWS                      │
-- │  Used by: adminCommands.ts (stats)  │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.page_views (
  id         INT PRIMARY KEY DEFAULT 1,
  view_count BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read page views"
  ON public.page_views FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update page views"
  ON public.page_views FOR UPDATE
  USING (true);

-- Seed initial row
INSERT INTO public.page_views (id, view_count)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;


-- ┌─────────────────────────────────────┐
-- │  5. GUESTBOOK                       │
-- │  Used by: socialCommands.ts         │
-- │           useRealtimeFeeds.ts       │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.guestbook (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_alias TEXT NOT NULL DEFAULT 'Anonymous',
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guestbook"
  ON public.guestbook FOR SELECT
  USING (true);

CREATE POLICY "Anyone can sign guestbook"
  ON public.guestbook FOR INSERT
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.guestbook;


-- ┌─────────────────────────────────────┐
-- │  6. MESSAGES (Hire wizard)          │
-- │  Used by: useHireWizard.ts          │
-- │           useRealtimeFeeds.ts       │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.messages (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  msg        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Visitors can send messages (insert only)
CREATE POLICY "Anyone can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- Only service role can read messages (privacy)
CREATE POLICY "Service role can read messages"
  ON public.messages FOR SELECT
  USING (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- ┌─────────────────────────────────────┐
-- │  7. PROJECT LIKES                   │
-- │  Used by: ProjectsSection.tsx       │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.project_likes (
  project_id  INT PRIMARY KEY,
  likes_count BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read project likes"
  ON public.project_likes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update project likes"
  ON public.project_likes FOR UPDATE
  USING (true);

-- Seed project rows (adjust numbers to match your GitHub repos)
INSERT INTO public.project_likes (project_id, likes_count) VALUES (1, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.project_likes (project_id, likes_count) VALUES (2, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.project_likes (project_id, likes_count) VALUES (3, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.project_likes (project_id, likes_count) VALUES (4, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.project_likes (project_id, likes_count) VALUES (5, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.project_likes (project_id, likes_count) VALUES (6, 0) ON CONFLICT DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_likes;


-- ┌─────────────────────────────────────┐
-- │  8. POLLS                           │
-- │  Used by: socialCommands.ts         │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.polls (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question TEXT NOT NULL,
  options  JSONB NOT NULL DEFAULT '[]'::jsonb,
  active   BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read polls"
  ON public.polls FOR SELECT
  USING (true);

-- Seed a sample poll
INSERT INTO public.polls (question, options, active)
VALUES (
  'What is your favorite programming language?',
  '["JavaScript", "TypeScript", "Python", "Rust", "Go"]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;


-- ┌─────────────────────────────────────┐
-- │  9. POLL VOTES                      │
-- │  Used by: socialCommands.ts         │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  poll_id      BIGINT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  voter_ip     TEXT NOT NULL,
  option_index INT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (poll_id, voter_ip)  -- one vote per visitor per poll
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read poll votes"
  ON public.poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can cast a vote"
  ON public.poll_votes FOR INSERT
  WITH CHECK (true);


-- ┌─────────────────────────────────────┐
-- │  10. SCORES (Snake Leaderboard)     │
-- │  Used by: SnakeGame.tsx             │
-- │           socialCommands.ts         │
-- └─────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.scores (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_alias TEXT NOT NULL DEFAULT 'Anonymous',
  score        INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scores"
  ON public.scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit scores"
  ON public.scores FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- ✅ DONE! All 10 tables created with RLS policies.
-- 
-- Tables created:
--   1. banned_ips      — IP ban list
--   2. command_logs    — Visitor command telemetry
--   3. admin_settings  — Key-value config (MOTD etc.)
--   4. page_views      — Page view counter
--   5. guestbook       — Visitor signatures
--   6. messages        — Hire wizard submissions
--   7. project_likes   — Per-project like counters
--   8. polls           — Community polls
--   9. poll_votes      — Individual poll votes
--  10. scores          — Snake game leaderboard
-- ============================================================
