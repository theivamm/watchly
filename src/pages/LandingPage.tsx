import { useEffect, useState } from "react";
import { useTrending } from "@/hooks/useMedia";
import { useRandomCovers } from "@/hooks/useRandomCovers";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import { getPosterUrl } from "@/services/tmdb";
import { genreLabel } from "@/lib/genres";
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

const EDGES = "inset 3px 0 0 rgba(255,80,140,.4), inset -3px 0 0 rgba(70,170,255,.4), 0 30px 80px -20px rgba(0,0,0,.6)";

export default function LandingPage() {
  usePageTitle("Watchly — Tu biblioteca de películas y series", "Organizá tu biblioteca, calificá y compartí lo que ves. Descubrí tu ADN audiovisual.");
  const { data } = useTrending("all");
  const trending = (data?.results || []).filter((i) => i.posterPath);
  const heroItems = useRandomCovers(6, true);
  const hero = useHeroCycle(heroItems.map((i) => i.posterPath));
  const active = heroItems[hero.index];
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("account_deleted=1")) {
      setShowDeletedBanner(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const poster = (n: number) => trending[n % Math.max(trending.length, 1)];

  return (
    <div className="min-h-screen flex flex-col text-white">
      {showDeletedBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "rgba(234,179,163,0.9)", color: "#7c2d12" }}>
          Cuenta eliminada correctamente. ¡Esperamos verte de vuelta pronto!
        </div>
      )}

      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[100svh] overflow-hidden flex flex-col">
        <HeroBackdrop chroma items={heroItems} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

        <PublicNav />

        <div className="relative z-10 flex-1 flex flex-col justify-center px-5 md:px-10 lg:px-16 py-12">
          <span className="liquid-glass-sm inline-flex self-start px-[18px] py-2 rounded-full text-xs font-extrabold tracking-[.2em] uppercase">Tu mundo de cine</span>
          <h1 className="font-cinema mt-7 mb-6 text-7xl md:text-9xl xl:text-[11rem] leading-[0.95] drop-shadow-[0_10px_60px_rgba(0,0,0,.4)]">
            Viví tu cine.<br />Compartí todo<br />lo que ves.
          </h1>
          <p className="text-lg md:text-xl leading-relaxed font-medium text-white/85 max-w-xl text-pretty">
            Guardá lo que viste y lo que querés ver, calificá, escribí notas y armá listas. Tu historial de cine — hermoso, simple, tuyo.
          </p>
          <div className="flex flex-wrap gap-3.5 mt-9">
            <a href="/registro" className="h-16 px-9 rounded-full bg-white text-[#111] hover:text-[#111] text-lg font-extrabold flex items-center gap-2.5 shadow-[0_12px_40px_rgba(0,0,0,.35)] hover:scale-[1.03] transition-transform">Crear mi perfil gratis <span className="text-xl">→</span></a>
            <a href="/login" className="liquid-glass-sm h-16 px-9 rounded-full text-lg font-bold flex items-center text-white hover:text-white hover:scale-[1.03] transition-transform">Ya tengo cuenta</a>
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-8 px-5 md:px-10 lg:px-16 pb-10">
          <div className="flex items-end gap-3.5 overflow-x-auto no-scrollbar py-2">
            {heroItems.map((it, i) => {
              const on = i === hero.index;
              return (
                <button key={it.tmdbId} type="button" onClick={() => hero.select(i)} aria-label={it.title} className="shrink-0 flex flex-col gap-2.5 transition-all duration-700" style={{ width: on ? 120 : 86 }}>
                  <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} className="w-full object-cover rounded-[18px] transition-all duration-700"
                    style={{ aspectRatio: "2/3", border: `1px solid rgba(255,255,255,${on ? 0.6 : 0.18})`, boxShadow: `0 20px 40px rgba(0,0,0,.45), 0 0 0 ${on ? 2 : 0}px rgba(255,255,255,.9)` }} />
                  <span className="h-[3px] rounded-full bg-white/20 overflow-hidden" style={{ opacity: on ? 1 : 0 }}>
                    <span key={hero.cycle} className="block h-full hero-progress" style={{ animationDuration: `${hero.duration}ms`, background: "#fff" }} />
                  </span>
                </button>
              );
            })}
          </div>
          {active && (
            <div className="hidden lg:block text-right max-w-sm min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">Ahora en tendencia{active.tmdbRating ? ` · ★ ${active.tmdbRating.toFixed(1)}` : ""}</p>
              <p className="font-cinema text-5xl leading-none mt-2 line-clamp-2">{active.title}</p>
              <p className="text-sm font-bold text-white/75 mt-2">{[active.year, genreLabel(active.genreIds)].filter(Boolean).join(" · ")}</p>
            </div>
          )}
        </div>
      </section>

      {/* ───────── TENDENCIA ───────── */}
      {trending.length > 0 && (
        <section className="relative py-12 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[900px] h-[420px] rounded-full blur-[150px] opacity-50 cinema-drift-a pointer-events-none" style={{ background: hero.row, transition: "background 1.6s" }} />
          <div className="relative flex items-center gap-5 px-5 md:px-10 lg:px-16 mb-7">
            <h2 className="font-cinema text-4xl md:text-6xl whitespace-nowrap">Tendencia de la semana</h2>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,255,255,.3), transparent)" }} />
          </div>
          <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex gap-6 animate-marquee shrink-0">
              {[...trending, ...trending].map((it, i) => (
                <div key={`${it.tmdbId}-${i}`} className="relative w-44 md:w-56 shrink-0 aspect-[2/3] rounded-[1.75rem] overflow-hidden border border-white/25 shadow-[0_24px_50px_-12px_rgba(0,0,0,.7)]">
                  <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── FEATURES ───────── */}
      <section className="relative px-5 md:px-10 lg:px-16 py-20">
        <p className="text-xs font-extrabold tracking-[.25em] uppercase text-white/70">Por qué Watchly</p>
        <h2 className="font-cinema text-5xl md:text-8xl leading-[0.98] mt-4 mb-14">Todo tu cine,<br />en un solo lugar</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-14">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="border-t border-white/25 pt-6">
              <div className="relative h-56 mb-8 flex items-center justify-center" aria-hidden="true">
                {[0, 1, 2].map((n) => {
                  const it = poster(i * 3 + n);
                  if (!it) return null;
                  return <img key={n} src={getPosterUrl(it.posterPath, "w342")} alt="" loading="lazy" className="h-full aspect-[2/3] object-cover rounded-2xl border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,.6)]"
                    style={{ marginLeft: n ? -56 : 0, transform: `rotate(${(n - 1) * 8}deg) translateY(${n === 1 ? -8 : 6}px)`, zIndex: n === 1 ? 3 : 1 }} />;
                })}
              </div>
              <div className="font-cinema text-7xl leading-none text-transparent" style={{ WebkitTextStroke: "2px rgba(255,255,255,.45)" }}>0{i + 1}</div>
              <h3 className="font-cinema text-4xl leading-tight mt-3">{f.title}</h3>
              <p className="text-base leading-relaxed text-white/80 text-pretty mt-3 max-w-md">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── ROADMAP ───────── */}
      <section className="relative px-5 md:px-10 lg:px-16 py-20 overflow-hidden">
        <div className="absolute top-0 -right-24 w-[700px] h-[700px] rounded-full blur-[150px] opacity-45 cinema-drift-b pointer-events-none" style={{ background: hero.row, transition: "background 1.6s" }} />
        <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            <p className="text-xs font-extrabold tracking-[.25em] uppercase text-white/70">Roadmap</p>
            <h2 className="font-cinema text-5xl md:text-7xl leading-[0.98] mt-4 mb-5">Lo que se viene en Watchly</h2>
            <p className="text-base md:text-lg max-w-md mb-8 text-white/75">Una función diferencial por etapa, medida y consolidada antes de avanzar.</p>
            <a href="/roadmap" className="liquid-glass-sm inline-flex h-14 px-8 rounded-full items-center font-bold text-white hover:text-white hover:scale-[1.03] transition-transform">Ver el roadmap completo →</a>
          </div>
          <div>
            {ROADMAP.map((r, i) => (
              <div key={r.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 py-6 border-t border-white/20 items-baseline">
                <span className="font-cinema text-5xl leading-none text-transparent" style={{ WebkitTextStroke: "2px rgba(255,255,255,.45)" }}>{String(i + 1).padStart(2, "0")}</span>
                <div><p className="font-cinema text-3xl leading-tight">{r.title}</p><p className="text-sm leading-relaxed text-white/75 text-pretty mt-2 max-w-xl">{r.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="relative px-4 md:px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 px-8 py-24 text-center" style={{ boxShadow: EDGES }}>
          {trending.length > 0 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
              <div className="absolute -inset-[18%] grid gap-3 -rotate-[8deg]" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
                {Array.from({ length: 30 }, (_, i) => poster(i)).map((it, i) => <img key={i} src={getPosterUrl(it.posterPath, "w200")} alt="" loading="lazy" className="w-full aspect-[2/3] object-cover rounded-xl" style={{ marginTop: (i % 10) % 2 ? 36 : 0 }} />)}
              </div>
              <div className="absolute inset-0" style={{ background: "rgba(8,7,14,.82)" }} />
            </div>
          )}
          <div className="relative">
            <h2 className="font-cinema text-6xl md:text-9xl leading-[0.95]">Empezá hoy.<br />Gratis.</h2>
            <p className="text-lg text-white/80 mx-auto mt-6 mb-9 max-w-lg">Tu perfil de cine te está esperando. Creá tu cuenta en menos de un minuto.</p>
            <a href="/registro" className="inline-flex h-16 px-10 items-center gap-2.5 rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold text-lg shadow-[0_12px_40px_rgba(0,0,0,.35)] hover:scale-[1.03] transition-transform">Crear mi cuenta →</a>
          </div>
        </div>
      </section>

      <PublicFooter items={heroItems} index={hero.index} />
    </div>
  );
}
