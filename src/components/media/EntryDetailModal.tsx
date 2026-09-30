import "@/styles/cinema.css";
import { useEffect, useState } from "react";
import { X, Star, Plus, Quote, Share2, Check } from "lucide-react";
import { getPosterUrl, getBackdropUrl, getMediaDetails } from "@/services/tmdb";
import type { Entry, EntryStatus, TMDBMediaDetails } from "@/types";

interface EntryDetailModalProps {
  entry: Entry;
  onClose: () => void;
  onAction?: () => void;
  shareUrl?: string | null;
}

const STATUS_LABELS: Record<EntryStatus, string> = {
  want_to_watch: "Quiero ver",
  watching: "Viendo",
  completed: "Completado",
  paused: "Pausado",
  dropped: "Abandonado",
};

const STATUS_COLORS: Record<EntryStatus, string> = {
  want_to_watch: "hsl(265 90% 78%)",
  watching: "hsl(145 70% 65%)",
  completed: "hsl(210 90% 72%)",
  paused: "hsl(48 95% 68%)",
  dropped: "hsl(0 90% 74%)",
};

export default function EntryDetailModal({ entry, onClose, onAction, shareUrl }: EntryDetailModalProps) {
  const [details, setDetails] = useState<TMDBMediaDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const rating = entry.rating ?? 0;

  useEffect(() => {
    let active = true;
    getMediaDetails(entry.media_type, entry.tmdb_id)
      .then((d) => { if (active) setDetails(d); })
      .catch(() => {});
    return () => { active = false; };
  }, [entry.media_type, entry.tmdb_id]);

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const description = details?.overview || entry.description;
  const year = details?.year ?? null;
  const genres = details?.genres ?? [];
  const posterUrl = getPosterUrl(entry.poster_path, "w500");
  const heroImg = details?.backdropPath ? getBackdropUrl(details.backdropPath, "w1280") : null;
  const roundBtn = "liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in text-white" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[2.5rem] border border-white/20 animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#0b0b14", boxShadow: "0 40px 120px -24px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.2)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src={heroImg ?? posterUrl} alt="" aria-hidden="true" className="absolute top-0 inset-x-0 w-full h-[360px] object-cover"
            style={heroImg ? undefined : { filter: "blur(36px) saturate(1.3)", transform: "scale(1.4)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,11,20,.3) 0, rgba(11,11,20,.8) 220px, #0b0b14 380px)" }} />
        </div>

        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
          {shareUrl && (
            <button onClick={handleShare} className={roundBtn} title={copied ? "¡Link copiado!" : "Copiar link para compartir"} style={{ color: copied ? "#86efac" : undefined }}>
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onClose} className={roundBtn} aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative z-10 max-h-[92vh] overflow-y-auto no-scrollbar p-7 md:p-10 pt-20">
          <div className="flex flex-col sm:flex-row gap-7 items-start sm:items-end">
            <img src={posterUrl} alt={entry.title} className="w-36 sm:w-44 shrink-0 aspect-[2/3] object-cover rounded-[1.75rem] border border-white/25 shadow-[0_30px_70px_-15px_rgba(0,0,0,.85)]" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-full text-xs font-extrabold liquid-glass-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[entry.status] }} />
                  {STATUS_LABELS[entry.status]}
                </span>
                <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">
                  {entry.media_type === "movie" ? "Película" : "Serie"}{year ? ` · ${year}` : ""}
                </span>
              </div>
              <h2 className="font-cinema text-5xl md:text-6xl leading-[1.02] mb-3">{entry.title}</h2>
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {genres.map((g) => <span key={g} className="px-3 py-1 rounded-full text-[11px] font-bold border border-white/25 text-white/85">{g}</span>)}
                </div>
              )}
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5" fill={rating >= s ? "#fff" : "none"} stroke={rating >= s ? "#fff" : "rgba(255,255,255,.5)"} strokeWidth={1.6} />
                  ))}
                  <span className="ml-2 text-sm font-extrabold">{rating}/5</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="frost-card rounded-[1.75rem] p-6">
              <p className="text-xs font-extrabold uppercase tracking-widest text-white/60 mb-3">Descripción</p>
              <p className="text-sm leading-relaxed text-white/90">{description || "Sin descripción disponible."}</p>
            </div>
            {entry.notes && (
              <div className="frost-card rounded-[1.75rem] p-6">
                <div className="flex items-center gap-2 mb-3"><Quote className="w-4 h-4 text-white/70" /><p className="text-xs font-extrabold uppercase tracking-widest text-white/60">Mi comentario</p></div>
                <p className="text-sm leading-relaxed text-white/90">{entry.notes}</p>
              </div>
            )}
            {onAction && (
              <button onClick={onAction}
                className="w-full inline-flex items-center justify-center gap-2 h-14 rounded-full bg-white text-[#111] font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02]">
                <Plus className="w-4 h-4" strokeWidth={2.6} /> Agregar a mi biblioteca
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
