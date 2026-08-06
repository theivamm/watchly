CREATE OR REPLACE FUNCTION public.email_exists(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE auth.users.email = LOWER($1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.email_exists(TEXT) TO anon, authenticated;
