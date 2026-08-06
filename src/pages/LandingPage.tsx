import { useEffect, useState } from "react";
import { Search, BookOpen, Share2, Sparkles, ArrowRight, Play, Star, LogIn, UserPlus, HelpCircle, Clapperboard, Tv, HeartHandshake, Users } from "lucide-react";
import { useTrending } from "@/hooks/useMedia";
import { getPosterUrl } from "@/services/tmdb";
import { useAuth } from "@/app/auth-context";
import UserMenu from "@/components/layout/UserMenu";
import type { TMDBSearchResult } from "@/types";

function PosterArt({ items }: { items: TMDBSearchResult[] }) {
  const picks = items.filter((i) => i.posterPath).slice(0, 6);
  const positions = [
    "top-0 left-0 rotate-[-10deg] z-10",
    "top-8 left-[30%] rotate-[4deg] z-20",
    "top-0 right-0 rotate-[8deg] z-10",
    "bottom-0 left-[8%] rotate-[6deg] z-30",
    "bottom-4 right-[18%] rotate-[-6deg] z-20",
    "bottom-[-4%] left-[40%] rotate-[10deg] z-10",
  ];
  const anims = ["animate-float", "animate-float-delay", "animate-float", "animate-float-delay", "animate-float", "animate-float-delay"];

  return (
    <div className="relative w-full max-w-[460px] h-[480px] mx-auto">
      <div className="absolute inset-0 rounded-full blur-[100px] animate-glow"
        style={{ background: "var(--gradient-accent)", opacity: 0.35 }} />
      {picks.slice(0, 6).map((item, i) => (
        <div
          key={`${item.tmdbId}-${i}`}
          className={`absolute w-28 md:w-32 aspect-[2/3] rounded-xl overflow-hidden border ${positions[i]} ${anims[i]}`}
          style={{ borderColor: "rgba(139,92,246,0.35)", boxShadow: "0 20px 50px -12px rgba(0,0,0,0.7)" }}
        >
          <img src={getPosterUrl(item.posterPath, "w200")} alt={item.title}
            className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass rounded-2xl px-5 py-3 flex items-center gap-3 z-40"
        style={{ boxShadow: "0 12px 40px -10px rgba(139,92,246,0.5)" }}>
        <Star className="w-5 h-5 fill-[#c4b5fd] stroke-[#c4b5fd]" />
        <div>
          <p className="text-sm font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>
            Miles de títulos
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>de TMDB al instante</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const { data } = useTrending("all");
  const trending = data?.results || [];
  const [scrolled, setScrolled] = useState(false);
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);

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
          borderBottom: scrolled ? "1px solid rgba(139,92,246,0.18)" : "1px solid transparent",
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
                  style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
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

      {/* Hero */}
      <section className="relative flex-1 flex items-center px-6 md:px-10 pt-12 pb-16 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[520px] h-[520px] rounded-full blur-[130px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute bottom-[-15%] right-[-8%] w-[480px] h-[480px] rounded-full blur-[130px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-7"
              style={{ backgroundColor: "var(--accent-soft)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
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

            <p className="text-lg md:text-xl max-w-lg leading-relaxed mb-10" style={{ color: "var(--text-secondary)" }}>
              Buscá, guardá, calificá y compartí películas y series. Tu biblioteca audiovisual personal — hermosa, simple, tuya.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a href="/registro"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.04]"
                style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px rgba(139,92,246,0.5)" }}>
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

            <div className="flex items-center gap-6 mt-10">
              {[
                ["+10K", "títulos"],
                ["5", "estados"],
                ["∞", "listas"],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="text-2xl font-extrabold text-gradient leading-none">{n}</p>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Poster collage */}
          <div className="hidden lg:block">
            <PosterArt items={trending} />
          </div>
        </div>
      </section>

      {/* Trending marquee */}
      {trending.length > 0 && (
        <section className="py-6 overflow-hidden border-y" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
          <div className="flex gap-3 mb-5 px-6 items-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.25em]" style={{ color: "var(--text-secondary)" }}>
              Tendencia de la semana
            </span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.4), transparent)" }} />
          </div>
          <div className="flex overflow-hidden">
            <div className="flex gap-4 md:gap-6 animate-marquee shrink-0">
              {[...trending, ...trending].map((item, i) => (
                <div key={`${item.tmdbId}-${i}`} className="w-40 md:w-56 shrink-0">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden border"
                    style={{ borderColor: "rgba(139,92,246,0.2)" }}>
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
      <section className="px-6 md:px-10 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-center mb-3" style={{ color: "#c4b5fd" }}>
            Por qué Watchly
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-14"
            style={{ color: "var(--text-primary)" }}>
            Todo tu cine, <span className="text-gradient">en un solo lugar</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Search, title: "Buscá todo", desc: "Encontrá cualquier película o serie de TMDB en segundos, con posters, sinopsis y puntajes reales." },
              { icon: BookOpen, title: "Organizá tu biblioteca", desc: "Estados, calificaciones con estrellas y notas en cada título. Tu colección siempre al día." },
              { icon: Share2, title: "Compartí tu perfil", desc: "Mostrá lo que ves con listas y un perfil público que podés compartir con quien quieras." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title}
                className="group relative rounded-3xl border p-8 overflow-hidden transition-all duration-300 hover:-translate-y-2"
                style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                  style={{ background: "var(--gradient-accent)" }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: "var(--gradient-accent)", boxShadow: "0 6px 20px rgba(139,92,246,0.4)" }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-extrabold mb-2" style={{ color: "#c4b5fd" }}>0{i + 1}</p>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="px-6 md:px-10 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <HelpCircle className="w-4 h-4" style={{ color: "#c4b5fd" }} />
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-center" style={{ color: "#c4b5fd" }}>
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
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group relative rounded-3xl border p-7 overflow-hidden transition-all duration-300 hover:-translate-y-2"
                style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                  style={{ background: "var(--gradient-accent)" }} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "var(--gradient-accent)", boxShadow: "0 6px 20px rgba(139,92,246,0.4)" }}>
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
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px rgba(139,92,246,0.5)" }}>
              Ver el roadmap completo
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 md:px-10 pb-24">
        <div className="relative max-w-4xl mx-auto rounded-[2.5rem] border p-10 md:p-16 text-center overflow-hidden"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.3)" }}>
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-[120px] animate-glow pointer-events-none"
            style={{ background: "var(--gradient-accent)", opacity: 0.35 }} />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
              Empezá hoy. <span className="text-gradient">Gratis.</span>
            </h2>
            <p className="text-base md:text-lg max-w-xl mx-auto mb-9" style={{ color: "var(--text-secondary)" }}>
              Tu perfil de cine te está esperando. Creá tu cuenta en menos de un minuto.
            </p>
            <a href="/registro"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.04]"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 30px rgba(139,92,246,0.5)" }}>
              Crear mi cuenta
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-8 text-center text-sm border-t"
        style={{ color: "var(--text-secondary)", borderColor: "rgba(139,92,246,0.15)" }}>
        <span className="font-extrabold text-gradient">Watchly</span> &mdash; Datos proporcionados por TMDB.
      </footer>
    </div>
  );
}
