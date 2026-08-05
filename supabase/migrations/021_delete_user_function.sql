CREATE OR REPLACE FUNCTION watchly.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE auth.users.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
