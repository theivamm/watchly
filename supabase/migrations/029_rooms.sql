-- ============================================================
-- Migration 029: Salas de visualización (watch_rooms / members)
-- Aditiva: no modifica tablas existentes (salvo FK a auth.users).
-- ============================================================

-- Un usuario autenticado crea una sala y es host. Invitados entran con
-- invite_code. La imagen/audio del host via LiveKit (tokens emitidos por
-- la Edge Function room-token; los secretos NUNCA viven en la base).
CREATE TABLE IF NOT EXISTS public.watch_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi sala',
  invite_code TEXT NOT NULL UNIQUE,
  livekit_room_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'live', 'ended')),
  max_participants INTEGER NOT NULL DEFAULT 8 CHECK (max_participants >= 2 AND max_participants <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Miembros conectados a cada sala. Un usuario puede ser host o guest.
-- removed_at permite "expulsar sin borrado físico" para bloquear reingreso.
CREATE TABLE IF NOT EXISTS public.watch_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.watch_rooms (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('host', 'guest')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  UNIQUE (room_id, user_id)
);

-- Índices para lookups frecuentes.
CREATE INDEX IF NOT EXISTS watch_rooms_host_idx ON public.watch_rooms (host_user_id);
CREATE INDEX IF NOT EXISTS watch_rooms_status_idx ON public.watch_rooms (status);
CREATE INDEX IF NOT EXISTS watch_room_members_room_idx ON public.watch_room_members (room_id);
CREATE INDEX IF NOT EXISTS watch_room_members_user_idx ON public.watch_room_members (user_id);

-- RLS
ALTER TABLE public.watch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_room_members ENABLE ROW LEVEL SECURITY;

-- ===== watch_rooms policies =====
-- El host ve/edita su sala; los invitados sólo leen una sala viva a la que
-- pertenecen; admin (service_role) gestiona todo.
DROP POLICY IF EXISTS "host can read/update own rooms" ON public.watch_rooms;
DROP POLICY IF EXISTS "members can read active rooms they belong to" ON public.watch_rooms;
DROP POLICY IF EXISTS "authenticated can create rooms as host" ON public.watch_rooms;
DROP POLICY IF EXISTS "host can update status/participants on own room" ON public.watch_rooms;

CREATE POLICY "host can read/update own rooms"
  ON public.watch_rooms FOR ALL
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "members can read active rooms they belong to"
  ON public.watch_rooms FOR SELECT
  USING (
    status IN ('waiting', 'live')
    AND EXISTS (
      SELECT 1 FROM public.watch_room_members m
      WHERE m.room_id = watch_rooms.id
        AND m.user_id = auth.uid()
        AND m.removed_at IS NULL
        AND m.left_at IS NULL
    )
  );

CREATE POLICY "authenticated can create rooms as host"
  ON public.watch_rooms FOR INSERT
  WITH CHECK (
    auth.uid() = host_user_id
    AND status = 'waiting'
    AND COALESCE(max_participants, 8) = 8
  );

CREATE POLICY "host can update status/participants on own room"
  ON public.watch_rooms FOR UPDATE
  USING (auth.uid() = host_user_id);

-- ===== watch_room_members policies =====
DROP POLICY IF EXISTS "members read own memberships" ON public.watch_room_members;
DROP POLICY IF EXISTS "joinable membership insert" ON public.watch_room_members;
DROP POLICY IF EXISTS "self set left_at" ON public.watch_room_members;
DROP POLICY IF EXISTS "host removes members" ON public.watch_room_members;

-- Un miembro ve su propia fila.
CREATE POLICY "members read own memberships"
  ON public.watch_room_members FOR SELECT
  USING (user_id = auth.uid());

-- El host inserta members. Guest autoinsert solo al unirse a una sala
-- waiting/live donde no es miembro aún y no está expulsado.
CREATE POLICY "joinable membership insert"
  ON public.watch_room_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watch_rooms r
      WHERE r.id = watch_room_members.room_id
        AND r.host_user_id = auth.uid()
    )
    OR (
      auth.uid() = watch_room_members.user_id
      AND watch_room_members.role = 'guest'
      AND watch_room_members.removed_at IS NULL
      AND EXISTS (
        SELECT 1 FROM public.watch_rooms r
        WHERE r.id = watch_room_members.room_id
          AND r.status IN ('waiting', 'live')
      )
    )
  );

-- El propio miembro marca left_at al salir.
CREATE POLICY "self set left_at"
  ON public.watch_room_members FOR UPDATE
  USING (user_id = auth.uid());

-- El host puede expulsar (set removed_at/left_at) de su sala.
CREATE POLICY "host removes members"
  ON public.watch_room_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.watch_rooms r
      WHERE r.id = watch_room_members.room_id AND r.host_user_id = auth.uid()
    )
  );
