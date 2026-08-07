import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, HelpCircle, ChevronRight, LogIn, UserPlus, Rocket, Layers } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import UserMenu from "@/components/layout/UserMenu";
import { usePageTitle } from "@/hooks/usePageTitle";

interface Stage {
  n: number;
  title: string;
  value: string;
  desc: string;
  tag: string;
  priority: "inmediata" | "media" | "expansión";
}

const stages: Stage[] = [
  {
    n: 0,
    title: "Consolidación del núcleo",
    value: "Confianza y estabilidad",
    desc: "Auditoría completa de autenticación, emails, OAuth, RLS, rendimiento y analítica. Sin funciones nuevas hasta que la base sea sólida.",
    tag: "Base",
    priority: "inmediata",
  },
  {
    n: 1,
    title: "ADN Audiovisual",
    value: "Identidad y viralidad",
    desc: "Transformá tu biblioteca en un perfil de gustos: géneros, décadas, países, directores y una frase resumen. Preliminar desde 5 títulos, completo desde 10. Tarjeta compartible.",
    tag: "Diferencial",
    priority: "inmediata",
  },
  {
    n: 2,
    title: "¿Qué vemos hoy?",
    value: "Ayuda para decidir",
    desc: "Elegí un modo — Sorprendeme, Algo rápido, Quiero reírme — y Watchly elige entre lo que ya querías ver. Reglas deterministas, sin IA.",
    tag: "Diferencial",
    priority: "inmediata",
  },
  {
    n: 3,
    title: "Compatibilidad",
    value: "Conexión entre perfiles",
    desc: "Al visitar un perfil público: porcentaje de compatibilidad, géneros compartidos, títulos en común y una sugerencia para ver juntos.",
    tag: "Social",
    priority: "inmediata",
  },
  {
    n: 4,
    title: "Modo pareja o grupo",
    value: "Decisión compartida",
    desc: "Creá una sala con 2 a 8 personas, votá portadas con Sí / No / Me da igual y dejá que Watchly encuentre coincidencias.",
    tag: "Social",
    priority: "media",
  },
  {
    n: 5,
    title: "Cápsula después de verla",
    value: "Recuerdo emocional",
    desc: "Al terminar un título: qué sensación te dejó, si la volverías a ver y a quién se la recomendarías. Notas con y sin spoilers.",
    tag: "Memoria",
    priority: "media",
  },
  {
    n: 6,
    title: "Línea de tiempo y rewatch",
    value: "Memoria longitudinal",
    desc: "Mirá cómo cambió tu relación con las historias: cada rewatch con su calificación, su cápsula y sus hitos personales.",
    tag: "Memoria",
    priority: "media",
  },
  {
    n: 7,
    title: "Pasaporte cinematográfico",
    value: "Exploración cultural",
    desc: "Mapa del mundo coloreado por lo que viste, países descubiertos y tarjeta compartible.",
    tag: "Exploración",
    priority: "media",
  },
  {
    n: 8,
    title: "Retos personales",
    value: "Hábitos y retención",
    desc: "Retos de exploración sin rankings ni rachas punitivas: películas por año, países, décadas y sagas completas.",
    tag: "Exploración",
    priority: "expansión",
  },
  {
    n: 9,
    title: "Estanterías por contexto",
    value: "Organización útil",
    desc: "Guardá cada historia para su momento: noche de lluvia, para ver en pareja, menos de 90 minutos, para llorar tranquilo.",
    tag: "Expansión",
    priority: "expansión",
  },
  {
    n: 10,
    title: "Prestame tu perfil",
    value: "Recomendación social",
    desc: "Compartí una selección con URL propia — Mis 10 recomendaciones, Lo mejor del año — sin exponer toda la biblioteca.",
    tag: "Social",
    priority: "expansión",
  },
  {
    n: 11,
    title: "Mensaje al futuro",
    value: "Vínculo emocional",
    desc: "Dejá una nota privada que se desbloquea en 6 meses, un año o la próxima vez que vuelvas a ver ese título.",
    tag: "Memoria",
    priority: "expansión",
  },
  {
    n: 12,
    title: "Créditos personales del año",
    value: "Recapitulación compartible",
    desc: "Tus créditos finales: primera y última película del año, mejor calificada, países recorridos y evolución del ADN.",
    tag: "Expansión",
    priority: "expansión",
  },
];

const priorityMeta = {
  inmediata: {
    label: "Prioridad inmediata",
    color: "var(--accent-light)",
    bg: "color-mix(in srgb, var(--accent) 14%, transparent)",
    border: "color-mix(in srgb, var(--accent) 35%, transparent)",
    desc: "El diferencial central de Watchly",
    flow: "Registrar → Entender → Elegir → Conectar",
  },
  media: {
    label: "Prioridad media",
    color: "#f9a8d4",
    bg: "rgba(244,114,182,0.12)",
    border: "rgba(244,114,182,0.35)",
    desc: "Salas, memoria y exploración",
    flow: "Compartir → Recordar → Explorar",
  },
  expansión: {
    label: "Prioridad de expansión",
    color: "#fcd34d",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.35)",
    desc: "Hábitos, organización y recapitulación",
    flow: "Hábitos → Organizar → Celebrar",
  },
} as const;

