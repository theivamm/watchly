-- ============================================================
-- Migration 025: ADN audiovisual Fase 2 - reacciones personales
-- 1) public.reaction_tags: controlled catalog of reactions
-- 2) public.viewing_session_reactions: join table, max 3 per
--    session (enforced in DB), RLS by session owner
-- 3) Trigger: max 3 reactions per session
-- 4) Trigger: mark dna_dirty whenever a reaction is added/removed
-- ============================================================

-- 1) reaction_tags ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.reaction_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reaction_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reaction tags are readable" ON public.reaction_tags;
-- The catalog is a small controlled reference table. Making it readable
-- to any authenticated user (not just the owner) is required so every
-- user sees the same reaction names. No PII / per-user data here.
CREATE POLICY "Reaction tags are readable"
  ON public.reaction_tags FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Reaction tags are managed by owner" ON public.reaction_tags;
CREATE POLICY "Reaction tags are managed by owner"
  ON public.reaction_tags FOR ALL
  USING (false)
  WITH CHECK (false);

-- Seed the controlled catalog (idempotent)
INSERT INTO public.reaction_tags (slug, name, is_active) VALUES
  ('made_me_laugh', 'Me hizo reír', true),
  ('moved_me', 'Me emocionó', true),
  ('surprised_me', 'Me sorprendió', true),
  ('made_me_think', 'Me dejó pensando', true),
  ('unsettled_me', 'Me inquietó', true),
  ('disappointed_me', 'Me decepcionó', true),
  ('made_me_nostalgic', 'Me dio nostalgia', true),
  ('hooked_me', 'Me atrapó', true),
  ('hard_to_finish', 'Me costó terminarla', true),
  ('want_to_rewatch', 'Quiero volver a verla', true)
ON CONFLICT (slug) DO UPDATE SET
  name = excluded.name,
  is_active = true;

-- 2) viewing_session_reactions -----------------------------------
CREATE TABLE IF NOT EXISTS public.viewing_session_reactions (
  viewing_session_id UUID NOT NULL REFERENCES public.viewing_sessions(id) ON DELETE CASCADE,
  reaction_tag_id UUID NOT NULL REFERENCES public.reaction_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (viewing_session_id, reaction_tag_id)
);

CREATE INDEX IF NOT EXISTS idx_session_reactions_session
  ON public.viewing_session_reactions (viewing_session_id);

CREATE INDEX IF NOT EXISTS idx_session_reactions_tag
  ON public.viewing_session_reactions (reaction_tag_id);

ALTER TABLE public.viewing_session_reactions ENABLE ROW LEVEL SECURITY;

-- A user manages the reactions of their own sessions (by ownership of
-- the related viewing_session, not by the content globally).
DROP POLICY IF EXISTS "Users read own session reactions" ON public.viewing_session_reactions;
CREATE POLICY "Users read own session reactions"
  ON public.viewing_session_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.viewing_sessions vs
    WHERE vs.id = viewing_session_id
      AND vs.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users insert own session reactions" ON public.viewing_session_reactions;
CREATE POLICY "Users insert own session reactions"
  ON public.viewing_session_reactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.viewing_sessions vs
    WHERE vs.id = viewing_session_id
      AND vs.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users update own session reactions" ON public.viewing_session_reactions;
CREATE POLICY "Users update own session reactions"
  ON public.viewing_session_reactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.viewing_sessions vs
    WHERE vs.id = viewing_session_id
      AND vs.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users delete own session reactions" ON public.viewing_session_reactions;
CREATE POLICY "Users delete own session reactions"
  ON public.viewing_session_reactions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.viewing_sessions vs
    WHERE vs.id = viewing_session_id
      AND vs.user_id = auth.uid()
  ));

-- 3) trigger: max 3 reactions per session (enforced in the DB) ---
CREATE OR REPLACE FUNCTION public.check_session_reaction_limit() RETURNS trigger AS $$
DECLARE
  cnt INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO cnt
    FROM public.viewing_session_reactions
    WHERE viewing_session_id = NEW.viewing_session_id;
    IF cnt >= 3 THEN
      RAISE EXCEPTION 'A maximum of 3 reactions per session is allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_session_reaction_limit ON public.viewing_session_reactions;
CREATE TRIGGER trg_check_session_reaction_limit
  BEFORE INSERT ON public.viewing_session_reactions
  FOR EACH ROW EXECUTE FUNCTION public.check_session_reaction_limit();

-- 4) trigger: mark dna dirty on reaction changes ----------------
CREATE OR REPLACE FUNCTION public.mark_dna_dirty_from_reaction() RETURNS trigger AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT user_id INTO v_user_id
    FROM public.viewing_sessions
    WHERE id = OLD.viewing_session_id;
  ELSE
    SELECT user_id INTO v_user_id
    FROM public.viewing_sessions
    WHERE id = NEW.viewing_session_id;
  END IF;
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles SET dna_dirty = true, updated_at = now() WHERE id = v_user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reaction_mark_dna_dirty ON public.viewing_session_reactions;
CREATE TRIGGER trg_reaction_mark_dna_dirty
  AFTER INSERT OR DELETE ON public.viewing_session_reactions
  FOR EACH ROW EXECUTE FUNCTION public.mark_dna_dirty_from_reaction();
