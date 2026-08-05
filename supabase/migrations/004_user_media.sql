CREATE TABLE IF NOT EXISTS watchly.user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES watchly.media(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'watchlist' CHECK (status IN ('watchlist', 'watching', 'completed', 'paused', 'dropped')),
  rating NUMERIC(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
  review TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  current_season INTEGER,
  current_episode INTEGER,
  started_at DATE,
  finished_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id)
);
