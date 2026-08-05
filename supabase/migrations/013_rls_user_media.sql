DROP POLICY IF EXISTS "Public user_media viewable for public profiles" ON watchly.user_media;
CREATE POLICY "Public user_media viewable for public profiles"
  ON watchly.user_media FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM watchly.profiles
      WHERE profiles.id = user_media.user_id
      AND profiles.is_profile_public = true
    )
  );

DROP POLICY IF EXISTS "Users can view own user_media" ON watchly.user_media;
CREATE POLICY "Users can view own user_media"
  ON watchly.user_media FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_media" ON watchly.user_media;
CREATE POLICY "Users can insert own user_media"
  ON watchly.user_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_media" ON watchly.user_media;
CREATE POLICY "Users can update own user_media"
  ON watchly.user_media FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own user_media" ON watchly.user_media;
CREATE POLICY "Users can delete own user_media"
  ON watchly.user_media FOR DELETE
  USING (auth.uid() = user_id);
