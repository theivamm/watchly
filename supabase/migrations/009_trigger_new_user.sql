CREATE OR REPLACE FUNCTION watchly.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO watchly.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    LOWER(SUBSTRING(NEW.id::TEXT, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION watchly.handle_new_user();
