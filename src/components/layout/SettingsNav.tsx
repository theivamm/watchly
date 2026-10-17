import "@/styles/cinema.css";
import { Link, useLocation } from "react-router-dom";

const settingsItems = [
  { to: "/configuracion/perfil", label: "Perfil" },
  { to: "/configuracion/cuenta", label: "Cuenta" },
];

export default function SettingsNav() {
  const location = useLocation();
  return (
    <nav className="flex gap-8 border-b border-white/20 mb-10">
      {settingsItems.map(({ to, label }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} className="px-2 pb-3 -mb-px text-base font-extrabold border-b-[3px] transition-colors hover:text-white"
            style={{ borderColor: active ? "#fff" : "transparent", color: active ? "#fff" : "rgba(255,255,255,.65)" }}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
