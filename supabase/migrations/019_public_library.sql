-- ============================================================
-- Migration 019: Public library on public profiles
-- Allow anonymous visitors to read the entries (library) of
-- users whose profile is public, so public profiles show
-- their added movies and series.
-- ============================================================

DROP POLICY IF EXISTS "Public entries viewable" ON public.entries;
CREATE POLICY "Public entries viewable"
  ON public.entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id AND p.is_profile_public = true
  ));
