import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthShell from "@/components/auth/AuthShell";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ConfirmEmailPage() {
  usePageTitle("Confirmá tu email | Watchly");
  const [message, setMessage] = useState("Verificando...");

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          setMessage("¡Email verificado! Redirigiendo...");
          setTimeout(() => {
            window.location.href = "/onboarding";
          }, 1500);
        }
      });
    }
  }, []);

  return (
    <AuthShell title="Confirmar email" subtitle="Estamos validando tu cuenta">
      <div className="flex items-center gap-4">
        <div className="w-6 h-6 rounded-full border-2 border-white/25 border-t-white animate-spin shrink-0" />
        <p className="text-sm font-bold text-white/90">{message}</p>
      </div>
    </AuthShell>
  );
}
