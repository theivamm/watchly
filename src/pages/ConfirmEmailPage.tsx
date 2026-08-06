import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ConfirmEmailPage() {
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
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] animate-glow pointer-events-none"
        style={{ background: "var(--glow-violet)" }}
      />
      <div className="relative text-center max-w-md">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "var(--gradient-accent)",
            boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 40%, transparent)",
          }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>Confirmar email</h1>
        <p style={{ color: "var(--text-secondary)" }}>{message}</p>
      </div>
    </div>
  );
}
