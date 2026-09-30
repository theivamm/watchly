import "@/styles/cinema.css";
import { X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface SavePromptModalProps {
  onClose: () => void;
}

export default function SavePromptModal({ onClose }: SavePromptModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in text-white" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="liquid-glass relative w-full max-w-md overflow-hidden rounded-[2.5rem] p-9 md:p-11 text-center animate-pop" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-24 -right-16 w-60 h-60 rounded-full blur-[90px] cinema-drift-a pointer-events-none" style={{ background: "hsl(265 80% 50% / .6)" }} />
        <div className="absolute -bottom-28 -left-16 w-56 h-56 rounded-full blur-[90px] cinema-drift-b pointer-events-none" style={{ background: "hsl(320 75% 45% / .5)" }} />

        <button onClick={onClose} aria-label="Cerrar"
          className="liquid-glass-sm absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
          <X className="w-4 h-4" />
        </button>

        <div className="relative">
          <span className="liquid-glass-sm inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-widest mb-5">
            <Sparkles className="w-3.5 h-3.5" /> ¡Buen ojo!
          </span>
          <h2 className="font-cinema text-5xl leading-[1.02] mb-4">¿Vos también querés guardar tus películas?</h2>
          <p className="text-sm leading-relaxed mb-8 text-white/80">
            Armá tu biblioteca, marcá lo que querés ver, puntuá tus favoritas y compartí tu perfil.
            Es gratis, sin tarjeta y te lleva 30 segundos.
          </p>
          <Link to="/" className="block w-full h-14 leading-[3.5rem] rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03]">
            Empezar ahora
          </Link>
          <Link to="/login" className="block mt-4 text-sm font-bold text-white/80 hover:text-white">
            Ya tengo cuenta · Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
