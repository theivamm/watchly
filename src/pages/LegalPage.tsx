import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

type Kind = "privacidad" | "terminos";

const UPDATED = "16 de octubre de 2026";

const content: Record<Kind, { title: string; sections: { h: string; p: string[] }[] }> = {
  privacidad: {
    title: "Política de privacidad",
    sections: [
      { h: "Qué datos guardamos", p: [
        "Tu email y contraseña (cifrada) para que puedas ingresar, o los datos básicos que comparte Google si entrás con esa cuenta.",
        "Lo que cargás en Watchly: perfil, biblioteca, calificaciones, notas, listas, sesiones de visualización y reacciones.",
        "Tu ADN audiovisual, que calculamos a partir de tu biblioteca.",
        "Datos de uso y errores técnicos (por ejemplo: «se agregó un título», «falló una búsqueda», la página y el navegador) para mejorar la app. No incluyen el contenido de tus notas.",
      ] },
      { h: "Para qué los usamos", p: [
        "Para que la app funcione: guardar tu biblioteca, calcular tu ADN y recomendarte títulos.",
        "Para detectar errores y entender qué funciones se usan. No vendemos tus datos ni mostramos publicidad.",
      ] },
      { h: "Qué es público", p: [
        "Tu perfil y tu biblioteca son visibles para otras personas solo si tu perfil es público. Tu ADN es visible solo si activás la opción de compartirlo. Podés cambiar ambas cosas en Configuración.",
      ] },
      { h: "Con quién trabajamos", p: [
        "Supabase (base de datos y autenticación), Vercel (hosting), TMDB y OMDb (información de películas y series), LiveKit (salas en vivo) y Google (si elegís ingresar con Google). Solo reciben lo necesario para prestar su servicio.",
      ] },
      { h: "Tus derechos", p: [
        "Podés editar tus datos en cualquier momento y eliminar tu cuenta desde Configuración → Cuenta. Al eliminarla se borran tu perfil, biblioteca, listas y ADN.",
      ] },
    ],
  },
  terminos: {
    title: "Términos y condiciones",
    sections: [
      { h: "El servicio", p: [
        "Watchly es una biblioteca personal para registrar, calificar y descubrir películas y series. No ofrece ni reproduce contenido audiovisual.",
        "La información de títulos proviene de TMDB y OMDb. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.",
      ] },
      { h: "Tu cuenta", p: [
        "Sos responsable de mantener segura tu contraseña. Tenés que tener al menos 13 años para usar Watchly.",
      ] },
      { h: "Uso aceptable", p: [
        "No publiques contenido ilegal, ofensivo o que infrinja derechos de terceros en tu perfil, notas, listas o salas. Podemos suspender cuentas que lo hagan.",
      ] },
      { h: "Tu contenido", p: [
        "Lo que cargás sigue siendo tuyo. Nos das permiso para guardarlo y mostrarlo según tu configuración de privacidad.",
      ] },
      { h: "Cambios y garantías", p: [
        "Watchly se ofrece «tal cual», sin garantías de disponibilidad continua. Podemos actualizar estos términos; si el cambio es importante, te avisaremos en la app.",
      ] },
    ],
  },
};

export default function LegalPage({ kind }: { kind: Kind }) {
  const doc = content[kind];
  usePageTitle(`${doc.title} | Watchly`);
  return (
    <div className="min-h-screen text-white px-5 md:px-10 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="font-cinema text-3xl hover:opacity-90">Watchly</Link>
        <h1 className="font-cinema text-5xl md:text-6xl leading-none mt-10">{doc.title}</h1>
        <p className="text-sm text-white/55 mt-3">Última actualización: {UPDATED}</p>
        <div className="mt-10 space-y-9">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-extrabold">{s.h}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/80">
                {s.p.map((t) => <p key={t}>{t}</p>)}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-14 pt-6 border-t border-white/10 text-sm text-white/60">
          Ver también: {kind === "privacidad"
            ? <Link to="/terminos" className="underline hover:text-white">Términos y condiciones</Link>
            : <Link to="/privacidad" className="underline hover:text-white">Política de privacidad</Link>}
        </p>
      </div>
    </div>
  );
}
