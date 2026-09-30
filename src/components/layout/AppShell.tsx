import "@/styles/cinema.css";
import type { CSSProperties } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";
import { AmbientLayer, useAmbient } from "./AmbientBackground";
import { useAuth } from "@/app/auth-context";

export default function AppShell() {
  const { user } = useAuth();
  const amb = useAmbient();
  return (
    <div className="relative min-h-screen flex" style={{ backgroundColor: "transparent", ...(amb.vars as CSSProperties) }}>
      <AmbientLayer items={amb.items} index={amb.index} />
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
