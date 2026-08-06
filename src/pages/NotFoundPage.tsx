import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] animate-glow pointer-events-none"
        style={{ background: "var(--glow-violet)" }}
      />
      <div className="relative text-center">
        <div className="relative inline-block mb-6">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <h1 className="text-8xl font-extrabold tracking-tight relative text-gradient">404</h1>
        </div>
        <p className="text-lg md:text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Página no encontrada</p>
        <Link
          to="/"
          className="inline-block px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
