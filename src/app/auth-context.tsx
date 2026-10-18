import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfile, upsertProfile } from "@/services/profile";
import type { Profile } from "@/types";
import { checkIsAdmin } from "@/services/admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isAdmin: false,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function autoUsername(email: string): string {
  const base = (email.split("@")[0] || "cinefilo")
    .replace(/[^a-zA-Z0-9_.]/g, "")
    .toLowerCase()
    .slice(0, 18);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "cinefilo"}${suffix}`;
}

async function ensureProfile(user: User): Promise<Profile | null> {
  const existing = await getProfile(user.id).catch(() => null);
  if (existing) return existing;

  const email = user.email || user.id;
  const created = await upsertProfile({
    id: user.id,
    username: autoUsername(email),
    display_name: (email.split("@")[0] || "Usuario")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .slice(0, 20) || "Usuario",
    bio: null,
    avatar_path: null,
    location: null,
    website_url: null,
    instagram_url: null,
    x_url: null,
    theme_preference: "dark",
    accent_color: "violet",
    is_profile_public: true,
    onboarding_completed: false,
  }).catch(() => null);

  return created;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    checkIsAdmin().then((v) => { if (!cancelled) setIsAdmin(v); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Varias cargas del perfil pueden estar en vuelo a la vez (inicio, renovación de sesión, foco
  // de la pestaña, guardado). Solo aplica la más reciente: si no, una respuesta vieja que llega
  // tarde pisa lo que el usuario acaba de guardar.
  const profileSeq = useRef(0);
  const loadProfile = async (load: () => Promise<Profile | null>) => {
    const id = ++profileSeq.current;
    const p = await load().catch(() => null);
    if (id === profileSeq.current) setProfile(p);
    return p;
  };

  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      profileSeq.current++;
      setProfile(null);
      return;
    }
    let cancelled = false;
    loadProfile(() => getProfile(userId));

    // Realtime: refleja cambios de perfil (p. ej. avatar_id) sin recargar.
    const channel = supabase
      .channel(`public:profiles:id=eq.${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          if (cancelled) return;
          profileSeq.current++;
          setProfile((prev) => {
            const next = { ...(prev ?? null), ...(payload.new as Partial<Profile>) } as Profile | null;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const refreshProfile = async () => {
    if (!user) {
      profileSeq.current++;
      setProfile(null);
      return;
    }
    await loadProfile(() => getProfile(user.id));
  };

  useEffect(() => {
    // Supabase emite eventos al renovar el token o al volver a la pestaña; con el mismo usuario
    // no hace falta recargar ni "asegurar" el perfil otra vez.
    // `undefined` = todavía no se resolvió la sesión; `null` = sin sesión. Distinguirlos es clave:
    // si no, sin sesión se saltea la primera carga y `loading` nunca pasa a false.
    let lastUserId: string | null | undefined = undefined;
    const init = async (u: User | null) => {
      const id = u?.id ?? null;
      if (id === lastUserId) return;
      lastUserId = id;
      if (u) {
        await loadProfile(() => ensureProfile(u));
      } else {
        profileSeq.current++;
        setProfile(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      return init(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      init(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
