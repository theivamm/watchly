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
  const dragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanup.current?.(), []);
  const [pos, setPos] = useState({ left: false, right: false });
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const update = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const left = el.scrollLeft > 8;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 8;
    setPos((prev) => prev.left === left && prev.right === right ? prev : { left, right });
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    update();
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); };
    el.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [update]);

  useEffect(() => { update(); }, [children, update]);

  const startDrag = (e: React.PointerEvent) => {
    // En táctil se usa el scroll nativo; arrastrar a mano lo traba.
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;
    dragCleanup.current?.();
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false, id: e.pointerId };
    el.style.scrollSnapType = "none";

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
      el.style.scrollSnapType = "";
      dragCleanup.current?.();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    dragCleanup.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.style.scrollSnapType = "";
      drag.current = null;
    };
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
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  useEffect(() => {
    if (!onLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          onLoadMoreRef.current?.();
        }
      },
      { root: railRef.current, rootMargin: "300px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore]);

  useEffect(() => {
    if (!loadingMore) loadingMoreRef.current = false;
  }, [loadingMore]);

  return (
    <div className="relative -mr-4 md:-mr-6">
      <div
        ref={railRef}
        onPointerDown={startDrag}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={onClickCapture}
        className={`flex overflow-x-auto no-scrollbar snap-x snap-proximity md:cursor-grab md:active:cursor-grabbing select-none pr-4 md:pr-6 ${className}`}
        style={{ overscrollBehaviorX: "contain", WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        {children}
        {onLoadMore && (
          <div ref={sentinelRef} className="shrink-0 w-10 flex items-center justify-center">
            {loadingMore && <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-light)" }} />}
          </div>
        )}
      </div>

      {pos.left && (
        <button
          type="button"
          aria-label="Ver anteriores"
          onClick={() => scrollByCards(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full hidden md:flex items-center justify-center hover:scale-110 transition-transform"
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
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full hidden md:flex items-center justify-center hover:scale-110 transition-transform"
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