export default function RoadmapPage() {
  usePageTitle("Roadmap | Watchly");
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-gradient transition-transform duration-500"
            style={{ transform: scrolled ? "scale(0.9)" : "scale(1)" }}>
            Watchly
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login"
                  className="flex items-center gap-2 px-3 sm:px-5 h-11 rounded-full text-sm font-semibold transition-all hover:opacity-80"
                  style={{ color: "var(--text-primary)", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Link>
                <Link to="/registro"
                  className="flex items-center gap-2 px-3 sm:px-5 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.04]"
                  style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Crear cuenta</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 md:px-10 pt-16 pb-20 overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[520px] h-[520px] rounded-full blur-[130px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute bottom-[-25%] right-[-8%] w-[480px] h-[480px] rounded-full blur-[130px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-7"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
            <Rocket className="w-3.5 h-3.5" />
            Roadmap de producto
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6"
            style={{ color: "var(--text-primary)" }}>
            Lo que se viene
            <br />
            <span className="text-gradient">en Watchly</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Watchly es tu identidad audiovisual: lo que viste, lo que sentiste y lo próximo que querés descubrir.
            Una función diferencial por etapa, medida y consolidada antes de avanzar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            {[
              ["13", "etapas"],
              ["1", "función por etapa"],
              ["100%", "mobile-first"],
            ].map(([n, l]) => (
              <div key={l} className="px-6 py-4 rounded-2xl border" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                <p className="text-2xl font-extrabold text-gradient leading-none">{n}</p>
                <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stages */}
      <section className="px-6 md:px-10 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] mb-3" style={{ color: "var(--accent-light)" }}>
              Las etapas
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              De la base a <span className="text-gradient">tu identidad audiovisual</span>
            </h2>
            <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Cada etapa resuelve un problema concreto y mide su uso antes de consolidarse. Las fechas se asignarán
              según el estado real de la app y los aprendizajes de cada fase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stages.map((stage) => {
              const meta = priorityMeta[stage.priority];
              return (
                <article key={stage.n}
                  className="relative rounded-3xl border p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                  style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                  <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[80px] opacity-0 hover:opacity-60 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "var(--gradient-accent)" }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: meta.color }}>
                        Etapa {stage.n}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide"
                        style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}>
                        {stage.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold mb-1.5" style={{ color: "var(--text-primary)" }}>
                      {stage.title}
                    </h3>
                    <p className="text-sm font-bold mb-3" style={{ color: meta.color }}>
                      {stage.value}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {stage.desc}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Priorities */}
      <section className="px-6 md:px-10 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] mb-3" style={{ color: "var(--accent-light)" }}>
              Prioridades
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              El orden <span className="text-gradient">importa</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(Object.keys(priorityMeta) as (keyof typeof priorityMeta)[]).map((key) => {
              const meta = priorityMeta[key];
              const list = stages.filter((s) => s.priority === key);
              return (
                <div key={key} className="rounded-3xl border p-7"
                  style={{ backgroundColor: "var(--surface-1)", borderColor: meta.border }}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide mb-4"
                    style={{ color: meta.color, backgroundColor: meta.bg }}>
                    <Layers className="w-3.5 h-3.5" />
                    {meta.label}
                  </div>
                  <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{meta.desc}</p>
                  <ul className="space-y-2.5">
                    {list.map((s) => (
                      <li key={s.n} className="flex items-center gap-2.5 text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                        {s.title}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-5 border-t" style={{ borderColor: meta.border }}>
                    <p className="text-xs font-bold tracking-wide" style={{ color: meta.color }}>{meta.flow}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Next step */}
      <section className="px-6 md:px-10 pb-24">
        <div className="relative max-w-4xl mx-auto rounded-[2.5rem] border p-10 md:p-14 text-center overflow-hidden"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)" }}>
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-[120px] animate-glow pointer-events-none"
            style={{ background: "var(--gradient-accent)", opacity: 0.35 }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
              <Sparkles className="w-3.5 h-3.5" />
              Próximo paso
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              El <span className="text-gradient">ADN Audiovisual</span>
            </h2>
            <p className="text-base max-w-xl mx-auto mb-9" style={{ color: "var(--text-secondary)" }}>
              Confirmar la base estable, implementar y probar el ADN, y medir desbloqueo, visualización y
              compartidos antes de pasar a «¿Qué vemos hoy?».
            </p>
            <Link to="/registro"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.04]"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 30px color-mix(in srgb, var(--accent) 50%, transparent)" }}>
              Crear mi cuenta
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-8 text-center text-sm border-t flex items-center justify-center gap-2"
        style={{ color: "var(--text-secondary)", borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
        <HelpCircle className="w-4 h-4" />
        <span><span className="font-extrabold text-gradient">Watchly</span> — Roadmap basado en WATCHLY_ROADMAP.md</span>
      </footer>
    </div>
  );
}
