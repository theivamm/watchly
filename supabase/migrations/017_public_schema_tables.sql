-- ============================================================
-- Migration 017: Public schema tables for the app frontend
-- The previous migrations created tables in the `watchly`
-- schema which is NOT exposed to the REST API. This migration
-- creates the tables the frontend services expect, in `public`.
-- ============================================================

-- profiles ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT,
  avatar_path TEXT,
  location TEXT,
  website_url TEXT,
  instagram_url TEXT,
  x_url TEXT,
  theme_preference TEXT NOT NULL DEFAULT 'dark',
  accent_color TEXT NOT NULL DEFAULT 'coral',
  is_profile_public BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- entries (user library) --------------------------------------
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL DEFAULT '',
  poster_path TEXT,
  status TEXT NOT NULL DEFAULT 'want_to_watch'
    CHECK (status IN ('want_to_watch', 'watching', 'completed', 'paused', 'dropped')),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  progress JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  start_date DATE,
  finish_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tmdb_id, media_type)
);

-- lists --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- list_items ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, tmdb_id, media_type)
);

-- RLS -----------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;
CREATE POLICY "Public profiles viewable"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- entries policies
DROP POLICY IF EXISTS "Users view own entries" ON public.entries;
CREATE POLICY "Users view own entries"
  ON public.entries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own entries" ON public.entries;
CREATE POLICY "Users insert own entries"
  ON public.entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own entries" ON public.entries;
CREATE POLICY "Users update own entries"
  ON public.entries FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own entries" ON public.entries;
CREATE POLICY "Users delete own entries"
  ON public.entries FOR DELETE
  USING (auth.uid() = user_id);

-- lists policies
DROP POLICY IF EXISTS "Users view own lists" ON public.lists;
CREATE POLICY "Users view own lists"
  ON public.lists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own lists" ON public.lists;
CREATE POLICY "Users insert own lists"
  ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own lists" ON public.lists;
CREATE POLICY "Users update own lists"
  ON public.lists FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own lists" ON public.lists;
CREATE POLICY "Users delete own lists"
  ON public.lists FOR DELETE
  USING (auth.uid() = user_id);

-- list_items policies
DROP POLICY IF EXISTS "Users view own list items" ON public.list_items;
CREATE POLICY "Users view own list items"
  ON public.list_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users insert own list items" ON public.list_items;
CREATE POLICY "Users insert own list items"
  ON public.list_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users update own list items" ON public.list_items;
CREATE POLICY "Users update own list items"
  ON public.list_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users delete own list items" ON public.list_items;
CREATE POLICY "Users delete own list items"
  ON public.list_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.user_id = auth.uid()
  ));
