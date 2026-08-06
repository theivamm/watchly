import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Share2, Check, MapPin, Globe, Aperture, X, Lock, Film, List as ListIcon,
  Clapperboard, Sparkles, Star, LayoutGrid, Tv, BookOpen, Eye, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getProfileByUsername, getProfileLink } from "@/services/profile";
import { getPublicLists, getList } from "@/services/lists";
import { getPublicLibrary } from "@/services/library";
import MediaCard from "@/components/media/MediaCard";
import SavePromptModal from "@/components/media/SavePromptModal";
import EntryDetailModal from "@/components/media/EntryDetailModal";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import UserMenu from "@/components/layout/UserMenu";
import { getPosterUrl } from "@/services/tmdb";
import { getDominantColor, rgba, rgbString, lighten, DEFAULT_TINT, type RGB } from "@/lib/posterColor";
import type { Profile, List, Entry, EntryStatus, TMDBSearchResult, ListItem } from "@/types";

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [lists, setLists] = useState<List[]>([]);
  const [listPreviews, setListPreviews] = useState<Record<string, ListItem[]>>({});
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState<Section>("resumen");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [viewResult, setViewResult] = useState<TMDBSearchResult | null>(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [tint, setTint] = useState<RGB>(DEFAULT_TINT);

  const isOwner = user?.id === profile?.id;

  useEffect(() => {
    setProfile(undefined);
    setLists([]);
    setListPreviews({});
    setExpandedListId(null);
    setEntries([]);
    setSection("resumen");
    setShowSavePrompt(false);
    setSelectedEntry(null);
    setViewResult(null);
    setBgIndex(0);
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

  const heroCovers = useMemo(() => entries.filter((e) => e.poster_path).slice(0, 5), [entries]);

  useEffect(() => {
    if (!profile?.is_profile_public || lists.length === 0) {
      setListPreviews({});
      return;
    }
    let cancelled = false;
    const fetchPreviews = async () => {
      const data: Record<string, ListItem[]> = {};
      await Promise.all(
        lists.map(async (list) => {
          try {
            const { items } = await getList(list.id);
            data[list.id] = items;
          } catch {
            data[list.id] = [];
          }
        })
      );
      if (!cancelled) setListPreviews(data);
    };
    fetchPreviews();
    return () => {
      cancelled = true;
    };
  }, [profile?.is_profile_public, lists]);

  useEffect(() => {
    if (heroCovers.length <= 1) return;
    setBgIndex(0);
    const t = setInterval(() => setBgIndex((i) => (i + 1) % heroCovers.length), 4000);
    return () => clearInterval(t);
  }, [heroCovers.length]);

  const activeCover = heroCovers[bgIndex];

  useEffect(() => {
    if (!activeCover?.poster_path) return;
    getDominantColor(getPosterUrl(activeCover.poster_path, "w200"))
      .then(setTint)
      .catch(() => setTint(DEFAULT_TINT));
  }, [activeCover?.poster_path]);

  const accentText = rgbString(lighten(tint, 0.45));
  const accentSoft = rgba(tint, 0.14);
  const accentBorder = rgba(tint, 0.3);
  const tintGlow = rgba(tint, 0.4);
  const tintGradient = `linear-gradient(135deg, ${rgbString(tint)} 0%, ${rgbString(lighten(tint, 0.28))} 55%, ${rgbString(lighten(tint, 0.5))} 100%)`;

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
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          ?
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Perfil no encontrado
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Este perfil no existe o cambió su usuario.
        </p>
        <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
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
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
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

  const renderEmpty = (msg: string) => (
    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
      <BookOpen className="w-8 h-8 mb-3" style={{ color: "var(--text-secondary)" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{msg}</p>
    </div>
  );

  const renderGrid = (items: Entry[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
          notes={e.notes}
          onClick={() => openCard(e)}
          onAction={() => openAction(e)}
        />
      ))}
    </div>
  );

  const toResult = (entry: Entry): TMDBSearchResult => ({
    tmdbId: entry.tmdb_id,
    mediaType: entry.media_type,
    title: entry.title,
    originalTitle: entry.title,
    overview: "",
    year: null,
    releaseDate: null,
    posterPath: entry.poster_path,
    backdropPath: null,
    genreIds: [],
    tmdbRating: null,
  });

  const openCard = (entry: Entry) => {
    if (user) setViewResult(toResult(entry));
    else setSelectedEntry(entry);
  };

  const openListItem = (item: ListItem) => {
    setViewResult({
      tmdbId: item.tmdb_id,
      mediaType: item.media_type,
      title: item.title,
      originalTitle: item.title,
      overview: "",
      year: null,
      releaseDate: null,
      posterPath: item.poster_path,
      backdropPath: null,
      genreIds: [],
      tmdbRating: null,
    });
  };

  const openAction = (entry: Entry) => {
    if (!user) setShowSavePrompt(true);
    else setViewResult(toResult(entry));
  };

  const SectionTitle = ({ eyebrow, title, subtitle, icon: Icon }: {
    eyebrow: string; title: string; subtitle: string; icon: typeof Film;
  }) => (
    <div className="relative overflow-hidden rounded-3xl border p-7 md:p-9 mb-8"
      style={{ backgroundColor: "var(--surface-1)", borderColor: accentBorder }}>
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[80px] animate-glow pointer-events-none"
        style={{ background: rgba(tint, 0.3) }} />
      <div className="absolute -bottom-20 -left-14 w-44 h-44 rounded-full blur-[70px] pointer-events-none"
        style={{ background: rgba(lighten(tint, 0.3), 0.2) }} />
      <div className="relative flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: tintGradient, boxShadow: `0 6px 18px ${rgba(tint, 0.45)}` }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: `rgb(${accentText})` }}>{eyebrow}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );

  const renderResumen = () => (
    <div className="space-y-10">
      {/* Big stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Clapperboard, label: "Películas", value: movies.length },
          { icon: Tv, label: "Series", value: series.length },
          { icon: Star, label: "Destacadas", value: favorites.length },
          { icon: ListIcon, label: "Listas", value: lists.length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1"
            style={{ backgroundColor: "var(--surface-1)", borderColor: accentBorder }}>
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[50px] opacity-0 group-hover:opacity-70 transition-opacity duration-500"
              style={{ background: tintGradient }} />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: tintGradient, boxShadow: `0 4px 14px ${tintGlow}` }}>
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
            <Star className="w-5 h-5 fill-current" style={{ color: `rgb(${accentText})` }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Más valoradas
            </h2>
          </div>
          {renderGrid(favorites.slice(0, 8))}
        </section>
      )}

      {/* Recent */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Sparkles className="w-5 h-5" style={{ color: `rgb(${accentText})` }} />
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Últimos agregados
          </h2>
        </div>
        {recent.length > 0 ? renderGrid(recent) : renderEmpty("Este perfil todavía no agregó títulos.")}
      </section>
    </div>
  );

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-7xl mx-auto">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      {/* ===== Profile banner with cycling blurred covers ===== */}
      <section className="relative overflow-hidden rounded-[2rem] border mb-8"
        style={{ borderColor: accentBorder }}>
        {heroCovers.length > 0 && (
          <div className="absolute inset-0">
            {heroCovers.map((entry, i) => (
              <img
                key={entry.id}
                src={getPosterUrl(entry.poster_path, "w500")}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2200ms] ease-in-out"
                style={{
                  opacity: i === bgIndex ? 1 : 0,
                  filter: "blur(20px) saturate(1.15)",
                  transform: "scale(1.15)",
                }}
              />
            ))}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.85) 0%, rgba(11,11,20,0.55) 50%, rgba(11,11,20,0.92) 100%)" }} />
          </div>
        )}
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-[110px] animate-glow pointer-events-none"
          style={{ background: rgba(tint, 0.45) }} />
        <div className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
          style={{ background: rgba(lighten(tint, 0.35), 0.25) }} />

        <div className="relative z-10 p-7 md:p-10 flex flex-col md:flex-row items-center gap-7 md:gap-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute -inset-3 rounded-full opacity-60 blur-2xl animate-pulse"
              style={{ background: rgba(tint, 0.6) }} />
            <div className="absolute -inset-1 rounded-full" style={{ background: tintGradient }} />
            <div className="relative w-28 h-28 rounded-full bg-[#0b0b14] flex items-center justify-center animate-float"
              style={{ boxShadow: `0 20px 50px -10px ${rgba(tint, 0.6)}` }}>
              <span className="text-5xl font-extrabold text-gradient">{initial}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3"
              style={{ backgroundColor: accentSoft, color: `rgb(${accentText})`, border: `1px solid ${accentBorder}` }}>
              <Sparkles className="w-3.5 h-3.5" /> Perfil público
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm font-bold mb-3" style={{ color: `rgb(${accentText})` }}>@{profile.username}</p>

            {profile.bio && (
              <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                {profile.bio}
              </p>
            )}

            {(profile.location || socials.length > 0) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
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
          </div>

          {/* Mini stats + actions */}
          <div className="shrink-0 flex flex-col items-center gap-4">
            <div className="flex items-center gap-5 px-6 py-4 rounded-2xl"
              style={{ backgroundColor: "rgba(11,11,20,0.45)", border: `1px solid ${accentBorder}`, backdropFilter: "blur(8px)" }}>
              {[
                { n: movies.length, l: "Películas" },
                { n: series.length, l: "Series" },
                { n: favorites.length, l: "Fav" },
              ].map(({ n, l }) => (
                <div key={l} className="text-center">
                  <p className="text-xl font-extrabold leading-none text-gradient">{n}</p>
                  <p className="text-[10px] font-bold mt-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{l}</p>
                </div>
              ))}
            </div>

            {isOwner ? (
              <Link to="/configuracion/perfil"
                className="block text-center px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02] w-full"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
                Editar perfil
              </Link>
            ) : (
              <button onClick={handleShare}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02] w-full"
                style={{ background: tintGradient, color: "#fff", boxShadow: `0 4px 18px ${rgba(tint, 0.45)}` }}>
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "¡Link copiado!" : "Compartir perfil"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===== Section nav ===== */}
      <nav className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
        {sections.map(({ key, label, icon: Icon, count }) => {
          const active = section === key;
          return (
            <button key={key} onClick={() => setSection(key)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200"
              style={{
                backgroundColor: active ? accentSoft : "var(--surface-1)",
                color: active ? `rgb(${accentText})` : "var(--text-secondary)",
                border: `1.5px solid ${active ? accentBorder : "var(--border)"}`,
              }}>
              <Icon className="w-4 h-4" strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold"
                style={{ backgroundColor: active ? rgba(tint, 0.25) : "var(--surface-2)", color: active ? "#fff" : "var(--text-secondary)" }}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        {section === "resumen" && renderResumen()}

        {section === "quierover" && (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Siempre en espera"
              title="¿Qué me gustaría ver?"
              subtitle="La lista de 'algún día lo miro'. Crece sola, no me preguntes cómo. Y no, todavía no empecé nada de esto."
              icon={Eye}
            />
            {wantToWatch.length > 0 ? (
              renderGrid(wantToWatch)
            ) : (
              renderEmpty("Sin pendientes... por ahora. Todos fuimos inocentes alguna vez.")
            )}
          </div>
        )}

        {(section === "peliculas" || section === "series") && (
          <div className="space-y-6">
            {section === "peliculas" ? (
              <SectionTitle
                eyebrow="En pantalla grande"
                title="Mis películas"
                subtitle="Palomitas listas, luces apagadas y la mejor butaca de la casa."
                icon={Clapperboard}
              />
            ) : (
              <SectionTitle
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
                  style={{ backgroundColor: accentSoft, color: `rgb(${accentText})` }}>
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

            {filtered.length > 0 ? renderGrid(filtered) : renderEmpty(`No hay ${section === "peliculas" ? "películas" : "series"} con este filtro.`)}
          </div>
        )}

        {section === "listas" && (
          <div className="space-y-6">
            <SectionTitle
              eyebrow="Mis universos"
              title="Mis listas"
              subtitle="Cine y series organizados por tema, por mood o por pura inspiración de la madrugada."
              icon={ListIcon}
            />
            {lists.length > 0 ? (
              <div className="space-y-5">
                {lists.map((list) => {
                  const items = listPreviews[list.id] ?? [];
                  const posters = items.filter((i) => i.poster_path).slice(0, 4).map((i) => i.poster_path as string);
                  const expanded = expandedListId === list.id;
                  return (
                    <div key={list.id}
                      className="overflow-hidden rounded-[2rem] border transition-all duration-300"
                      style={{
                        backgroundColor: "var(--surface-1)",
                        borderColor: expanded ? rgba(tint, 0.5) : accentBorder,
                        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.6)",
                      }}>
                      <button
                        onClick={() => setExpandedListId(expanded ? null : list.id)}
                        title={expanded ? "Ocultar títulos" : "Ver títulos"}
                        className="group relative block w-full h-48 text-left overflow-hidden cursor-pointer"
                      >
                        {posters.length > 0 ? (
                          <>
                            <div className="absolute inset-0 overflow-hidden">
                              {posters.length === 1 ? (
                                <img
                                  src={getPosterUrl(posters[0], "w500")}
                                  alt=""
                                  aria-hidden="true"
                                  className="w-full h-full object-cover blur-sm scale-110 transition-transform duration-700 group-hover:scale-125"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full w-full">
                                  {posters.slice(0, 4).map((p, i) => (
                                    <img
                                      key={i}
                                      src={getPosterUrl(p, "w342")}
                                      alt=""
                                      aria-hidden="true"
                                      className="w-full h-full object-cover blur-[3px] scale-110 transition-transform duration-700 group-hover:scale-125"
                                      loading="lazy"
                                    />
                                  ))}
                                </div>
                              )}
                              <div className="absolute inset-0"
                                style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.7) 0%, rgba(11,11,20,0.3) 45%, rgba(11,11,20,0.95) 100%)" }} />
                              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] animate-glow pointer-events-none"
                                style={{ background: rgba(tint, 0.3) }} />
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0"
                            style={{ background: `linear-gradient(135deg, ${rgba(tint, 0.3)} 0%, ${rgba(lighten(tint, 0.3), 0.18)} 100%)` }} />
                        )}

                        <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md"
                                style={{ backgroundColor: "rgba(11,11,20,0.55)", color: `rgb(${accentText})`, border: "1px solid rgba(255,255,255,0.08)" }}>
                                <ListIcon className="w-3 h-3" /> Lista
                              </span>
                              {items.length > 0 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md"
                                  style={{ backgroundColor: "rgba(11,11,20,0.55)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                  {items.length} {items.length === 1 ? "título" : "títulos"}
                                </span>
                              )}
                            </div>
                            <span
                              className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-transform duration-300"
                              style={{
                                backgroundColor: "rgba(11,11,20,0.55)",
                                color: "var(--accent-light)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                transform: expanded ? "rotate(180deg)" : "none",
                              }}>
                              <ChevronDown className="w-4 h-4" />
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-extrabold tracking-tight mb-1 drop-shadow-md"
                              style={{ color: "var(--text-primary)" }}>
                              {list.name}
                            </h3>
                            {list.description && (
                              <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                                {list.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>

                      {expanded && (
                        <div className="p-6 pt-5 animate-slide-up" style={{ backgroundColor: "rgba(11,11,20,0.45)" }}>
                          {items.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {items.map((item) => (
                                <MediaCard
                                  key={item.id}
                                  tmdbId={item.tmdb_id}
                                  title={item.title}
                                  posterPath={item.poster_path}
                                  year={null}
                                  mediaType={item.media_type}
                                  onClick={() => openListItem(item)}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm py-6 text-center" style={{ color: "var(--text-secondary)" }}>
                              Esta lista todavía no tiene títulos.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : renderEmpty("Este perfil todavía no compartió listas.")}
          </div>
        )}
      </div>

      {showSavePrompt && <SavePromptModal onClose={() => setShowSavePrompt(false)} />}

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onAction={() => {
            setSelectedEntry(null);
            setShowSavePrompt(true);
          }}
        />
      )}

      {viewResult && (
        <MediaDetailModal
          result={viewResult}
          onClose={() => setViewResult(null)}
          onSaved={() => {
            setViewResult(null);
            if (profile) getPublicLibrary(profile.id).then(setEntries).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
