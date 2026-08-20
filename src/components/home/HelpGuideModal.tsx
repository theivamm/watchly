import { X, Search, BookOpen, Star, List, Dna, TrendingUp } from "lucide-react";

interface HelpGuideModalProps {
  onClose: () => void;
}

const steps = [
  {
    icon: Search,
    title: "Buscá títulos",
    desc: "Usá la barra de búsqueda para encontrar películas y series por nombre. Podés filtrar por tipo (película o serie).",
  },
  {
    icon: BookOpen,
    title: "Agregá a tu biblioteca",
    desc: "Cuando encuentres algo que te interese, guardalo en tu biblioteca con un estado: Quiero ver, Viendo, Completado, Pausado o Abandonado.",
  },
  {
    icon: Star,
    title: "Calificá y opinioná",
    desc: "Dale una puntuación de 1 a 5 estrellas y escribí notas sobre cómo te pareció cada título.",
  },
  {
    icon: List,
    title: "Creá listas temáticas",
    desc: "Organizá tús títulos favoritos en listas personalizadas: por género, por mood, por época, como quieras.",
  },
  {
    icon: Dna,
    desc: "Descubrí tu ADN audiovisual: un resumen de tus gustos, géneros favoritos y patrones de visualización.",
    title: "Conocé tu ADN",
  },
  {
    icon: TrendingUp,
    title: "Descubrí tendencias",
    desc: "Encontrá lo que está trending en el momento y agregalo directamente a tu biblioteca desde el home.",
  },
];

export default function HelpGuideModal({ onClose }: HelpGuideModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl p-6 md:p-8 animate-pop"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent-light)" }}>
            Guía rápida
          </p>
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            ¿Qué puedo hacer en Watchly?
          </h2>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Paso a paso para aprovechar al máximo la plataforma.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-2xl"
              style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-accent)" }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {i + 1}. {title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
