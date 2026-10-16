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
  return <header className="sticky top-0 z-40 px-4 md:px-8 pt-3 pb-2 text-white bg-gradient-to-b from-[#0d0b16]/85 via-[#0d0b16]/50 to-transparent pointer-events-none">
    <div className="flex items-center max-w-2xl mx-auto pointer-events-auto">
      <div ref={root} className="relative flex-1 basis-full sm:basis-auto min-w-0" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
        <form role="search" onSubmit={(e) => { e.preventDefault(); search(query); }} className="flex items-center gap-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 px-5 shadow-[0_8px_30px_rgba(0,0,0,.3)] transition-all focus-within:bg-white/15 focus-within:border-white/40 focus-within:shadow-[0_8px_40px_rgba(255,255,255,.12)]">
          <Search size={18} className="shrink-0 text-white/60" />
          <input ref={input} aria-label="Buscar películas y series" aria-expanded={open && query.trim().length >= 2} aria-controls="search-suggestions" value={query} onFocus={() => setOpen(true)} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} placeholder="Películas, series, tu próxima historia…" className="w-full min-w-0 bg-transparent outline-none h-11 text-sm placeholder:text-white/50" />
          {query && <button type="button" aria-label="Borrar búsqueda" onClick={() => { setQuery(""); input.current?.focus(); }}><X size={16} /></button>}
          <kbd className="hidden md:inline-flex shrink-0 items-center rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white/60">Ctrl K</kbd><button type="submit" className="sr-only">Buscar</button>
        </form>
        {open && query.trim().length >= 2 && <div id="search-suggestions" className="absolute top-full mt-2 inset-x-0 bg-[#1c1929] border border-white/20 shadow-2xl rounded-2xl p-2 max-h-[65svh] overflow-y-auto">
          <p className="text-xs text-white/60 px-3 py-2" role="status">{isFetching || query.trim() !== debounced ? "Buscando…" : isError ? "No pudimos cargar sugerencias. Podés reintentar la búsqueda." : "Coincidencias rápidas"}</p>
          {query.trim() === debounced && !isError && data?.results.slice(0, 5).map((item) => <button key={`${item.mediaType}-${item.tmdbId}`} type="button" onClick={() => search(item.title)} className="flex items-center gap-3 w-full p-2 rounded-xl text-left hover:bg-white/10 focus-visible:bg-white/10">
            <img src={getPosterUrl(item.posterPath, "w200")} alt="" className="w-9 h-14 rounded-lg object-cover" /><span className="min-w-0"><span className="block font-bold text-sm truncate">{item.title}</span><span className="text-xs text-white/60">{item.mediaType === "movie" ? "Película" : "Serie"} · {item.year ?? "Sin fecha"}</span></span>
          </button>)}
          <button type="button" onClick={() => search(query)} className="w-full text-left p-3 text-sm font-bold text-violet-200">Ver todos los resultados →</button>
        </div>}
      </div>
    </div>
  </header>;
}
