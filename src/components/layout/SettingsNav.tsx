import { Link, useLocation } from "react-router-dom";

const settingsItems = [
  { to: "/configuracion/perfil", label: "Perfil" },
  { to: "/configuracion/cuenta", label: "Cuenta" },
];

export default function SettingsNav() {
  const location = useLocation();

  return (
    <nav className="flex gap-1.5 mb-8 p-1.5 rounded-full border"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
      {settingsItems.map(({ to, label }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: active ? "var(--accent-soft)" : "transparent",
              color: active ? "var(--accent-light)" : "var(--text-secondary)",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
