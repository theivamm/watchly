-- ============================================================
-- Migration 026: ADN audiovisual Fase 3 - contexto de consumo
-- 1) Ampliar public.user_dna con agregados de sesiones y
--    reacciones (aditivo: no elimina ni renombra columnas).
-- 2) algorithm_version INTEGER -> NUMERIC para soportar 1.1.x
-- ============================================================

-- 1) Nuevas columnas de contexto --------------------------------
ALTER TABLE public.user_dna
  ADD COLUMN IF NOT EXISTS venue_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS time_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS companionship_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS language_mode_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS platform_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reaction_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rewatch_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS context_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS context_coverage JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2) algorithm_version a NUMERIC (1.1) ---------------------------
ALTER TABLE public.user_dna ALTER COLUMN algorithm_version TYPE NUMERIC;
