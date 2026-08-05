DROP POLICY IF EXISTS "Public featured media viewable for public profiles" ON watchly.profile_featured_media;
CREATE POLICY "Public featured media viewable for public profiles"
  ON watchly.profile_featured_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM watchly.profiles
      WHERE profiles.id = profile_featured_media.user_id
      AND profiles.is_profile_public = true
    )
  );

DROP POLICY IF EXISTS "Users can manage own featured media" ON watchly.profile_featured_media;
CREATE POLICY "Users can manage own featured media"
  ON watchly.profile_featured_media FOR ALL
  USING (auth.uid() = user_id);
