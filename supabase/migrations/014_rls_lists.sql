DROP POLICY IF EXISTS "Public lists viewable for public profiles" ON watchly.lists;
CREATE POLICY "Public lists viewable for public profiles"
  ON watchly.lists FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM watchly.profiles
      WHERE profiles.id = lists.user_id
      AND profiles.is_profile_public = true
    )
  );

DROP POLICY IF EXISTS "Users can view own lists" ON watchly.lists;
CREATE POLICY "Users can view own lists"
  ON watchly.lists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own lists" ON watchly.lists;
CREATE POLICY "Users can manage own lists"
  ON watchly.lists FOR ALL
  USING (auth.uid() = user_id);
