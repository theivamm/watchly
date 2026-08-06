-- ============================================================
-- Migration 023: ADN Audiovisual module
-- 1) profiles: show_dna_publicly + dna_dirty
-- 2) public.media_metadata: normalized TMDB metadata for the
--    DNA algorithm (written by the edge function via service role)
-- 3) public.user_dna: persisted DNA result (REST exposed)
-- 4) Trigger: mark dna_dirty whenever the library changes
-- ============================================================

-- 1) profiles --------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_dna_publicly BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dna_dirty BOOLEAN NOT NULL DEFAULT false;

-- 2) media_metadata ---------------------------------------------
-- Only the calculate-user-dna edge function writes here (service role
-- bypasses RLS). No read policies: not exposed to clients.
CREATE TABLE IF NOT EXISTS public.media_metadata (
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT,
  release_date TEXT,
  genres JSONB NOT NULL DEFAULT '[]',
  runtime INTEGER,
  original_language TEXT,
  origin_countries JSONB NOT NULL DEFAULT '[]',
  directors JSONB NOT NULL DEFAULT '[]',
  top_cast JSONB NOT NULL DEFAULT '[]',
  metadata_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tmdb_id, media_type)
);

ALTER TABLE public.media_metadata ENABLE ROW LEVEL SECURITY;

-- 3) user_dna ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('locked', 'early', 'developing', 'solid', 'rich')),
  algorithm_version INTEGER NOT NULL DEFAULT 1,
  valid_title_count INTEGER NOT NULL DEFAULT 0,
  rated_title_count INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  top_genres JSONB NOT NULL DEFAULT '[]',
  format_distribution JSONB NOT NULL DEFAULT '{}',
  decade_distribution JSONB NOT NULL DEFAULT '[]',
  country_distribution JSONB NOT NULL DEFAULT '[]',
  language_distribution JSONB NOT NULL DEFAULT '[]',
  runtime_profile JSONB NOT NULL DEFAULT '{}',
  rating_profile JSONB NOT NULL DEFAULT '{}',
  recurring_directors JSONB NOT NULL DEFAULT '[]',
  recurring_cast JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  source_updated_at TIMESTAMPTZ,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own dna" ON public.user_dna;
CREATE POLICY "Users read own dna"
  ON public.user_dna FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public dna viewable" ON public.user_dna;
CREATE POLICY "Public dna viewable"
  ON public.user_dna FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id
      AND p.is_profile_public = true
      AND p.show_dna_publicly = true
      AND status <> 'locked'
  ));

-- 4) trigger: mark dna dirty on library changes ------------------
CREATE OR REPLACE FUNCTION public.mark_dna_dirty() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET dna_dirty = true, updated_at = now() WHERE id = OLD.user_id;
  ELSE
    UPDATE public.profiles SET dna_dirty = true, updated_at = now() WHERE id = NEW.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_entries_mark_dna_dirty ON public.entries;
CREATE TRIGGER trg_entries_mark_dna_dirty
  AFTER INSERT OR UPDATE OR DELETE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.mark_dna_dirty();
