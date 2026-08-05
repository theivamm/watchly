CREATE TABLE IF NOT EXISTS watchly.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username CITEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_path TEXT,
  location TEXT,
  website_url TEXT,
  instagram_url TEXT,
  x_url TEXT,
  theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('system', 'dark', 'light')),
  accent_color TEXT NOT NULL DEFAULT 'coral' CHECK (accent_color IN ('coral', 'amber', 'sunset', 'rose', 'violet', 'aqua', 'lime', 'sky')),
  is_profile_public BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
