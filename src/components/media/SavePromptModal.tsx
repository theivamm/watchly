import { X, Sparkles, Clapperboard } from "lucide-react";
import { Link } from "react-router-dom";

interface SavePromptModalProps {
  onClose: () => void;
}

export default function SavePromptModal({ onClose }: SavePromptModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      style={{ backgroundColor: "rgba(5,5,12,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border p-8 md:p-10 text-center animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--surface-1)",
          borderColor: "rgba(139,92,246,0.35)",
          boxShadow: "0 0 0 1px rgba(139,92,246,0.15), 0 40px 80px -20px rgba(139,92,246,0.5), 0 0 120px 20px rgba(139,92,246,0.15)",
        }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full blur-[90px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute -bottom-24 -left-16 w-52 h-52 rounded-full blur-[80px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative">
          {/* Floating icon */}
          <div className="relative w-20 h-20 mx-auto mb-7">
            <div className="absolute -inset-3 rounded-full opacity-60 blur-2xl animate-pulse"
              style={{ background: "var(--gradient-accent)" }} />
            <div className="absolute -inset-1 rounded-full"
              style={{ background: "var(--gradient-accent)" }} />
            <div className="relative w-20 h-20 rounded-full bg-[#0b0b14] flex items-center justify-center animate-float"
              style={{ boxShadow: "0 20px 50px -10px rgba(139,92,246,0.6)" }}>
              <Clapperboard className="w-8 h-8" style={{ color: "#c4b5fd" }} />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: "var(--accent-soft)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
            <Sparkles className="w-3.5 h-3.5" /> ¡Buen ojo!
          </span>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-3"
            style={{ color: "var(--text-primary)" }}>
            ¿Vos también querés <span className="text-gradient">guardar tus películas</span>?
          </h2>

          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
            Armá tu biblioteca, marcá lo que querés ver, puntuá tus favoritas y compartí tu perfil.
            Es gratis, sin tarjeta y te lleva 30 segundos.
          </p>

          <Link to="/"
            className="block w-full px-6 py-4 rounded-full text-sm font-bold transition-all hover:scale-[1.03]"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px rgba(139,92,246,0.55)" }}>
            Empezar ahora
          </Link>

          <Link to="/login"
            className="block mt-3 text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: "#c4b5fd" }}>
            Ya tengo cuenta · Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
