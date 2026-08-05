CREATE OR REPLACE FUNCTION watchly.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON watchly.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON watchly.profiles
  FOR EACH ROW EXECUTE FUNCTION watchly.handle_updated_at();

DROP TRIGGER IF EXISTS set_media_updated_at ON watchly.media;
CREATE TRIGGER set_media_updated_at
  BEFORE UPDATE ON watchly.media
  FOR EACH ROW EXECUTE FUNCTION watchly.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_media_updated_at ON watchly.user_media;
CREATE TRIGGER set_user_media_updated_at
  BEFORE UPDATE ON watchly.user_media
  FOR EACH ROW EXECUTE FUNCTION watchly.handle_updated_at();

DROP TRIGGER IF EXISTS set_lists_updated_at ON watchly.lists;
CREATE TRIGGER set_lists_updated_at
  BEFORE UPDATE ON watchly.lists
  FOR EACH ROW EXECUTE FUNCTION watchly.handle_updated_at();
