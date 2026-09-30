import "@/styles/cinema.css";
import { Link, useLocation } from "react-router-dom";

const settingsItems = [
  { to: "/configuracion/perfil", label: "Perfil" },
  { to: "/configuracion/cuenta", label: "Cuenta" },
];

export default function SettingsNav() {
  const location = useLocation();

  return (
    <nav className="flex gap-2.5 mb-8">
      {settingsItems.map(({ to, label }) => (
        <Link key={to} to={to} data-active={location.pathname === to} className="frost-tab hover:text-white data-[active=true]:hover:text-[#111]">
          {label}
        </Link>
      ))}
    </nav>
  );
}
