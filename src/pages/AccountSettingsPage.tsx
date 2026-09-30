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

  const danger = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-sm font-extrabold transition-transform hover:scale-[1.02]";

  return (
    <div className="w-full px-5 md:px-10 py-8 md:py-12 max-w-4xl text-white">
      <PageHeader title="Cuenta" eyebrow="Configuración" />
      <SettingsNav />

      <div className="space-y-5">
        <div className="liquid-glass rounded-[2rem] p-6 md:p-8">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-white/60 mb-3">Email</h3>
          <p className="text-base font-bold">{user?.email}</p>
        </div>

        <div className="liquid-glass rounded-[2rem] p-6 md:p-8">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-white/60 mb-3">Cerrar sesión</h3>
          <p className="text-sm mb-5 text-white/75">Cerrá la sesión en este dispositivo.</p>
          <button onClick={handleLogout} className={`${danger} w-full`} style={{ color: "#fca5a5" }}>
            Cerrar sesión
          </button>
        </div>

        <div className="liquid-glass rounded-[2rem] p-6 md:p-8" style={{ borderColor: "rgba(248,113,113,.4)" }}>
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#fca5a5" }}>
            <AlertTriangle className="w-4 h-4" /> Eliminar cuenta
          </h3>
          <p className="text-sm mb-5 text-white/75">Esta acción es irreversible. Se eliminarán todos tus datos, listas y progresos.</p>

          {!showConfirm && (
            <button onClick={() => setShowConfirm(true)} className={danger} style={{ color: "#fca5a5" }}>
              <Trash2 className="w-4 h-4" /> Eliminar cuenta
            </button>
          )}

          {showConfirm && (
            <div className="space-y-4">
              <p className="text-sm text-white/80">Escribí <strong>DELETE</strong> o <strong>BORRAR</strong> para confirmar:</p>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="glass-input" placeholder="DELETE" />
              {deleteError && <p className="text-sm font-bold text-red-300">{deleteError}</p>}
              <div className="flex gap-3">
                <button onClick={handleDeleteAccount} disabled={deleting || (confirmText !== "DELETE" && confirmText !== "BORRAR")}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full text-sm font-extrabold transition-transform hover:scale-[1.02] disabled:opacity-50"
                  style={{ backgroundColor: "#f87171", color: "#2a0a0a", boxShadow: "0 8px 28px rgba(248,113,113,.4)" }}>
                  {deleting ? "Eliminando..." : <><Check className="w-4 h-4" /> Confirmar borrado</>}
                </button>
                <button onClick={() => { setShowConfirm(false); setConfirmText(""); setDeleteError(""); }} className="frost-tab flex-1 justify-center !h-12">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
