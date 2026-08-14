-- ============================================================
-- Migration 032: Fix RLS "infinite recursion" en watch_room_members.
--
-- La política "members read room participants" consultaba la misma
-- tabla dentro del USING() -> recursión infinita. Se reemplaza por
-- un helper SECURITY DEFINER que solo devuelve un booleano de
-- membresía (bypasea RLS sin filtrar datos).
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_room_member(room_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.watch_room_members m
    WHERE m.room_id = is_room_member.room_id
      AND m.user_id = is_room_member.user_id
      AND m.removed_at IS NULL
  );
$$;

DROP POLICY IF EXISTS "members read room participants" ON public.watch_room_members;
CREATE POLICY "members read room participants"
  ON public.watch_room_members FOR SELECT
  USING (public.is_room_member(watch_room_members.room_id, auth.uid()));
