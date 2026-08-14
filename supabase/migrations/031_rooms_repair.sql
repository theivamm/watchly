-- ============================================================
-- Migration 031: Reparación idempotente del modelo de salas
-- persistentes. Vuelve a aplicar todo el setup de 030 sin
-- importar en qué punto se haya interrumpido la ejecución.
-- Se puede correr varias veces sin error.
-- ============================================================

-- 1) Color distintivo de cada sala.
ALTER TABLE public.watch_rooms ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#8b5cf6';

-- 2) Constraint de status que admita 'open' (y default 'open').
ALTER TABLE public.watch_rooms DROP CONSTRAINT IF EXISTS watch_rooms_status_check;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watch_rooms_status_check' AND conrelid = 'public.watch_rooms'::regclass
  ) THEN
    ALTER TABLE public.watch_rooms ADD CONSTRAINT watch_rooms_status_check
      CHECK (status IN ('open', 'waiting', 'live', 'ended'));
  END IF;
END $$;
ALTER TABLE public.watch_rooms ALTER COLUMN status SET DEFAULT 'open';

-- 3) Reabrir cualquier sala existente.
UPDATE public.watch_rooms SET status = 'open', started_at = NULL, ended_at = NULL;

-- 4) RLS watch_rooms: cualquier autenticado lee salas abiertas; INSERT host 'open'.
DROP POLICY IF EXISTS "members can read active rooms they belong to" ON public.watch_rooms;
DROP POLICY IF EXISTS "authenticated can read open rooms" ON public.watch_rooms;
CREATE POLICY "authenticated can read open rooms"
  ON public.watch_rooms FOR SELECT
  USING (status = 'open');

DROP POLICY IF EXISTS "authenticated can create rooms as host" ON public.watch_rooms;
CREATE POLICY "authenticated can create rooms as host"
  ON public.watch_rooms FOR INSERT
  WITH CHECK (
    auth.uid() = host_user_id
    AND status = 'open'
    AND COALESCE(max_participants, 8) = 8
  );

-- 5) RLS watch_room_members: join en salas abiertas + leer participantes.
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

-- 6) Realtime publicando cambios en ambas tablas.
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
