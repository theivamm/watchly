-- ============================================================
-- Migration 018: Public profile support
-- Allow anonymous visitors to read public lists and their items
-- so public profiles can be shared and viewed by anyone.
-- ============================================================

DROP POLICY IF EXISTS "Public lists viewable" ON public.lists;
CREATE POLICY "Public lists viewable"
  ON public.lists FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Public list items viewable" ON public.list_items;
CREATE POLICY "Public list items viewable"
  ON public.list_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lists l
    WHERE l.id = list_id AND l.is_public = true
  ));
