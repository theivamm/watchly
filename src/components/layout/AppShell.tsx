import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";
import { useAuth } from "@/app/auth-context";

export default function AppShell() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "transparent" }}>
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
