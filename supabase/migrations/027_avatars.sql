-- ============================================================
-- Migration 027: Avatares cerrados (selección con DiceBear local)
-- Tabla de avatares fijos + FK en profiles.avatar_id.
-- Solo administración (service_role) puede crear/editar/borrar avatares.
-- Los usuarios solo pueden leer avatares activos y cambiar el avatar_id
-- de su propio perfil.
-- ============================================================

-- Tabla de avatares
CREATE TABLE IF NOT EXISTS public.avatars (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  style TEXT NOT NULL DEFAULT 'avataaars',
  seed TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK en profiles (nullable: el usuario puede no haber elegido ninguno)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_id BIGINT
  REFERENCES public.avatars(id)
  ON DELETE SET NULL;

-- RLS
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- Lectura pública de avatares activos
CREATE POLICY "Active avatars are readable by everyone"
  ON public.avatars FOR SELECT
  USING (is_active = true);

-- CUD restringido: no se crean políticas de INSERT/UPDATE/DELETE para
-- usuarios autenticados. Solo el rol service_role (administración) puede
-- crear/editar/borrar avatares, por lo que quedan admin-only.
-- (No se definen políticas de escritura → denegadas por defecto.)

-- Índice para lookups por slug
CREATE INDEX IF NOT EXISTS avatars_slug_idx ON public.avatars(slug);

-- Sembrado inicial: 24 avatares fijos, estilo avataaars, semillas predefinidas.
INSERT INTO public.avatars (name, slug, style, seed, category, is_active, sort_order)
VALUES
  ('Cine Ícono',            'cine-icono',            'avataaars', 'cinema-icon',  'face', true, 1),
  ('Trama Nocturna',       'trama-nocturna',       'avataaars', 'plot-night',   'face', true, 2),
  ('Remake Solar',         'remake-solar',         'avataaars', 'remake-sun',   'face', true, 3),
  ('Spin Off',             'spin-off',             'avataaars', 'spinoff',      'face', true, 4),
  ('B-Side',               'b-side',               'avataaars', 'b-side',       'face', true, 5),
  ('Corte Final',          'corte-final',          'avataaars', 'final-cut',    'face', true, 6),
  ('Narrativa',            'narrativa',            'avataaars', 'narrativa',    'face', true, 7),
  ('Pixel de Noche',       'pixel-noche',          'avataaars', 'pixel-night',  'face', true, 8),
  ('Doblaje Rápido',       'doblaje-rapido',       'avataaars', 'dub-fast',     'face', true, 9),
  ('Calle de Película',    'calle-pelicula',       'avataaars', 'movie-street', 'face', true, 10),
  ('Cámara Lenta',         'camara-lenta',         'avataaars', 'slow-motion',  'face', true, 11),
  ('Guion de Humo',        'guion-humo',           'avataaars', 'smoke-script', 'face', true, 12),
  ('Mar de Medianoche',    'mar-mediodia',         'avataaars', 'midnight-sea', 'face', true, 13),
  ('Reflejo en Pantalla',  'reflejo-pantalla',     'avataaars', 'screen-reflection', 'face', true, 14),
  ('Apertura en Rosado',   'apertura-rosada',      'avataaars', 'pink-opening', 'face', true, 15),
  ('Créditos Felices',     'creditos-felices',     'avataaars', 'happy-credits', 'face', true, 16),
  ('Sonido en Silencio',   'sonido-silencio',      'avataaars', 'sound-silence', 'face', true, 17),
  ('Luz de Reflector',     'luz-reflector',        'avataaars', 'spotlight',  'face', true, 18),
  ('Escena de Apertura',   'escena-apertura',      'avataaars', 'opening-scene', 'face', true, 19),
  ('Plano Detalle',        'plano-detalle',        'avataaars', 'close-up',   'face', true, 20),
  ('Montaje de Humo',      'montaje-humo',         'avataaars', 'smoke-edit',   'face', true, 21),
  ('Corte Musical',        'corte-musical',        'avataaars', 'musical-cut',  'face', true, 22),
  ('Día de Estreno',       'dia-estreno',          'avataaars', 'premiere-day',  'face', true, 23),
  ('Entrada en Oscuridad', 'entrada-oscuridad',    'avataaars', 'dark-entrance', 'face', true, 24)
ON CONFLICT (slug) DO NOTHING;
