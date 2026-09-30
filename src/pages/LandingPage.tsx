import { useEffect, useState } from "react";
import { useTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import { genreLabel } from "@/lib/genres";
import { useAuth } from "@/app/auth-context";
import UserMenu from "@/components/layout/UserMenu";
import { usePageTitle } from "@/hooks/usePageTitle";

const FEATURES = [
  { title: "Buscá todo", desc: "Encontrá cualquier película o serie de TMDB en segundos, con posters, sinopsis y puntajes reales." },
  { title: "Organizá tu biblioteca", desc: "Estados, calificaciones con estrellas y notas en cada título. Tu historial siempre al día." },
  { title: "Compartí tu perfil", desc: "Mostrá lo que ves con listas y un perfil público que podés compartir con quien quieras." },
];

const ROADMAP = [
  { title: "ADN Audiovisual", desc: "Tu biblioteca se convierte en un perfil visual de gustos: géneros, décadas y directores. Preliminar desde 5 títulos." },
  { title: "¿Qué vemos hoy?", desc: "Decinos cómo es tu momento y Watchly elige entre lo que ya querías ver. Sin discusiones y sin IA." },
  { title: "Compatibilidad", desc: "Al visitar un perfil público: cuánto comparten sus pantallas y una película para ver juntos." },
  { title: "Modo pareja o grupo", desc: "Una sala con 2 a 8 personas, votación de portadas y una decisión sin discusiones eternas." },
  { title: "Cápsula y rewatch", desc: "Guardá lo que te dejó cada historia y mirá cómo cambió tu relación con ella con el tiempo." },
  { title: "Créditos del año", desc: "Tus créditos finales: primera y última película del año, mejor calificada y países recorridos." },
];

export default function LandingPage() {
  usePageTitle("Watchly — Tu biblioteca de películas y series", "Organizá tu biblioteca, calificá y compartí lo que ves. Descubrí tu ADN audiovisual.");
  const { user } = useAuth();
  const { data } = useTrending("all");
  const trending = (data?.results || []).filter((i) => i.posterPath);
  const heroItems = trending.filter((i) => i.overview).slice(0, 5);
  const hero = useHeroCycle(heroItems.map((i) => i.posterPath));
  const active = heroItems[hero.index];
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("account_deleted=1")) {
      setShowDeletedBanner(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const accent = { color: "#fff" } as const;
  const glassCard = "liquid-glass rounded-[2.5rem]";

  return (
    <div className="min-h-screen flex flex-col text-white">
      {showDeletedBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full text-sm font-semibold"
          style={{ backgroundColor: "rgba(234,179,163,0.9)", color: "#7c2d12" }}>
          Cuenta eliminada correctamente. ¡Esperamos verte de vuelta pronto!
        </div>
      )}

      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[100svh] overflow-hidden flex flex-col">
        <HeroBackdrop items={heroItems} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

        {/* Nav */}
        <header className="relative z-20 px-4 md:px-10 pt-6">
          <div className="liquid-glass mx-auto max-w-[1288px] h-16 rounded-full flex items-center gap-2 pl-7 pr-2.5">
            <span className="font-cinema text-3xl" style={accent}>Watchly</span>
            <div className="flex-1" />
            <a href="/roadmap" className="hidden sm:block px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white">Roadmap</a>
            {user ? <UserMenu /> : (
              <>
                <a href="/login" className="liquid-glass-sm h-11 px-5 rounded-full flex items-center text-sm font-bold text-white hover:text-white">Iniciar sesión</a>
                <a href="/registro" className="h-11 px-6 rounded-full bg-white text-[#111] hover:text-[#111] flex items-center text-sm font-extrabold">Crear cuenta</a>
              </>
            )}
          </div>
        </header>

        {/* Copy + title card */}
        <div className="relative z-10 flex-1 flex items-center justify-between gap-10 px-5 md:px-14 lg:px-24 py-12">
          <div className="max-w-[840px]">
            <span className="liquid-glass-sm inline-flex px-[18px] py-2 rounded-full text-xs font-extrabold tracking-[.2em] uppercase">Tu mundo de cine</span>
            <h1 className="font-cinema mt-7 mb-6 text-6xl md:text-8xl xl:text-[8.5rem] leading-[1.02] drop-shadow-[0_10px_60px_rgba(0,0,0,.4)]">
              Viví tu cine.<br />
              <span style={accent}>Compartí todo</span><br />
              lo que ves.
            </h1>
            <p className="text-lg md:text-xl leading-relaxed font-medium text-white/85 max-w-xl text-pretty">
              Guardá lo que viste y lo que querés ver, calificá, escribí notas y armá listas. Tu historial de cine — hermoso, simple, tuyo.
            </p>
            <div className="flex flex-wrap gap-3.5 mt-9">
              <a href="/registro" className="h-14 px-8 rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold flex items-center gap-2.5 shadow-[0_12px_40px_rgba(0,0,0,.35)] hover:scale-[1.03] transition-transform">
                Crear mi perfil gratis <span className="text-xl">→</span>
              </a>
              <a href="/login" className="liquid-glass-sm h-14 px-8 rounded-full font-bold flex items-center text-white hover:text-white hover:scale-[1.03] transition-transform">
                Ya tengo cuenta
              </a>
            </div>
          </div>

          {active && (
            <div className="liquid-glass hidden xl:block w-[380px] shrink-0 rounded-[2.25rem] p-[18px]">
              <div className="grid">
                {heroItems.map((it, i) => (
                  <div key={it.tmdbId} className="[grid-area:1/1] flex flex-col gap-3.5 transition-all duration-1000"
                    style={{ opacity: i === hero.index ? 1 : 0, transform: `translateY(${i === hero.index ? 0 : 18}px)` }}>
                    <div className="relative h-[210px] rounded-3xl overflow-hidden">
                      <img src={it.backdropPath ? getBackdropUrl(it.backdropPath, "w780") : getPosterUrl(it.posterPath, "w500")}
                        alt="" className="w-full h-full object-cover" />
                      {it.tmdbRating ? (
                        <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[#111] text-[13px] font-extrabold"
                          style={{ background: hero.accent }}>★ {it.tmdbRating.toFixed(1)}</span>
                      ) : null}
                    </div>
                    <div className="px-1.5">
                      <p className="text-xs font-bold text-white/70">{[it.year, genreLabel(it.genreIds)].filter(Boolean).join(" · ")}</p>
                      <p className="font-cinema text-4xl leading-none my-2 line-clamp-2">{it.title}</p>
                      <p className="text-sm leading-relaxed text-white/85 line-clamp-3">{it.overview}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4 pb-1">
                <span className="flex-1 h-11 rounded-full flex items-center justify-center text-[13px] font-extrabold text-[#111]" style={{ background: hero.accent, transition: "background 1.2s" }}>+ Quiero ver</span>
                <span className="liquid-glass-sm flex-1 h-11 rounded-full flex items-center justify-center text-[13px] font-bold">✓ Vista</span>
                <span className="liquid-glass-sm flex-1 h-11 rounded-full flex items-center justify-center text-[13px] font-bold">Lista</span>
              </div>
            </div>
          )}
        </div>

        {/* Rail + stats */}
        <div className="relative z-10 flex items-end justify-between gap-6 px-5 md:px-14 lg:px-24 pb-10">
          <div className="flex items-end gap-3.5 overflow-x-auto no-scrollbar py-2">
            {heroItems.map((it, i) => {
              const on = i === hero.index;
              return (
                <button key={it.tmdbId} type="button" onClick={() => hero.select(i)} aria-label={it.title}
                  className="shrink-0 flex flex-col gap-2.5 transition-all duration-700" style={{ width: on ? 120 : 86 }}>
                  <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title}
                    className="w-full object-cover rounded-[18px] transition-all duration-700"
                    style={{ aspectRatio: "2/3", border: `1px solid rgba(255,255,255,${on ? 0.6 : 0.18})`, boxShadow: `0 20px 40px rgba(0,0,0,.45), 0 0 0 ${on ? 2 : 0}px ${hero.accent}` }} />
                  <span className="h-[3px] rounded-full bg-white/20 overflow-hidden" style={{ opacity: on ? 1 : 0 }}>
                    <span className="block h-full" style={{ width: `${hero.progress}%`, background: hero.accent }} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="liquid-glass hidden md:flex rounded-[2rem] py-4 px-1.5 shrink-0">
            {[["+10K", "títulos"], ["5", "estados"], ["∞", "listas"]].map(([n, l]) => (
              <div key={l} className="px-7 text-center">
                <div className="font-cinema text-4xl leading-none" style={accent}>{n}</div>
                <div className="text-xs font-bold mt-2 text-white/75">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── TENDENCIA (marquee) ───────── */}
      {trending.length > 0 && (
        <section className="relative py-12 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[900px] h-[420px] rounded-full blur-[150px] opacity-50 cinema-drift-a pointer-events-none"
            style={{ background: hero.row, transition: "background 1.6s" }} />
          <div className="relative flex items-center gap-5 px-6 md:px-24 mb-7">
            <h2 className="font-cinema text-3xl md:text-5xl whitespace-nowrap">Tendencia de la semana</h2>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,255,255,.3), transparent)" }} />
          </div>
          <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex gap-6 animate-marquee shrink-0">
              {[...trending, ...trending].map((it, i) => (
                <div key={`${it.tmdbId}-${i}`}
                  className="relative w-44 md:w-56 shrink-0 aspect-[2/3] rounded-[1.75rem] overflow-hidden border border-white/18 shadow-[0_24px_50px_-12px_rgba(0,0,0,.7)]">
                  <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── FEATURES ───────── */}
      <section className="relative px-5 md:px-24 py-20">
        <p className="text-xs font-extrabold tracking-[.25em] uppercase text-center" style={accent}>Por qué Watchly</p>
        <h2 className="font-cinema text-5xl md:text-7xl text-center mt-4 mb-14">
          Todo tu cine, <span style={accent}>en un solo lugar</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1248px] mx-auto">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`${glassCard} relative overflow-hidden min-h-[320px] p-9 flex flex-col gap-3.5 transition-transform duration-300 hover:-translate-y-2`}>
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-60 pointer-events-none"
                style={{ background: hero.row, filter: `blur(80px) hue-rotate(${i * 50}deg)` }} />
              <div className="relative font-cinema text-7xl leading-none" style={accent}>0{i + 1}</div>
              <h3 className="relative font-cinema text-3xl leading-tight mt-auto">{f.title}</h3>
              <p className="relative text-[15px] leading-relaxed text-white/80 text-pretty">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── ROADMAP ───────── */}
      <section className="relative px-5 md:px-24 py-20 overflow-hidden">
        <div className="absolute top-0 -right-24 w-[700px] h-[700px] rounded-full blur-[150px] opacity-45 cinema-drift-b pointer-events-none"
          style={{ background: hero.row, transition: "background 1.6s" }} />
        <div className="relative max-w-[1248px] mx-auto">
          <p className="text-xs font-extrabold tracking-[.25em] uppercase text-center" style={accent}>Roadmap</p>
          <h2 className="font-cinema text-5xl md:text-7xl text-center mt-4 mb-5">
            Lo que se viene <span style={accent}>en Watchly</span>
          </h2>
          <p className="text-base md:text-lg text-center max-w-2xl mx-auto mb-12 text-white/75">
            Una función diferencial por etapa, medida y consolidada antes de avanzar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ROADMAP.map((r, i) => (
              <div key={r.title} className="liquid-glass rounded-[2rem] px-7 py-6 flex items-center gap-5">
                <div className="shrink-0 w-16 h-16 rounded-[1.4rem] flex items-center justify-center font-cinema text-3xl text-[#111]"
                  style={{ background: hero.accent, filter: `hue-rotate(${(i % 3) * 50}deg)`, transition: "background 1.2s" }}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-extrabold text-lg mb-1.5">{r.title}</p>
                  <p className="text-sm leading-relaxed text-white/75 text-pretty">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <a href="/roadmap" className="liquid-glass-sm h-14 px-8 rounded-full flex items-center font-bold text-white hover:text-white hover:scale-[1.03] transition-transform">
              Ver el roadmap completo →
            </a>
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="relative px-5 md:px-24 pb-24">
        <div className="liquid-glass relative max-w-[1248px] mx-auto rounded-[3.5rem] px-8 py-20 text-center overflow-hidden">
          <div className="absolute -top-64 left-1/2 -ml-80 w-[640px] h-[640px] rounded-full blur-[110px] opacity-80 cinema-drift-a pointer-events-none"
            style={{ background: hero.row, transition: "background 1.6s" }} />
          <div className="relative">
            <h2 className="font-cinema text-6xl md:text-8xl leading-none">Empezá hoy. <span style={accent}>Gratis.</span></h2>
            <p className="text-lg text-white/80 mx-auto mt-6 mb-9 max-w-lg">Tu perfil de cine te está esperando. Creá tu cuenta en menos de un minuto.</p>
            <a href="/registro" className="inline-flex h-16 px-10 items-center gap-2.5 rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold text-lg shadow-[0_12px_40px_rgba(0,0,0,.35)] hover:scale-[1.03] transition-transform">
              Crear mi cuenta →
            </a>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-8 text-center text-sm text-white/60 border-t border-white/10">
        <span className="font-cinema text-lg" style={accent}>Watchly</span> — Tu identidad audiovisual.
      </footer>
    </div>
  );
}
