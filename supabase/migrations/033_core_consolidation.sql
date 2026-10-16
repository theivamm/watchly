-- ============================================================
-- Migration 033: Consolidación del núcleo.
--  1. Las salas abiertas (con su invite_code) eran legibles sin sesión.
--  2. Analítica base propia (solo inserción desde el cliente).
--  3. Registro de errores del frontend (solo inserción desde el cliente).
-- Ambas tablas se consultan desde el dashboard / service role.
-- ============================================================

-- 1. Salas: solo usuarios con sesión.
DROP POLICY IF EXISTS "authenticated can read open rooms" ON public.watch_rooms;
CREATE POLICY "authenticated can read open rooms"
  ON public.watch_rooms FOR SELECT
  TO authenticated
  USING (status = 'open');

-- 2. Analítica.
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid(),
  session_id TEXT,
  event TEXT NOT NULL CHECK (char_length(event) BETWEEN 1 AND 64),
  props JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(props) <= 4096),
  path TEXT CHECK (char_length(path) <= 512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_event_created_idx ON public.analytics_events (event, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON public.analytics_events (user_id, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can insert own events" ON public.analytics_events;
CREATE POLICY "anyone can insert own events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 3. Errores del frontend.
CREATE TABLE IF NOT EXISTS public.client_errors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid(),
  session_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('window', 'promise', 'react', 'api')),
  message TEXT NOT NULL CHECK (char_length(message) <= 1000),
  stack TEXT CHECK (char_length(stack) <= 4000),
  path TEXT CHECK (char_length(path) <= 512),
  user_agent TEXT CHECK (char_length(user_agent) <= 400),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_errors_created_idx ON public.client_errors (created_at DESC);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can insert own errors" ON public.client_errors;
CREATE POLICY "anyone can insert own errors"
  ON public.client_errors FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Embudo de activación (consultar desde el SQL editor).
CREATE OR REPLACE VIEW public.activation_funnel
WITH (security_invoker = true) AS
SELECT
  date_trunc('week', u.created_at)::date AS semana,
  count(*) AS registros,
  count(*) FILTER (WHERE p.onboarding_completed) AS onboarding_completo,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.entries e WHERE e.user_id = u.id)) AS primer_titulo
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
GROUP BY 1
ORDER BY 1 DESC;
REVOKE ALL ON public.activation_funnel FROM anon, authenticated;
