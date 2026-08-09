-- ============================================================
-- Migration 027: Avatares cerrados (imágenes estáticas)
-- Tabla de avatares fijos + FK en profiles.avatar_id.
-- Solo administración (service_role) puede crear/editar/borrar avatares.
-- Los usuarios solo pueden leer avatares activos y cambiar el avatar_id
-- de su propio perfil. Las imágenes son archivos estáticos bajo
-- src/assets/avatar/ importados por Vite; el cliente resuelve avatar_id
-- -> imagen por un registro local (image_url=NULL en la base).
-- ============================================================

-- Tabla de avatares
CREATE TABLE IF NOT EXISTS public.avatars (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  style TEXT NOT NULL DEFAULT 'static',
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
DROP POLICY IF EXISTS "Active avatars are readable by everyone" ON public.avatars;
CREATE POLICY "Active avatars are readable by everyone"
  ON public.avatars FOR SELECT
  USING (is_active = true);

-- CUD restringido: no se crean políticas de INSERT/UPDATE/DELETE para
-- usuarios autenticados. Solo el rol service_role (administración) puede
-- crear/editar/borrar avatares, por lo que quedan admin-only.
-- (No se definen políticas de escritura → denegadas por defecto.)

-- Índice para lookups por slug
CREATE INDEX IF NOT EXISTS avatars_slug_idx ON public.avatars(slug);

-- Sembrado expandido: 40 avatares estáticos (ids 1..40) mapeados a src/assets/avatar.
INSERT INTO public.avatars (id, name, slug, style, seed, image_url, category, is_active, sort_order)
VALUES
  (1, 'El quimico', 'av-01-el-quimico', 'static', 'av-01-el-quimico', NULL, 'face', true, 1)
  (2, 'El companero ansioso', 'av-02-el-companero-ansioso', 'static', 'av-02-el-companero-ansioso', NULL, 'face', true, 2)
  (3, 'El sheriff no muerto', 'av-03-el-sheriff-no-muerto', 'static', 'av-03-el-sheriff-no-muerto', NULL, 'face', true, 3)
  (4, 'La vidente gotica', 'av-04-la-vidente-gotica', 'static', 'av-04-la-vidente-gotica', NULL, 'face', true, 4)
  (5, 'El estratega rojo', 'av-05-el-estratega-rojo', 'static', 'av-05-el-estratega-rojo', NULL, 'face', true, 5)
  (6, 'El elegido', 'av-06-el-elegido', 'static', 'av-06-el-elegido', NULL, 'face', true, 6)
  (7, 'El pirata bromista', 'av-07-el-pirata-bromista', 'static', 'av-07-el-pirata-bromista', NULL, 'face', true, 7)
  (8, 'El arquitecto de suenos', 'av-08-el-arquitecto-de-suenos', 'static', 'av-08-el-arquitecto-de-suenos', NULL, 'face', true, 8)
  (9, 'La nina psiquica', 'av-09-la-nina-psiquica', 'static', 'av-09-la-nina-psiquica', NULL, 'face', true, 9)
  (10, 'La diplomatica galactica', 'av-10-la-diplomatica-galactica', 'static', 'av-10-la-diplomatica-galactica', NULL, 'face', true, 10)
  (11, 'La novia samurai', 'av-11-la-novia-samurai', 'static', 'av-11-la-novia-samurai', NULL, 'face', true, 11)
  (12, 'El profesor de reliquias', 'av-12-el-profesor-de-reliquias', 'static', 'av-12-el-profesor-de-reliquias', NULL, 'face', true, 12)
  (13, 'La investigadora esceptica', 'av-13-la-investigadora-esceptica', 'static', 'av-13-la-investigadora-esceptica', NULL, 'face', true, 13)
  (14, 'El creyente paranormal', 'av-14-el-creyente-paranormal', 'static', 'av-14-el-creyente-paranormal', NULL, 'face', true, 14)
  (15, 'La forma silenciosa', 'av-15-la-forma-silenciosa', 'static', 'av-15-la-forma-silenciosa', NULL, 'face', true, 15)
  (16, 'El showman de pesadillas', 'av-16-el-showman-de-pesadillas', 'static', 'av-16-el-showman-de-pesadillas', NULL, 'face', true, 16)
  (17, 'El cazador de la jungla', 'av-17-el-cazador-de-la-jungla', 'static', 'av-17-el-cazador-de-la-jungla', NULL, 'face', true, 17)
  (18, 'El guardian del futuro', 'av-18-el-guardian-del-futuro', 'static', 'av-18-el-guardian-del-futuro', NULL, 'face', true, 18)
  (19, 'El boxeador', 'av-19-el-boxeador', 'static', 'av-19-el-boxeador', NULL, 'face', true, 19)
  (20, 'El patriarca', 'av-20-el-patriarca', 'static', 'av-20-el-patriarca', NULL, 'face', true, 20)
  (21, 'El estudiante de magia', 'av-21-el-estudiante-de-magia', 'static', 'av-21-el-estudiante-de-magia', NULL, 'face', true, 21)
  (22, 'El arquero plateado', 'av-22-el-arquero-plateado', 'static', 'av-22-el-arquero-plateado', NULL, 'face', true, 22)
  (23, 'El portador del anillo', 'av-23-el-portador-del-anillo', 'static', 'av-23-el-portador-del-anillo', NULL, 'face', true, 23)
  (24, 'La monarca de dragones', 'av-24-la-monarca-de-dragones', 'static', 'av-24-la-monarca-de-dragones', NULL, 'face', true, 24)
  (25, 'El heredero del norte', 'av-25-el-heredero-del-norte', 'static', 'av-25-el-heredero-del-norte', NULL, 'face', true, 25)
  (26, 'El aprendiz de quimica', 'av-26-el-aprendiz-de-quimica', 'static', 'av-26-el-aprendiz-de-quimica', NULL, 'face', true, 26)
  (27, 'El abogado colorido', 'av-27-el-abogado-colorido', 'static', 'av-27-el-abogado-colorido', NULL, 'face', true, 27)
  (28, 'El jefe de oficina', 'av-28-el-jefe-de-oficina', 'static', 'av-28-el-jefe-de-oficina', NULL, 'face', true, 28)
  (29, 'La fashionista del cafe', 'av-29-la-fashionista-del-cafe', 'static', 'av-29-la-fashionista-del-cafe', NULL, 'face', true, 29)
  (30, 'El doctor de la isla', 'av-30-el-doctor-de-la-isla', 'static', 'av-30-el-doctor-de-la-isla', NULL, 'face', true, 30)
  (31, 'La tirana de la moda', 'av-31-la-tirana-de-la-moda', 'static', 'av-31-la-tirana-de-la-moda', NULL, 'face', true, 31)
  (32, 'La fisica perfecta', 'av-32-la-fisica-perfecta', 'static', 'av-32-la-fisica-perfecta', NULL, 'face', true, 32)
  (33, 'El capitan sin escudo', 'av-33-el-capitan-sin-escudo', 'static', 'av-33-el-capitan-sin-escudo', NULL, 'face', true, 33)
  (34, 'El inventor armado', 'av-34-el-inventor-armado', 'static', 'av-34-el-inventor-armado', NULL, 'face', true, 34)
  (35, 'El gigante verde', 'av-35-el-gigante-verde', 'static', 'av-35-el-gigante-verde', NULL, 'face', true, 35)
  (36, 'El principe de la tormenta', 'av-36-el-principe-de-la-tormenta', 'static', 'av-36-el-principe-de-la-tormenta', NULL, 'face', true, 36)
  (37, 'El filosofo azul', 'av-37-el-filosofo-azul', 'static', 'av-37-el-filosofo-azul', NULL, 'face', true, 37)
  (38, 'El velocista escarlata', 'av-38-el-velocista-escarlata', 'static', 'av-38-el-velocista-escarlata', NULL, 'face', true, 38)
  (39, 'El heredero del oceano', 'av-39-el-heredero-del-oceano', 'static', 'av-39-el-heredero-del-oceano', NULL, 'face', true, 39)
  (40, 'La bruja de la realidad', 'av-40-la-bruja-de-la-realidad', 'static', 'av-40-la-bruja-de-la-realidad', NULL, 'face', true, 40)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      style = 'static',
      seed = EXCLUDED.seed,
      image_url = EXCLUDED.image_url,
      category = EXCLUDED.category,
      is_active = true,
      sort_order = EXCLUDED.sort_order;
