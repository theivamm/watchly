import SettingsNav from "@/components/layout/SettingsNav";

export default function AppearanceSettingsPage() {
  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
        Apariencia
      </h1>

      <SettingsNav />

      <div className="space-y-6">
        <div
          className="rounded-2xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Tema</h3>
          <div className="flex items-center gap-4 p-5 rounded-2xl border"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-accent)" }}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Modo oscuro</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Watchly usa el modo oscuro con acentos violeta.
              </p>
            </div>
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
              Fijo
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Preview</h3>
          <div className="space-y-3">
            <button
              className="w-full h-12 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "var(--gradient-accent)", color: "var(--accent-contrast)", boxShadow: "0 2px 10px rgba(139,92,246,0.35)" }}
            >
              Botón principal
            </button>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-6 h-6" fill={star <= 4 ? "#8b5cf6" : "none"} stroke="#a855f7" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <a href="#" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
              Link de ejemplo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
