DROP POLICY IF EXISTS "Media is viewable by everyone" ON watchly.media;
CREATE POLICY "Media is viewable by everyone"
  ON watchly.media FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert media" ON watchly.media;
CREATE POLICY "Authenticated users can insert media"
  ON watchly.media FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
