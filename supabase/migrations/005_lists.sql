CREATE TABLE IF NOT EXISTS watchly.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_media_id UUID REFERENCES watchly.media(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_ranked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE TABLE IF NOT EXISTS watchly.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES watchly.lists(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES watchly.media(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, media_id)
);
