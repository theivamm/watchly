-- ============================================================
-- Migration 035: el super admin puede eliminar usuarios.
-- Borrar de auth.users elimina en cascada perfil, biblioteca,
-- listas, sesiones y ADN. No permite borrarse a sí mismo ni a
-- otros admins (hay que sacarlos de public.admins primero).
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_delete_user(target UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'No podés eliminar tu propia cuenta desde el panel.' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = target) THEN
    RAISE EXCEPTION 'No se puede eliminar a otro admin.' USING ERRCODE = 'P0001';
  END IF;
  DELETE FROM auth.users WHERE id = target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El usuario no existe.' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
