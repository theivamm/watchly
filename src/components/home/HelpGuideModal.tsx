import "@/styles/cinema.css";
import { X, Search, BookOpen, Star, List, Dna, TrendingUp } from "lucide-react";

interface HelpGuideModalProps {
  onClose: () => void;
}

const steps = [
  { icon: Search, title: "Buscá títulos", desc: "Usá la barra de búsqueda para encontrar películas y series por nombre. Podés filtrar por tipo (película o serie)." },
  { icon: BookOpen, title: "Agregá a tu biblioteca", desc: "Cuando encuentres algo que te interese, guardalo en tu biblioteca con un estado: Quiero ver, Viendo, Completado, Pausado o Abandonado." },
  { icon: Star, title: "Calificá y opinioná", desc: "Dale una puntuación de 1 a 5 estrellas y escribí notas sobre cómo te pareció cada título." },
  { icon: List, title: "Creá listas temáticas", desc: "Organizá tus títulos favoritos en listas personalizadas: por género, por mood, por época, como quieras." },
  { icon: Dna, title: "Conocé tu ADN", desc: "Descubrí tu ADN audiovisual: un resumen de tus gustos, géneros favoritos y patrones de visualización." },
  { icon: TrendingUp, title: "Descubrí tendencias", desc: "Encontrá lo que está trending en el momento y agregalo directamente a tu biblioteca desde el home." },
];

export default function HelpGuideModal({ onClose }: HelpGuideModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in text-white" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="liquid-glass relative w-full max-w-xl max-h-[88vh] overflow-y-auto no-scrollbar rounded-[2.5rem] p-7 md:p-10 animate-pop" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Cerrar" onClick={onClose}
          className="liquid-glass-sm absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
          <X className="w-4 h-4" />
        </button>

        <p className="text-xs font-extrabold uppercase tracking-[.25em] text-white/60 mb-3">Guía rápida</p>
        <h2 className="font-cinema text-5xl leading-none">¿Qué puedo hacer en Watchly?</h2>
        <p className="text-sm mt-3 mb-7 text-white/70">Paso a paso para aprovechar al máximo la plataforma.</p>

        <div className="space-y-3">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="frost-card flex gap-4 p-4 rounded-[1.5rem]">
              <div className="w-11 h-11 rounded-full bg-white text-[#111] flex items-center justify-center shrink-0 font-cinema text-xl">{i + 1}</div>
              <div>
                <p className="text-sm font-extrabold mb-1 flex items-center gap-2"><Icon className="w-4 h-4 text-white/70" /> {title}</p>
                <p className="text-xs leading-relaxed text-white/75">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
