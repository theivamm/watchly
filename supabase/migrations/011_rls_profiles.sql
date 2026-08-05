DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON watchly.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON watchly.profiles FOR SELECT
  USING (is_profile_public = true OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON watchly.profiles;
CREATE POLICY "Users can update own profile"
  ON watchly.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON watchly.profiles;
CREATE POLICY "Users can insert own profile"
  ON watchly.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
