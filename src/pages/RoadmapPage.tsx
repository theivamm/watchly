import { Link } from "react-router-dom";
import { useAuth } from "@/app/auth-context";
import UserMenu from "@/components/layout/UserMenu";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import { useTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import { usePageTitle } from "@/hooks/usePageTitle";

type Priority = "inmediata" | "media" | "expansión";

interface Stage {
  n: number;
  title: string;
  value: string;
  desc: string;
  tag: string;
  priority: Priority;
}

const stages: Stage[] = [
  { n: 0, title: "Consolidación del núcleo", value: "Confianza y estabilidad", desc: "Auditoría completa de autenticación, emails, OAuth, RLS, rendimiento y analítica. Sin funciones nuevas hasta que la base sea sólida.", tag: "Base", priority: "inmediata" },
  { n: 1, title: "ADN Audiovisual", value: "Identidad y viralidad", desc: "Transformá tu biblioteca en un perfil de gustos: géneros, décadas, países, directores y una frase resumen. Preliminar desde 5 títulos, completo desde 10. Tarjeta compartible.", tag: "Diferencial", priority: "inmediata" },
  { n: 2, title: "¿Qué vemos hoy?", value: "Ayuda para decidir", desc: "Elegí un modo — Sorprendeme, Algo rápido, Quiero reírme — y Watchly elige entre lo que ya querías ver. Reglas deterministas, sin IA.", tag: "Diferencial", priority: "inmediata" },
  { n: 3, title: "Compatibilidad", value: "Conexión entre perfiles", desc: "Al visitar un perfil público: porcentaje de compatibilidad, géneros compartidos, títulos en común y una sugerencia para ver juntos.", tag: "Social", priority: "inmediata" },
  { n: 4, title: "Modo pareja o grupo", value: "Decisión compartida", desc: "Creá una sala con 2 a 8 personas, votá portadas con Sí / No / Me da igual y dejá que Watchly encuentre coincidencias.", tag: "Social", priority: "media" },
  { n: 5, title: "Cápsula después de verla", value: "Recuerdo emocional", desc: "Al terminar un título: qué sensación te dejó, si la volverías a ver y a quién se la recomendarías. Notas con y sin spoilers.", tag: "Memoria", priority: "media" },
  { n: 6, title: "Línea de tiempo y rewatch", value: "Memoria longitudinal", desc: "Mirá cómo cambió tu relación con las historias: cada rewatch con su calificación, su cápsula y sus hitos personales.", tag: "Memoria", priority: "media" },
  { n: 7, title: "Pasaporte cinematográfico", value: "Exploración cultural", desc: "Mapa del mundo coloreado por lo que viste, países descubiertos y tarjeta compartible.", tag: "Exploración", priority: "media" },
  { n: 8, title: "Retos personales", value: "Hábitos y retención", desc: "Retos de exploración sin rankings ni rachas punitivas: películas por año, países, décadas y sagas completas.", tag: "Exploración", priority: "expansión" },
  { n: 9, title: "Estanterías por contexto", value: "Organización útil", desc: "Guardá cada historia para su momento: noche de lluvia, para ver en pareja, menos de 90 minutos, para llorar tranquilo.", tag: "Expansión", priority: "expansión" },
  { n: 10, title: "Prestame tu perfil", value: "Recomendación social", desc: "Compartí una selección con URL propia — Mis 10 recomendaciones, Lo mejor del año — sin exponer toda la biblioteca.", tag: "Social", priority: "expansión" },
  { n: 11, title: "Mensaje al futuro", value: "Vínculo emocional", desc: "Dejá una nota privada que se desbloquea en 6 meses, un año o la próxima vez que vuelvas a ver ese título.", tag: "Memoria", priority: "expansión" },
  { n: 12, title: "Créditos personales del año", value: "Recapitulación compartible", desc: "Tus créditos finales: primera y última película del año, mejor calificada, países recorridos y evolución del ADN.", tag: "Expansión", priority: "expansión" },
];

const priorityMeta: Record<Priority, { label: string; desc: string; flow: string; color?: string }> = {
  inmediata: { label: "Prioridad inmediata", desc: "El diferencial central de Watchly", flow: "Registrar → Entender → Elegir → Conectar" },
  media: { label: "Prioridad media", desc: "Salas, memoria y exploración", flow: "Compartir → Recordar → Explorar", color: "hsl(330 85% 76%)" },
  expansión: { label: "Prioridad de expansión", desc: "Hábitos, organización y recapitulación", flow: "Hábitos → Organizar → Celebrar", color: "hsl(45 95% 70%)" },
};

export default function RoadmapPage() {
  usePageTitle("Roadmap | Watchly");
  const { user } = useAuth();
  const { data } = useTrending("all");
  const items = (data?.results || []).filter((i) => i.posterPath && i.backdropPath).slice(0, 5);
  const hero = useHeroCycle(items.map((i) => i.posterPath));
  const accent = { color: hero.accent, transition: "color 1.2s" } as const;
  const colorOf = (p: Priority) => priorityMeta[p].color ?? hero.accent;

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden min-h-[80svh] flex flex-col">
        <HeroBackdrop items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

        <header className="relative z-20 px-4 md:px-10 pt-6">
          <div className="liquid-glass mx-auto max-w-[1288px] h-16 rounded-full flex items-center gap-2 pl-7 pr-2.5">
            <Link to="/" className="font-cinema text-3xl hover:opacity-90" style={accent}>Watchly</Link>
            <div className="flex-1" />
            {user ? <UserMenu /> : (
              <>
                <Link to="/login" className="liquid-glass-sm h-11 px-5 rounded-full flex items-center text-sm font-bold text-white hover:text-white">Iniciar sesión</Link>
                <Link to="/registro" className="h-11 px-6 rounded-full bg-white text-[#111] hover:text-[#111] flex items-center text-sm font-extrabold">Crear cuenta</Link>
              </>
            )}
          </div>
        </header>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-5 md:px-14 lg:px-24 py-14">
          <span className="liquid-glass-sm inline-flex self-start px-[18px] py-2 rounded-full text-xs font-extrabold tracking-[.2em] uppercase">
            Roadmap de producto
          </span>
          <h1 className="font-cinema mt-7 mb-6 text-6xl md:text-8xl xl:text-[8.5rem] leading-[1.02] drop-shadow-[0_10px_60px_rgba(0,0,0,.4)]">
            Lo que se viene<br /><span style={accent}>en Watchly</span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed font-medium text-white/85 max-w-2xl text-pretty">
            Watchly es tu identidad audiovisual: lo que viste, lo que sentiste y lo próximo que querés descubrir.
            Una función diferencial por etapa, medida y consolidada antes de avanzar.
          </p>
          <div className="liquid-glass self-start flex rounded-[2rem] py-4 px-1.5 mt-10">
            {[["13", "etapas"], ["1", "función por etapa"], ["100%", "mobile-first"]].map(([n, l]) => (
              <div key={l} className="px-7 text-center">
                <div className="font-cinema text-4xl leading-none" style={accent}>{n}</div>
                <div className="text-xs font-bold mt-2 text-white/75">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── ETAPAS ───────── */}
      <section className="relative px-5 md:px-14 lg:px-24 py-20 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[900px] h-[500px] rounded-full blur-[150px] opacity-50 cinema-drift-a pointer-events-none"
          style={{ background: hero.row, transition: "background 1.6s" }} />
        <div className="relative max-w-[1300px] mx-auto">
          <p className="text-xs font-extrabold tracking-[.25em] uppercase text-center" style={accent}>Las etapas</p>
          <h2 className="font-cinema text-5xl md:text-7xl text-center mt-4 mb-5">
            De la base a <span style={accent}>tu identidad audiovisual</span>
          </h2>
          <p className="text-base md:text-lg text-center max-w-2xl mx-auto mb-14 text-white/75">
            Cada etapa resuelve un problema concreto y mide su uso antes de consolidarse. Las fechas se asignarán
            según el estado real de la app y los aprendizajes de cada fase.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stages.map((s) => {
              const c = colorOf(s.priority);
              return (
                <article key={s.n}
                  className="liquid-glass relative overflow-hidden rounded-[2rem] p-7 flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1.5">
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] opacity-30 pointer-events-none" style={{ background: c }} />
                  <div className="relative flex items-start justify-between">
                    <span className="font-cinema text-6xl leading-none" style={{ color: c }}>{String(s.n).padStart(2, "0")}</span>
                    <span className="liquid-glass-sm px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide" style={{ color: c }}>{s.tag}</span>
                  </div>
                  <h3 className="relative font-cinema text-3xl leading-tight mt-3">{s.title}</h3>
                  <p className="relative text-sm font-bold" style={{ color: c }}>{s.value}</p>
                  <p className="relative text-sm leading-relaxed text-white/80 text-pretty">{s.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── PRIORIDADES ───────── */}
      <section className="relative px-5 md:px-14 lg:px-24 pb-20">
        <div className="max-w-[1300px] mx-auto">
          <p className="text-xs font-extrabold tracking-[.25em] uppercase text-center" style={accent}>Prioridades</p>
          <h2 className="font-cinema text-5xl md:text-7xl text-center mt-4 mb-12">El orden <span style={accent}>importa</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(Object.keys(priorityMeta) as Priority[]).map((key) => {
              const meta = priorityMeta[key];
              const c = colorOf(key);
              return (
                <div key={key} className="liquid-glass rounded-[2rem] p-8">
                  <span className="liquid-glass-sm inline-flex px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wide mb-4" style={{ color: c }}>
                    {meta.label}
                  </span>
                  <p className="text-sm text-white/70 mb-5">{meta.desc}</p>
                  <ul className="flex flex-col gap-3">
                    {stages.filter((s) => s.priority === key).map((s) => (
                      <li key={s.n} className="flex items-center gap-3 text-sm font-bold">
                        <span className="font-cinema text-lg w-7" style={{ color: c }}>{String(s.n).padStart(2, "0")}</span>{s.title}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 pt-5 border-t border-white/12 text-xs font-bold tracking-wide" style={{ color: c }}>{meta.flow}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── PRÓXIMO PASO ───────── */}
      <section className="relative px-5 md:px-14 lg:px-24 pb-24">
        <div className="liquid-glass relative max-w-[1100px] mx-auto rounded-[3.5rem] px-8 py-16 text-center overflow-hidden">
          <div className="absolute -top-64 left-1/2 -ml-72 w-[580px] h-[580px] rounded-full blur-[110px] opacity-80 cinema-drift-a pointer-events-none"
            style={{ background: hero.row, transition: "background 1.6s" }} />
          <div className="relative">
            <span className="liquid-glass-sm inline-flex px-[18px] py-2 rounded-full text-xs font-extrabold tracking-[.2em] uppercase mb-6">Próximo paso</span>
            <h2 className="font-cinema text-6xl md:text-8xl leading-none">El <span style={accent}>ADN Audiovisual</span></h2>
            <p className="text-lg text-white/80 mx-auto mt-6 mb-9 max-w-xl">
              Confirmar la base estable, implementar y probar el ADN, y medir desbloqueo, visualización y compartidos antes de pasar a «¿Qué vemos hoy?».
            </p>
            <Link to="/registro" className="inline-flex h-16 px-10 items-center gap-2.5 rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold text-lg shadow-[0_12px_40px_rgba(0,0,0,.35)] hover:scale-[1.03] transition-transform">
              Crear mi cuenta →
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-8 text-center text-sm text-white/60 border-t border-white/10">
        <span className="font-cinema text-lg" style={accent}>Watchly</span> — Roadmap basado en WATCHLY_ROADMAP.md
      </footer>
    </div>
  );
}
