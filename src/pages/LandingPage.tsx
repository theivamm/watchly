import { useEffect, useState } from "react";
import { Search, BookOpen, Share2, Sparkles, ArrowRight, Play, Star, LogIn, UserPlus, HelpCircle, Clapperboard, Tv, HeartHandshake, Users } from "lucide-react";
import { useTrending } from "@/hooks/useMedia";
import { getPosterUrl } from "@/services/tmdb";
import { getDominantColor, rgba, DEFAULT_TINT, type RGB } from "@/lib/posterColor";
import { useAuth } from "@/app/auth-context";
import UserMenu from "@/components/layout/UserMenu";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function LandingPage() {
  usePageTitle("Watchly — Tu biblioteca de películas y series", "Organizá tu biblioteca, calificá y compartí lo que ves. Descubrí tu ADN audiovisual.");
  const { user } = useAuth();
  const { data } = useTrending("all");
  const trending = data?.results || [];
  const covers = trending.filter((i) => i.posterPath).map((i) => i.posterPath as string).slice(0, 6);
  const [scrolled, setScrolled] = useState(false);
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [tint, setTint] = useState<RGB>(DEFAULT_TINT);

  useEffect(() => {
    if (covers.length <= 1) return;
    setBgIndex(0);
    const t = setInterval(() => setBgIndex((i) => (i + 1) % covers.length), 4000);
    return () => clearInterval(t);
  }, [covers.length]);

  const activeCover = covers[bgIndex];

  useEffect(() => {
    if (!activeCover) return;
    getDominantColor(getPosterUrl(activeCover, "w200"))
      .then(setTint)
      .catch(() => setTint(DEFAULT_TINT));
  }, [activeCover]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.location.search.includes("account_deleted=1")) {
      setShowDeletedBanner(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "transparent" }}>

      {/* Navbar */}
      <header
        className="sticky top-0 z-50 transition-all duration-500"
        style={{
          padding: scrolled ? "10px 0" : "18px 0",
          backgroundColor: scrolled ? "rgba(11,11,20,0.72)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
          borderBottom: scrolled ? "1px solid color-mix(in srgb, var(--accent) 18%, transparent)" : "1px solid transparent",
          boxShadow: scrolled ? "0 12px 36px -16px rgba(0,0,0,0.6)" : "none",
        }}
      >
        <div className="flex items-center justify-between px-6 md:px-10">
          <span
            className="text-2xl font-extrabold tracking-tight text-gradient whitespace-nowrap transition-transform duration-500"
            style={{ transform: scrolled ? "scale(0.9)" : "scale(1)" }}
          >
            Watchly
          </span>
          <div className="flex items-center gap-2">
            <a href="/roadmap" title="Roadmap"
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 hover:opacity-80"
              style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <HelpCircle className="w-5 h-5" />
            </a>
            {user ? (
              <UserMenu />
            ) : (
              <>
                <a href="/login"
                  className="flex items-center gap-2 px-3 sm:px-5 h-11 rounded-full text-sm font-semibold transition-all hover:opacity-80"
                  style={{ color: "var(--text-primary)", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </a>
                <a href="/registro"
                  className="flex items-center gap-2 px-3 sm:px-5 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.04]"
                  style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Crear cuenta</span>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {showDeletedBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full text-sm font-semibold"
          style={{ backgroundColor: "rgba(234,179,163,0.9)", color: "#7c2d12", boxShadow: "0 4px 20px rgba(239,68,68,0.3)" }}>
          Cuenta eliminada correctamente. ¡Esperamos verte de vuelta pronto!
        </div>
      )}

      {/* Hero banner with cycling blurred covers */}
      <section className="relative flex-1 flex items-center overflow-hidden pt-12 pb-16">
        {covers.length > 0 && (
          <div className="absolute inset-0">
            {covers.map((poster, i) => (
              <img
                key={i}
                src={getPosterUrl(poster, "w500")}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2200ms] ease-in-out"
                style={{
                  opacity: i === bgIndex ? 1 : 0,
                  filter: "blur(28px) saturate(1.25)",
                  transform: "scale(1.2)",
                }}
              />
            ))}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.92) 0%, rgba(11,11,20,0.55) 50%, rgba(11,11,20,0.96) 100%)" }} />
          </div>
        )}

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[150%] rounded-full"
          style={{ background: `radial-gradient(ellipse at center, ${rgba(tint, 0.42)} 0%, transparent 65%)` }}
        />
        <div className="absolute top-[-10%] left-[-5%] w-[520px] h-[520px] rounded-full blur-[130px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute bottom-[-15%] right-[-8%] w-[480px] h-[480px] rounded-full blur-[130px] pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center px-6 md:px-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-7"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
            <Sparkles className="w-3.5 h-3.5" />
            Tu mundo de cine
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] mb-7"
            style={{ color: "var(--text-primary)" }}>
            Viví tu cine.
            <br />
            <span className="text-gradient">Compartí todo</span>
            <br />
            lo que ves.
          </h1>

          <p className="text-lg md:text-xl max-w-lg mx-auto leading-relaxed mb-10" style={{ color: "var(--text-secondary)" }}>
            Buscá, guardá, calificá y compartí películas y series. Tu biblioteca audiovisual personal — hermosa, simple, tuya.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/registro"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.04]"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px color-mix(in srgb, var(--accent) 50%, transparent)" }}>
              Crear mi perfil gratis
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.04]"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
              <Play className="w-4 h-4" />
              Ya tengo cuenta
            </a>
          </div>

          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              ["+10K", "títulos"],
              ["5", "estados"],
              ["∞", "listas"],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-extrabold text-gradient leading-none">{n}</p>
                <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending marquee — full width with center spotlight */}
      {trending.length > 0 && (
        <section className="relative py-12 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex items-center justify-center overflow-hidden">
            <div
              className="w-[55%] h-[120%] rounded-full animate-glow"
              style={{ background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 70%)" }}
            />
          </div>
          <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full blur-[110px] animate-glow pointer-events-none"
            style={{ background: "color-mix(in srgb, var(--accent) 35%, transparent)" }} />
          <div className="absolute -right-20 bottom-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
            style={{ background: "rgba(236,72,153,0.22)" }} />

          <div className="relative max-w-6xl mx-auto px-6 md:px-10">
            <div className="flex gap-3 mb-6 items-center">
              <span className="text-xs font-extrabold uppercase tracking-[0.25em]" style={{ color: "var(--text-secondary)" }}>
                Tendencia de la semana
              </span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--accent) 40%, transparent), transparent)" }} />
            </div>
          </div>

          <div className="relative z-10 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex gap-4 md:gap-6 animate-marquee shrink-0">
              {[...trending, ...trending].map((item, i) => (
                <div key={`${item.tmdbId}-${i}`} className="w-40 md:w-52 shrink-0">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden border poster-card"
                    style={{ borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)", boxShadow: "0 10px 30px -12px rgba(0,0,0,0.6)" }}>
                    <img src={getPosterUrl(item.posterPath, "w342")} alt={item.title}
                      className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="relative px-6 md:px-10 py-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-6%] w-96 h-96 rounded-full blur-[130px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute bottom-[-10%] left-[-6%] w-80 h-80 rounded-full blur-[120px] pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />

        <div className="relative max-w-5xl mx-auto">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-center mb-3" style={{ color: "var(--accent-light)" }}>
            Por qué Watchly
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-14"
            style={{ color: "var(--text-primary)" }}>
            Todo tu cine, <span className="text-gradient">en un solo lugar</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Buscá todo", desc: "Encontrá cualquier película o serie de TMDB en segundos, con posters, sinopsis y puntajes reales." },
              { icon: BookOpen, title: "Organizá tu biblioteca", desc: "Estados, calificaciones con estrellas y notas en cada título. Tu colección siempre al día." },
              { icon: Share2, title: "Compartí tu perfil", desc: "Mostrá lo que ves con listas y un perfil público que podés compartir con quien quieras." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title}
                className="group relative glass rounded-[2rem] p-8 overflow-hidden transition-all duration-300 hover:-translate-y-2"
                style={{ boxShadow: "0 20px 50px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-[90px] opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                  style={{ background: i === 1 ? "rgba(236,72,153,0.7)" : i === 2 ? "rgba(56,189,248,0.6)" : "color-mix(in srgb, var(--accent) 80%, transparent)" }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: "var(--gradient-accent)", boxShadow: "0 8px 24px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-extrabold mb-2" style={{ color: "var(--accent-light)" }}>0{i + 1}</p>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="relative px-6 md:px-10 py-20 overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-96 h-96 rounded-full blur-[130px] pointer-events-none"
          style={{ background: "rgba(236,72,153,0.28)" }} />
        <div className="absolute bottom-[-15%] right-[-8%] w-[420px] h-[420px] rounded-full blur-[140px] animate-glow pointer-events-none"
          style={{ background: "rgba(56,189,248,0.22)" }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <HelpCircle className="w-4 h-4" style={{ color: "var(--accent-light)" }} />
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-center" style={{ color: "var(--accent-light)" }}>
              Roadmap
            </p>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-4"
            style={{ color: "var(--text-primary)" }}>
            Lo que se viene <span className="text-gradient">en Watchly</span>
          </h2>
          <p className="text-base max-w-2xl mx-auto text-center mb-14" style={{ color: "var(--text-secondary)" }}>
            Una función diferencial por etapa, medida y consolidada antes de avanzar. Esto es lo que está en camino
            para tu identidad audiovisual.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: Sparkles, title: "ADN Audiovisual", desc: "Tu biblioteca se convierte en un perfil visual de gustos: géneros, décadas y directores. Preliminar desde 5 títulos." },
              { icon: Tv, title: "¿Qué vemos hoy?", desc: "Decinos cómo es tu momento y Watchly elige entre lo que ya querías ver. Sin discusiones y sin IA." },
              { icon: HeartHandshake, title: "Compatibilidad", desc: "Al visitar un perfil público: cuánto comparten sus pantallas y una película para ver juntos." },
              { icon: Users, title: "Modo pareja o grupo", desc: "Una sala con 2 a 8 personas, votación de portadas y una decisión sin discusiones eternas." },
              { icon: Clapperboard, title: "Cápsula y rewatch", desc: "Guardá lo que te dejó cada historia y mirá cómo cambió tu relación con ella con el tiempo." },
              { icon: Star, title: "Créditos del año", desc: "Tus créditos finales: primera y última película del año, mejor calificada y países recorridos." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title}
                className="group relative glass rounded-[2rem] p-7 overflow-hidden transition-all duration-300 hover:-translate-y-2"
                style={{ boxShadow: "0 20px 50px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                  style={{ background: i % 3 === 1 ? "rgba(236,72,153,0.7)" : i % 3 === 2 ? "rgba(56,189,248,0.6)" : "color-mix(in srgb, var(--accent) 80%, transparent)" }} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "var(--gradient-accent)", boxShadow: "0 6px 20px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href="/roadmap"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.04]"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px color-mix(in srgb, var(--accent) 50%, transparent)" }}>
              Ver el roadmap completo
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative px-6 md:px-10 pb-24 overflow-hidden">
        <div className="relative max-w-4xl mx-auto glass rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden"
          style={{ boxShadow: "0 30px 70px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-[120px] animate-glow pointer-events-none"
            style={{ background: "var(--gradient-accent)", opacity: 0.4 }} />
          <div className="absolute bottom-[-45%] right-[-8%] w-72 h-72 rounded-full blur-[110px] pointer-events-none"
            style={{ background: "rgba(236,72,153,0.3)" }} />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
              Empezá hoy. <span className="text-gradient">Gratis.</span>
            </h2>
            <p className="text-base md:text-lg max-w-xl mx-auto mb-9" style={{ color: "var(--text-secondary)" }}>
              Tu perfil de cine te está esperando. Creá tu cuenta en menos de un minuto.
            </p>
            <a href="/registro"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.04]"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 30px color-mix(in srgb, var(--accent) 50%, transparent)" }}>
              Crear mi cuenta
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-8 text-center text-sm border-t"
        style={{ color: "var(--text-secondary)", borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
        <span className="font-extrabold text-gradient">Watchly</span> &mdash; Tu identidad audiovisual.
      </footer>
    </div>
  );
}
