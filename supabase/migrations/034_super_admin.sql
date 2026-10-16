-- ============================================================
-- Migration 034: Super admin.
-- Tabla de admins sin políticas (nadie la lee desde el cliente) +
-- funciones SECURITY DEFINER que verifican is_admin() antes de
-- devolver datos agregados de toda la app.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()); $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Errores: marcar como resueltos.
ALTER TABLE public.client_errors ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "admins read events" ON public.analytics_events;
CREATE POLICY "admins read events" ON public.analytics_events
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins read errors" ON public.client_errors;
CREATE POLICY "admins read errors" ON public.client_errors
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins resolve errors" ON public.client_errors;
CREATE POLICY "admins resolve errors" ON public.client_errors
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Resumen ----------
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN json_build_object(
    'users_total',      (SELECT count(*) FROM auth.users),
    'users_7d',         (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
    'users_confirmed',  (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'active_7d',        (SELECT count(DISTINCT user_id) FROM (
                           SELECT user_id FROM public.analytics_events WHERE created_at > now() - interval '7 days' AND user_id IS NOT NULL
                           UNION SELECT user_id FROM public.entries WHERE updated_at > now() - interval '7 days'
                         ) a),
    'onboarded',        (SELECT count(*) FROM public.profiles WHERE onboarding_completed),
    'with_titles',      (SELECT count(DISTINCT user_id) FROM public.entries),
    'entries_total',    (SELECT count(*) FROM public.entries),
    'lists_total',      (SELECT count(*) FROM public.lists),
    'sessions_total',   (SELECT count(*) FROM public.viewing_sessions),
    'dna_total',        (SELECT count(*) FROM public.user_dna),
    'searches_7d',      (SELECT count(*) FROM public.analytics_events WHERE event = 'search' AND created_at > now() - interval '7 days'),
    'search_ms_p50_7d', (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY (props->>'ms')::numeric)
                           FROM public.analytics_events WHERE event = 'search' AND created_at > now() - interval '7 days'),
    'write_fail_7d',    (SELECT count(*) FROM public.analytics_events WHERE event = 'library_write_failed' AND created_at > now() - interval '7 days'),
    'library_add_7d',   (SELECT count(*) FROM public.analytics_events WHERE event = 'library_add' AND created_at > now() - interval '7 days'),
    'errors_24h',       (SELECT count(*) FROM public.client_errors WHERE created_at > now() - interval '24 hours'),
    'errors_open',      (SELECT count(DISTINCT message) FROM public.client_errors WHERE resolved_at IS NULL)
  );
END;
$$;

-- ---------- Actividad diaria ----------
CREATE OR REPLACE FUNCTION public.admin_daily(days INT DEFAULT 30)
RETURNS TABLE (day DATE, signups BIGINT, active_users BIGINT, titles_added BIGINT, errors BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT d::date,
    (SELECT count(*) FROM auth.users u WHERE u.created_at::date = d::date),
    (SELECT count(DISTINCT x.uid) FROM (
       SELECT e.user_id AS uid FROM public.analytics_events e WHERE e.created_at::date = d::date AND e.user_id IS NOT NULL
       UNION SELECT en.user_id FROM public.entries en WHERE en.updated_at::date = d::date
     ) x),
    (SELECT count(*) FROM public.entries en WHERE en.created_at::date = d::date),
    (SELECT count(*) FROM public.client_errors c WHERE c.created_at::date = d::date)
  FROM generate_series(current_date - (LEAST(GREATEST(days, 1), 180) - 1), current_date, interval '1 day') d
  ORDER BY 1;
END;
$$;

-- ---------- Embudo semanal ----------
CREATE OR REPLACE FUNCTION public.admin_funnel()
RETURNS TABLE (week DATE, signups BIGINT, onboarded BIGINT, first_title BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT date_trunc('week', u.created_at)::date,
    count(*),
    count(*) FILTER (WHERE p.onboarding_completed),
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.entries e WHERE e.user_id = u.id))
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  GROUP BY 1 ORDER BY 1 DESC LIMIT 12;
END;
$$;

-- ---------- Usuarios ----------
CREATE OR REPLACE FUNCTION public.admin_users(q TEXT DEFAULT '', lim INT DEFAULT 100)
RETURNS TABLE (
  id UUID, email TEXT, created_at TIMESTAMPTZ, last_sign_in_at TIMESTAMPTZ, confirmed BOOLEAN,
  provider TEXT, username TEXT, display_name TEXT, entries BIGINT, has_dna BOOLEAN, is_admin BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at IS NOT NULL,
    COALESCE(u.raw_app_meta_data->>'provider', 'email'),
    p.username, p.display_name,
    (SELECT count(*) FROM public.entries e WHERE e.user_id = u.id),
    EXISTS (SELECT 1 FROM public.user_dna d WHERE d.user_id = u.id),
    EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = u.id)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE q = '' OR u.email ILIKE '%' || q || '%' OR p.username ILIKE '%' || q || '%' OR p.display_name ILIKE '%' || q || '%'
  ORDER BY u.created_at DESC
  LIMIT LEAST(GREATEST(lim, 1), 500);
END;
$$;

-- ---------- Eventos más frecuentes ----------
CREATE OR REPLACE FUNCTION public.admin_top_events(days INT DEFAULT 7)
RETURNS TABLE (event TEXT, total BIGINT, users BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT e.event, count(*), count(DISTINCT e.user_id)
  FROM public.analytics_events e
  WHERE e.created_at > now() - make_interval(days => LEAST(GREATEST(days, 1), 180))
  GROUP BY 1 ORDER BY 2 DESC;
END;
$$;

DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY['admin_overview()', 'admin_daily(int)', 'admin_funnel()', 'admin_users(text,int)', 'admin_top_events(int)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

-- La vista de 033 queda reemplazada por admin_funnel().
DROP VIEW IF EXISTS public.activation_funnel;

-- Primer super admin.
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'mauroivanmedel@gmail.com'
ON CONFLICT DO NOTHING;
