import "@/styles/cinema.css";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";
import { useAuth } from "@/app/auth-context";

export default function AppShell() {
  const { user } = useAuth();
  return (
    <div className="relative min-h-screen flex" style={{ backgroundColor: "transparent" }}>
      {/* Ambiente: manchas de color en movimiento para que el vidrio tenga qué desenfocar */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-[10%] w-[720px] h-[720px] rounded-full blur-[140px] opacity-40 cinema-drift-a"
          style={{ background: "hsl(265 80% 45%)" }} />
        <div className="absolute -bottom-52 right-[5%] w-[760px] h-[760px] rounded-full blur-[150px] opacity-30 cinema-drift-b"
          style={{ background: "hsl(320 75% 42%)" }} />
      </div>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className={`flex-1 ${user ? "pb-24 md:pb-0" : ""}`}>
          <Outlet />
        </main>
        <MobileNavigation />
      </div>
    </div>
  );
}
