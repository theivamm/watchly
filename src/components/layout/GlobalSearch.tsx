import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useMediaSearch } from "@/hooks/useMedia";
import { useDebounce } from "@/hooks/useDebounce";
import { getPosterUrl } from "@/services/tmdb";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const current = location.pathname === "/buscar" ? params.get("q") ?? "" : "";
  const [query, setQuery] = useState(current);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(query.trim());
  const { data, isFetching, isError } = useMediaSearch(open ? debounced : "");
  useEffect(() => { setQuery(current); setOpen(false); }, [current, location.pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); }
      if (e.key === "Escape") setOpen(false);
    };
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", key); document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, []);
  const search = (value: string) => {
    setOpen(false); input.current?.blur();
    navigate(`/buscar?${new URLSearchParams({ q: value.trim() })}`);
  };
  return <header className="sticky top-0 z-40 h-0 text-white pointer-events-none">
    <div className="absolute inset-x-0 top-3 px-4 md:px-8"><div className="flex items-center max-w-2xl mx-auto pointer-events-auto">
      <div ref={root} className="relative flex-1 basis-full sm:basis-auto min-w-0" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
        <div className="ai-border rounded-full"><form role="search" onSubmit={(e) => { e.preventDefault(); search(query); }} className="ai-border-inner flex items-center gap-3 rounded-full px-5">
          <Search size={18} className="shrink-0 text-white/60" />
          <input ref={input} aria-label="Buscar películas y series" aria-expanded={open && query.trim().length >= 2} aria-controls="search-suggestions" value={query} onFocus={() => setOpen(true)} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} placeholder="Películas, series, tu próxima historia…" className="w-full min-w-0 bg-transparent outline-none h-11 text-sm placeholder:text-white/50" style={{ outline: "none", boxShadow: "none" }} />
          {query && <button type="button" aria-label="Borrar búsqueda" onClick={() => { setQuery(""); input.current?.focus(); }}><X size={16} /></button>}
          <kbd className="hidden md:inline-flex shrink-0 items-center rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white/60">Ctrl K</kbd><button type="submit" className="sr-only">Buscar</button>
        </form></div>
        {open && query.trim().length >= 2 && <div id="search-suggestions" className="absolute top-full mt-3 inset-x-0 rounded-[1.75rem] border border-white/20 p-4 max-h-[75svh] overflow-y-auto shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)]"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.03)), rgba(18,16,30,.82)", backdropFilter: "blur(32px) saturate(1.8)", WebkitBackdropFilter: "blur(32px) saturate(1.8)" }}>
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60" role="status">{isFetching || query.trim() !== debounced ? "Buscando…" : isError ? "No pudimos cargar sugerencias" : "Coincidencias rápidas"}</p>
            <button type="button" onClick={() => search(query)} className="text-xs font-extrabold text-white hover:opacity-80">Ver todos →</button>
          </div>
          {query.trim() === debounced && !isError && <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {data?.results.slice(0, 5).map((item) => <button key={`${item.mediaType}-${item.tmdbId}`} type="button" onClick={() => search(item.title)} className="group text-left min-w-0">
              <span className="relative block aspect-[2/3] rounded-2xl overflow-hidden border border-white/15 bg-white/5 shadow-[0_14px_30px_-12px_rgba(0,0,0,.7)] transition-[border-color,box-shadow] group-hover:border-white/50 group-focus-visible:border-white/50">
                <img src={getPosterUrl(item.posterPath, "w342")} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-extrabold">{item.mediaType === "movie" ? "Película" : "Serie"}</span>
                {item.tmdbRating ? <span className="absolute bottom-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-extrabold">★ {item.tmdbRating.toFixed(1)}</span> : null}
              </span>
              <span className="block mt-2 text-[13px] font-extrabold leading-tight line-clamp-2">{item.title}</span>
              <span className="block text-[11px] text-white/60 mt-0.5">{item.year ?? "Sin fecha"}</span>
            </button>)}
          </div>}
        </div>}
      </div>
    </div>
    </div>
  </header>;
}
