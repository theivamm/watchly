import { useAuth } from "@/app/auth-context";
import UserMenu from "@/components/layout/UserMenu";
import MobileMenu from "@/components/layout/MobileMenu";

/** Barra superior compartida por landing, login, registro y roadmap. Sin contenedor: flota sobre la imagen. */
export default function PublicNav({ back }: { back?: string | null }) {
  const { user } = useAuth();
  return (
    <header className="relative z-20 flex items-center gap-1 px-5 md:px-10 pt-7">
      <a href="/" className="font-cinema text-4xl text-white hover:text-white leading-none">Watchly</a>
      <div className="flex-1" />
      {back && <a href={back} className="px-4 py-2.5 text-sm font-extrabold text-white/80 hover:text-white">← Volver</a>}
      <a href="/roadmap" className="hidden sm:block px-4 py-2.5 text-sm font-extrabold text-white/80 hover:text-white">Roadmap</a>
      {user ? <UserMenu /> : (
        <>
          <MobileMenu buttonClass="sm:hidden" items={[{ to: "/", label: "Inicio" }, { to: "/roadmap", label: "Roadmap" }, { to: "/login", label: "Iniciar sesión" }, { to: "/registro", label: "Crear cuenta", primary: true }]} />
          <a href="/login" className="hidden sm:block px-4 py-2.5 text-sm font-extrabold text-white/80 hover:text-white whitespace-nowrap">Iniciar sesión</a>
          <a href="/registro" className="hidden sm:flex ml-2 h-11 px-6 rounded-full bg-white text-[#111] hover:text-[#111] flex items-center text-sm font-extrabold whitespace-nowrap transition-transform hover:scale-[1.04]">Crear cuenta</a>
        </>
      )}
    </header>
  );
}
