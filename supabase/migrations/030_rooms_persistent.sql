-- ============================================================
-- Migration 030: Salas persistentes
-- Modelo nuevo: cada sala es permanente, con nombre + color y
-- link fijo. Nunca se "cierra"; solo desaparece con DELETE.
-- ============================================================

-- Color distintivo de la sala (hex al azar al crearla).
ALTER TABLE public.watch_rooms ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#8b5cf6';

-- status pasa a 'open': las salas ya no transicionan a 'ended'.
ALTER TABLE public.watch_rooms DROP CONSTRAINT IF EXISTS watch_rooms_status_check;
ALTER TABLE public.watch_rooms ADD CONSTRAINT watch_rooms_status_check
  CHECK (status IN ('open', 'waiting', 'live', 'ended'));
ALTER TABLE public.watch_rooms ALTER COLUMN status SET DEFAULT 'open';

-- Reabrir cualquier sala existente para el nuevo modelo.
UPDATE public.watch_rooms SET status = 'open', started_at = NULL, ended_at = NULL;

-- ===== watch_rooms RLS =====
-- Cualquier usuario autenticado lee una sala abierta (el link es
-- compartible; el guest recién entra después de leer la sala).
DROP POLICY IF EXISTS "members can read active rooms they belong to" ON public.watch_rooms;
CREATE POLICY "authenticated can read open rooms"
  ON public.watch_rooms FOR SELECT
  USING (status = 'open');

-- INSERT: crear la sala abierta (host + status 'open' + tope 8).
DROP POLICY IF EXISTS "authenticated can create rooms as host" ON public.watch_rooms;
CREATE POLICY "authenticated can create rooms as host"
  ON public.watch_rooms FOR INSERT
  WITH CHECK (
    auth.uid() = host_user_id
    AND status = 'open'
    AND COALESCE(max_participants, 8) = 8
  );

-- DELETE: el host borra su sala (cubre la política FOR ALL del host).
-- (La política "host can read/update own rooms" es FOR ALL y ya aplica.)

-- ===== watch_room_members RLS =====
-- Guest auto-join solo en salas abiertas.
DROP POLICY IF EXISTS "joinable membership insert" ON public.watch_room_members;
CREATE POLICY "joinable membership insert"
  ON public.watch_room_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watch_rooms r
      WHERE r.id = watch_room_members.room_id AND r.host_user_id = auth.uid()
    )
    OR (
      auth.uid() = watch_room_members.user_id
      AND watch_room_members.role = 'guest'
      AND watch_room_members.removed_at IS NULL
      AND EXISTS (
        SELECT 1 FROM public.watch_rooms r
        WHERE r.id = watch_room_members.room_id AND r.status = 'open'
      )
    )
  );

-- SELECT: ver TODOS los participantes de una sala a la que pertenezco
-- (lista de participantes + realtime para kick).
DROP POLICY IF EXISTS "members read room participants" ON public.watch_room_members;
CREATE POLICY "members read room participants"
  ON public.watch_room_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watch_room_members m2
      WHERE m2.room_id = watch_room_members.room_id
        AND m2.user_id = auth.uid()
        AND m2.removed_at IS NULL
    )
  );

-- Realtime: publicar cambios de ambas tablas (borrado de sala / kick
-- llegan a los clientes conectados).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'watch_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_rooms;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'watch_room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_room_members;
  END IF;
END $$;
