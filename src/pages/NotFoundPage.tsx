import { Link } from "react-router-dom";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import { useTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Página no encontrada | Watchly");
  const { data } = useTrending("all");
  const items = (data?.results || []).filter((i) => i.posterPath && i.backdropPath).slice(0, 5);
  const hero = useHeroCycle(items.map((i) => i.posterPath));

  return (
    <div className="relative min-h-screen overflow-hidden text-white flex items-center justify-center px-6">
      <HeroBackdrop items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} />
      <div className="liquid-glass relative z-10 rounded-[3rem] px-10 md:px-20 py-14 text-center">
        <h1 className="font-cinema text-[9rem] md:text-[13rem] leading-none" style={{ color: "#fff" }}>404</h1>
        <p className="font-cinema text-3xl md:text-4xl mt-2 mb-8">Página no encontrada</p>
        <Link to="/" className="inline-flex h-14 px-9 items-center rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03]">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
