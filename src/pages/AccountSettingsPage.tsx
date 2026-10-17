import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/auth-context";
import { AlertTriangle, Trash2, Check } from "lucide-react";
import SettingsNav from "@/components/layout/SettingsNav";
import PageHeader from "@/components/ui/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AccountSettingsPage() {
  usePageTitle("Configuración de cuenta | Watchly");
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE" && confirmText !== "BORRAR") return;

    setDeleting(true);
    setDeleteError("");

    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) {
        setDeleteError(error.message);
      } else {
        await supabase.auth.signOut();
        window.location.href = "/?account_deleted=1";
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setDeleting(false);
    }
  };

  const danger = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-base font-extrabold transition-transform hover:scale-[1.02]";
  const h = "font-cinema text-3xl md:text-4xl leading-none";

  return (
    <div className="w-full px-4 md:px-6 pt-20 pb-12 text-white">
      <PageHeader title="Cuenta" eyebrow="Configuración" subtitle={user?.email} />
      <SettingsNav />

      <div className="grid gap-12 lg:grid-cols-3">
        <section className="border-t border-white/20 pt-6">
          <h2 className={h}>Email</h2>
          <p className="text-xl font-bold mt-6 break-all">{user?.email}</p>
        </section>

        <section className="border-t border-white/20 pt-6">
          <h2 className={h}>Sesión</h2>
          <p className="text-base mt-6 mb-6 text-white/75">Cerrá la sesión en este dispositivo.</p>
          <button onClick={handleLogout} className={`${danger} w-full`} style={{ color: "#fca5a5" }}>Cerrar sesión</button>
        </section>

        <section className="pt-6 border-t" style={{ borderColor: "rgba(248,113,113,.6)" }}>
          <h2 className={`${h} flex items-center gap-3`} style={{ color: "#fca5a5" }}><AlertTriangle className="w-7 h-7" /> Eliminar cuenta</h2>
          <p className="text-base mt-6 mb-6 text-white/75">Esta acción es irreversible. Se eliminarán todos tus datos, listas y progresos.</p>

          {!showConfirm && (
            <button onClick={() => setShowConfirm(true)} className={danger} style={{ color: "#fca5a5" }}><Trash2 className="w-4 h-4" /> Eliminar cuenta</button>
          )}

          {showConfirm && (
            <div className="space-y-4">
              <p className="text-base text-white/85">Escribí <strong>DELETE</strong> o <strong>BORRAR</strong> para confirmar:</p>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="glass-input !h-14 !text-base" placeholder="DELETE" />
              {deleteError && <p className="text-sm font-bold text-red-300">{deleteError}</p>}
              <div className="flex gap-3">
                <button onClick={handleDeleteAccount} disabled={deleting || (confirmText !== "DELETE" && confirmText !== "BORRAR")}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-14 rounded-full text-base font-extrabold transition-transform hover:scale-[1.02] disabled:opacity-50"
                  style={{ backgroundColor: "#f87171", color: "#2a0a0a", boxShadow: "0 8px 28px rgba(248,113,113,.4)" }}>
                  {deleting ? "Eliminando..." : <><Check className="w-4 h-4" /> Confirmar</>}
                </button>
                <button onClick={() => { setShowConfirm(false); setConfirmText(""); setDeleteError(""); }} className="liquid-glass-sm flex-1 h-14 rounded-full text-base font-extrabold">Cancelar</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
