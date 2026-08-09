-- ============================================================
-- Migration 024: ADN audiovisual Fase 1 - viewing_sessions
-- 1) public.viewing_sessions: historical viewing events
-- 2) RLS (owner-only, private)
-- 3) Trigger: mark dna_dirty whenever a session changes
-- ============================================================

-- 1) viewing_sessions ----------------------------------------
-- Following the app convention, media is identified by
-- (tmdb_id, media_type) instead of watchly.media(id).
-- All context fields are optional (defaults are safe values).
CREATE TABLE IF NOT EXISTS public.viewing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  watched_at TIMESTAMPTZ,
  watched_date DATE,
  timezone TEXT,
  venue TEXT NOT NULL DEFAULT 'unknown'
    CHECK (venue IN ('cinema', 'home', 'friend_home', 'travel', 'other', 'unknown')),
  platform TEXT NOT NULL DEFAULT 'unknown'
    CHECK (platform IN ('streaming', 'television', 'rental', 'physical', 'download', 'other', 'unknown')),
  provider_id TEXT,
  companionship TEXT NOT NULL DEFAULT 'unknown'
    CHECK (companionship IN ('alone', 'partner', 'friends', 'family', 'children', 'other', 'unknown')),
  language_mode TEXT NOT NULL DEFAULT 'unknown'
    CHECK (language_mode IN ('original_subtitled', 'dubbed', 'original_no_subtitles', 'unknown')),
  is_rewatch BOOLEAN NOT NULL DEFAULT false,
  scope TEXT NOT NULL DEFAULT 'full_title'
    CHECK (scope IN ('full_title', 'season', 'viewing_session')),
  season_number INTEGER,
  episode_number INTEGER,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viewing_sessions_user_tmdb
  ON public.viewing_sessions (user_id, tmdb_id, media_type);

CREATE INDEX IF NOT EXISTS idx_viewing_sessions_watched_date
  ON public.viewing_sessions (user_id, watched_date);

-- 2) RLS -------------------------------------------------------
ALTER TABLE public.viewing_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own viewing sessions" ON public.viewing_sessions;
CREATE POLICY "Users view own viewing sessions"
  ON public.viewing_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own viewing sessions" ON public.viewing_sessions;
CREATE POLICY "Users insert own viewing sessions"
  ON public.viewing_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own viewing sessions" ON public.viewing_sessions;
CREATE POLICY "Users update own viewing sessions"
  ON public.viewing_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own viewing sessions" ON public.viewing_sessions;
CREATE POLICY "Users delete own viewing sessions"
  ON public.viewing_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 3) trigger: mark dna dirty on session changes ----------------
DROP TRIGGER IF EXISTS trg_viewing_sessions_mark_dna_dirty ON public.viewing_sessions;
CREATE TRIGGER trg_viewing_sessions_mark_dna_dirty
  AFTER INSERT OR UPDATE OR DELETE ON public.viewing_sessions
  FOR EACH ROW EXECUTE FUNCTION public.mark_dna_dirty();
