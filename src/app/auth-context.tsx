import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfile, upsertProfile } from "@/services/profile";
import type { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
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

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await getProfile(user.id).catch(() => null);
    setProfile(p);
  };

  useEffect(() => {
    const init = async (u: User | null) => {
      if (u) {
        const p = await ensureProfile(u);
        setProfile(p);
      } else {
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
    <AuthContext.Provider value={{ user, session, loading, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
