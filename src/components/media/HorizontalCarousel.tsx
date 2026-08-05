import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface HorizontalCarouselProps {
  children: ReactNode;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  className?: string;
}

export default function HorizontalCarousel({
  children,
  onLoadMore,
  loadingMore = false,
  className = "",
}: HorizontalCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const justDragged = useRef(false);
  const drag = useRef<{ x: number; left: number; moved: boolean; id: number } | null>(null);
  const [pos, setPos] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setPos({ left: el.scrollLeft > 8, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, children]);

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false, id: e.pointerId };

    const onMove = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.id) return;
      const dx = ev.clientX - d.x;
      if (Math.abs(dx) > 5) d.moved = true;
      el.scrollLeft = d.left - dx;
    };

    const onUp = (ev: PointerEvent) => {
      if (drag.current?.id !== ev.pointerId) return;
      if (drag.current.moved) {
        justDragged.current = true;
        setTimeout(() => {
          justDragged.current = false;
        }, 60);
      }
      drag.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (justDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const scrollByCards = (dir: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onLoadMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { root: railRef.current, rootMargin: "300px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore]);

  return (
    <div className="relative">
      <div
        ref={railRef}
        onPointerDown={startDrag}
        onClickCapture={onClickCapture}
        className={`flex overflow-x-auto no-scrollbar snap-x scroll-smooth cursor-grab active:cursor-grabbing select-none ${className}`}
      >
        {children}
        {onLoadMore && (
          <div ref={sentinelRef} className="shrink-0 w-10 flex items-center justify-center">
            {loadingMore && <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#c4b5fd" }} />}
          </div>
        )}
      </div>

      {pos.left && (
        <button
          type="button"
          aria-label="Ver anteriores"
          onClick={() => scrollByCards(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{
            backgroundColor: "rgba(15,15,26,0.85)",
            border: "1px solid var(--border)",
            color: "#fff",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {pos.right && (
        <button
          type="button"
          aria-label="Ver más"
          onClick={() => scrollByCards(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{
            backgroundColor: "rgba(15,15,26,0.85)",
            border: "1px solid var(--border)",
            color: "#fff",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
