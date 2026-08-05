import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/auth-context";
import { AlertTriangle, Trash2, Check } from "lucide-react";
import SettingsNav from "@/components/layout/SettingsNav";

export default function AccountSettingsPage() {
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

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
        Cuenta
      </h1>

      <SettingsNav />

      <div className="space-y-6">
        <div
          className="rounded-3xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Email</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.email}</p>
        </div>

        <div
          className="rounded-3xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Cerrar sesión</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Cerrá la sesión en este dispositivo.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-5 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.25)", boxShadow: "0 2px 10px rgba(239,68,68,0.1)" }}
          >
            Cerrar sesión
          </button>
        </div>

        <div
          className="rounded-3xl border p-6 md:p-8 border-red-500/30"
          style={{ backgroundColor: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#ef4444" }}>
            <AlertTriangle className="w-4 h-4" />
            Eliminar cuenta
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Esta acción es irreversible. Se eliminarán todos tus datos, listas y progresos.
          </p>

          {!showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.25)" }}
            >
              <Trash2 className="w-4 h-4" />
              Eliminar cuenta
            </button>
          )}

          {showConfirm && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Escribí <strong>DELETE</strong> o <strong>BORRAR</strong> para confirmar:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-base outline-none"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                placeholder="DELETE"
              />
              {deleteError && (
                <p className="text-sm" style={{ color: "#ef4444" }}>{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || (confirmText !== "DELETE" && confirmText !== "BORRAR")}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{ backgroundColor: "#ef4444", color: "#fff", boxShadow: "0 4px 18px rgba(239,68,68,0.35)" }}
                >
                  {deleting ? "Eliminando..." : <><Check className="w-4 h-4" /> Confirmar borrado</>}
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(""); setDeleteError(""); }}
                  className="flex-1 px-5 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1.5px solid var(--border)" }}
                >
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
