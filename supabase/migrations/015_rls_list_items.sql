DROP POLICY IF EXISTS "Public list items viewable for public profiles" ON watchly.list_items;
CREATE POLICY "Public list items viewable for public profiles"
  ON watchly.list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM watchly.lists
      WHERE lists.id = list_items.list_id
      AND lists.is_public = true
      AND EXISTS (
        SELECT 1 FROM watchly.profiles
        WHERE profiles.id = lists.user_id
        AND profiles.is_profile_public = true
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage own list items" ON watchly.list_items;
CREATE POLICY "Users can manage own list items"
  ON watchly.list_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM watchly.lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );
