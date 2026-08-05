import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Share2, Check, MapPin, Globe, Aperture, X, Lock, Film, List as ListIcon,
  ArrowLeft, Clapperboard, Sparkles, Star, LayoutGrid, Tv, BookOpen, Eye,
} from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getProfileByUsername, getProfileLink } from "@/services/profile";
import { getPublicLists } from "@/services/lists";
import { getPublicLibrary } from "@/services/library";
import MediaCard from "@/components/media/MediaCard";
import SavePromptModal from "@/components/media/SavePromptModal";
import type { Profile, List, Entry, EntryStatus } from "@/types";

type Section = "resumen" | "quierover" | "peliculas" | "series" | "listas";

const STATUS_FILTERS: { value: EntryStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "want_to_watch", label: "Quiero ver" },
  { value: "watching", label: "Viendo" },
  { value: "completed", label: "Completados" },
  { value: "paused", label: "Pausados" },
  { value: "dropped", label: "Abandonados" },
];

const STATUS_COLORS: Record<EntryStatus, string> = {
  want_to_watch: "var(--accent)",
  watching: "#4ade80",
  completed: "#60a5fa",
  paused: "#facc15",
  dropped: "#f87171",
};

export default function PublicProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [lists, setLists] = useState<List[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState<Section>("resumen");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const isOwner = user?.id === profile?.id;

  useEffect(() => {
    setProfile(undefined);
    setLists([]);
    setEntries([]);
    setSection("resumen");
    setShowSavePrompt(false);
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        if (p && p.is_profile_public) {
          const [l, e] = await Promise.all([
            getPublicLists(p.id).catch(() => []),
            getPublicLibrary(p.id).catch(() => []),
          ]);
          setLists(l);
          setEntries(e);
        }
      })
      .catch(() => setProfile(null));
  }, [username]);

  const movies = useMemo(() => entries.filter((e) => e.media_type === "movie"), [entries]);
  const series = useMemo(() => entries.filter((e) => e.media_type === "tv"), [entries]);
  const wantToWatch = useMemo(() => entries.filter((e) => e.status === "want_to_watch"), [entries]);
  const favorites = useMemo(() => entries.filter((e) => (e.rating ?? 0) >= 4), [entries]);
  const recent = entries.slice(0, 8);

  const filtered = useMemo(() => {
    const base = section === "peliculas" ? movies : series;
    if (statusFilter === "all") return base;
    return base.filter((e) => e.status === statusFilter);
  }, [section, movies, series, statusFilter]);

  const handleShare = async () => {
    if (!profile?.username) return;
    try {
      await navigator.clipboard.writeText(getProfileLink(profile.username));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-3xl font-bold"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}>
          ?
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Perfil no encontrado
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Este perfil no existe o cambió su usuario.
        </p>
        <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
          Ir a Watchly
        </Link>
      </div>
    );
  }

  if (!profile.is_profile_public && !isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center"
          style={{ background: "var(--surface-2)" }}>
          <Lock className="w-10 h-10" style={{ color: "var(--text-secondary)" }} />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Perfil privado
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {profile.display_name || profile.username} no compartió su perfil.
        </p>
        <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
          Ir a Watchly
        </Link>
      </div>
    );
  }

  const initial = (profile.display_name || profile.username || "W").charAt(0).toUpperCase();
  const socials = [
    profile.website_url && { icon: Globe, href: profile.website_url, key: "web" },
    profile.instagram_url && { icon: Aperture, href: `https://instagram.com/${profile.instagram_url.replace(/^@/, "")}`, key: "ig" },
    profile.x_url && { icon: X, href: `https://x.com/${profile.x_url.replace(/^@/, "")}`, key: "x" },
  ].filter(Boolean) as { icon: typeof Globe; href: string; key: string }[];

  const sections: { key: Section; label: string; icon: typeof Film; count: number }[] = [
    { key: "resumen", label: "Resumen", icon: LayoutGrid, count: entries.length },
    { key: "quierover", label: "Quiero ver", icon: Eye, count: wantToWatch.length },
    { key: "peliculas", label: "Películas", icon: Clapperboard, count: movies.length },
    { key: "series", label: "Series", icon: Tv, count: series.length },
    { key: "listas", label: "Listas", icon: ListIcon, count: lists.length },
  ];

  const SectionBanner = ({ eyebrow, title, subtitle, icon: Icon }: {
    eyebrow: string; title: string; subtitle: string; icon: typeof Film;
  }) => (
    <div className="relative overflow-hidden rounded-3xl border p-7 md:p-9 mb-8"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.25)" }}>
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[80px] animate-glow pointer-events-none"
        style={{ background: "var(--glow-violet)" }} />
      <div className="absolute -bottom-20 -left-14 w-44 h-44 rounded-full blur-[70px] animate-glow pointer-events-none"
        style={{ background: "var(--glow-pink)" }} />
      <div className="relative flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 6px 18px rgba(139,92,246,0.4)" }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#c4b5fd" }}>{eyebrow}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );

  const renderEmpty = (msg: string) => (
    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
      <BookOpen className="w-8 h-8 mb-3" style={{ color: "var(--text-secondary)" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{msg}</p>
    </div>
  );

  const renderGrid = (items: Entry[], onClickItem?: (entry: Entry) => void) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {items.map((e) => (
        <MediaCard
          key={e.id}
          tmdbId={e.tmdb_id}
          title={e.title}
          posterPath={e.poster_path}
          year={null}
          mediaType={e.media_type}
          status={e.status}
          rating={e.rating}
          onClick={onClickItem ? () => onClickItem(e) : undefined}
        />
      ))}
    </div>
  );

  const openCard = (_entry: Entry) => {
    if (!user) setShowSavePrompt(true);
  };

  const renderResumen = () => (
    <div className="space-y-10">
      <SectionBanner
        eyebrow="Mi mundo del cine"
        title="Mi rincón de películas"
        subtitle="Todo lo que vi, lo que estoy viendo y lo que todavía no empiezo... en un solo lugar."
        icon={LayoutGrid}
      />
      {/* Big stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Clapperboard, label: "Películas", value: movies.length },
          { icon: Tv, label: "Series", value: series.length },
          { icon: Star, label: "Destacadas", value: favorites.length },
          { icon: ListIcon, label: "Listas", value: lists.length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1"
            style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}>
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[50px] opacity-0 group-hover:opacity-70 transition-opacity duration-500"
              style={{ background: "var(--gradient-accent)" }} />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-extrabold leading-none text-gradient">{value}</p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-secondary)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Star className="w-5 h-5 fill-current" style={{ color: "#c4b5fd" }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Más valoradas
            </h2>
          </div>
          {renderGrid(favorites.slice(0, 8), openCard)}
        </section>
      )}

      {/* Recent */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Sparkles className="w-5 h-5" style={{ color: "#c4b5fd" }} />
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Últimos agregados
          </h2>
        </div>
        {recent.length > 0 ? renderGrid(recent, openCard) : renderEmpty("Este perfil todavía no agregó títulos.")}
      </section>
    </div>
  );

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-7xl mx-auto">
      {user && (
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] mb-8"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

        {/* ===== LEFT: floating profile card ===== */}
        <aside className="relative overflow-hidden rounded-[2rem] border p-6 lg:sticky lg:top-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.25)" }}>
          <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full blur-[90px] animate-glow pointer-events-none"
            style={{ background: "var(--glow-violet)" }} />
          <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full blur-[80px] animate-glow pointer-events-none"
            style={{ background: "var(--glow-pink)" }} />

          <div className="relative flex flex-col items-center text-center">
            {/* Big floating avatar */}
            <div className="relative mb-6">
              <div className="absolute -inset-3 rounded-full opacity-60 blur-2xl animate-pulse"
                style={{ background: "var(--gradient-accent)" }} />
              <div className="absolute -inset-1 rounded-full"
                style={{ background: "var(--gradient-accent)" }} />
              <div className="relative w-28 h-28 rounded-full bg-[#0b0b14] flex items-center justify-center animate-float-slow"
                style={{ boxShadow: "0 20px 50px -10px rgba(139,92,246,0.6)" }}>
                <span className="text-5xl font-extrabold text-gradient">{initial}</span>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm font-bold mt-0.5 mb-4" style={{ color: "#c4b5fd" }}>@{profile.username}</p>

            {profile.bio && (
              <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
                {profile.bio}
              </p>
            )}

            {(profile.location || socials.length > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                {profile.location && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: "var(--text-secondary)" }}>
                    <MapPin className="w-3.5 h-3.5" /> {profile.location}
                  </span>
                )}
                {socials.map(({ icon: Icon, href, key }) => (
                  <a key={key} href={href} target="_blank" rel="noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}

            {/* Mini stats */}
            <div className="flex items-center justify-center gap-6 mb-7 w-full py-4 rounded-2xl"
              style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {[
                { n: movies.length, l: "Películas" },
                { n: series.length, l: "Series" },
                { n: favorites.length, l: "Fav" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <p className="text-xl font-extrabold leading-none text-gradient">{n}</p>
                  <p className="text-[10px] font-bold mt-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{l}</p>
                </div>
              ))}
            </div>

            {/* Section nav */}
            <nav className="w-full flex flex-col gap-2">
              {sections.map(({ key, label, icon: Icon, count }) => {
                const active = section === key;
                return (
                  <button key={key} onClick={() => setSection(key)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200"
                    style={{
                      backgroundColor: active ? "var(--accent-soft)" : "transparent",
                      color: active ? "#c4b5fd" : "var(--text-secondary)",
                      border: `1.5px solid ${active ? "var(--accent)" : "transparent"}`,
                    }}>
                    <Icon className="w-4 h-4" strokeWidth={active ? 2.4 : 2} />
                    <span>{label}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-md text-[11px] font-extrabold"
                      style={{ backgroundColor: active ? "var(--accent)" : "var(--surface-2)", color: active ? "#fff" : "var(--text-secondary)" }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="w-full mt-6">
              {isOwner ? (
                <Link to="/configuracion/perfil"
                  className="block text-center px-5 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
                  Editar perfil
                </Link>
              ) : (
                <button onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "¡Link copiado!" : "Compartir perfil"}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ===== RIGHT: content ===== */}
        <div className="min-w-0">
          {section === "resumen" && renderResumen()}

          {section === "quierover" && (
            <div className="space-y-8">
              <SectionBanner
                eyebrow="Siempre en espera"
                title="¿Qué me gustaría ver?"
                subtitle="La lista de 'algún día lo miro'. Crece sola, no me preguntes cómo. Y no, todavía no empecé nada de esto."
                icon={Eye}
              />
              {wantToWatch.length > 0 ? (
                renderGrid(wantToWatch, openCard)
              ) : (
                renderEmpty("Sin pendientes... por ahora. Todos fuimos inocentes alguna vez.")
              )}
            </div>
          )}

          {(section === "peliculas" || section === "series") && (
            <div className="space-y-6">
              {section === "peliculas" ? (
                <SectionBanner
                  eyebrow="En pantalla grande"
                  title="Mis películas"
                  subtitle="Palomitas listas, luces apagadas y la mejor butaca de la casa."
                  icon={Clapperboard}
                />
              ) : (
                <SectionBanner
                  eyebrow="Un capítulo más"
                  title="Mis series"
                  subtitle="Prometí ver un capítulo. Terminé la temporada. Fue el destino."
                  icon={Tv}
                />
              )}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-3"
                  style={{ color: "var(--text-primary)" }}>
                  {section === "peliculas" ? "Películas" : "Series"}
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold"
                    style={{ backgroundColor: "var(--accent-soft)", color: "#c4b5fd" }}>
                    {filtered.length}
                  </span>
                </h2>
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setStatusFilter(f.value)}
                    className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                    style={{
                      backgroundColor: statusFilter === f.value ? STATUS_COLORS[f.value as EntryStatus] || "var(--accent)" : "var(--surface-2)",
                      color: statusFilter === f.value ? "#000" : "var(--text-secondary)",
                      border: `1.5px solid ${statusFilter === f.value ? STATUS_COLORS[f.value as EntryStatus] || "var(--accent)" : "var(--border)"}`,
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {filtered.length > 0 ? renderGrid(filtered, openCard) : renderEmpty(`No hay ${section === "peliculas" ? "películas" : "series"} con este filtro.`)}
            </div>
          )}

          {section === "listas" && (
            <div className="space-y-6">
              <SectionBanner
                eyebrow="Mis universos"
                title="Mis listas"
                subtitle="Cine y series organizados por tema, por mood o por pura inspiración de la madrugada."
                icon={ListIcon}
              />
              {lists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lists.map((list) => (
                    <div key={list.id} className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1"
                      style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                      <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full blur-[60px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                        style={{ background: "var(--gradient-accent)" }} />
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}>
                            <ListIcon className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{list.name}</p>
                        </div>
                        {list.description && (
                          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{list.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : renderEmpty("Este perfil todavía no compartió listas.")}
            </div>
          )}
        </div>
      </div>

      {showSavePrompt && <SavePromptModal onClose={() => setShowSavePrompt(false)} />}
    </div>
  );
}
