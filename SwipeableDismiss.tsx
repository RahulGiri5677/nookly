import { useRef, useState, useCallback, type ReactNode } from "react";

interface SwipeableDismissProps {
  children: ReactNode;
  onDismiss: () => void;
  threshold?: number;
}

export function SwipeableDismiss({ children, onDismiss, threshold = 120 }: SwipeableDismissProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Lock direction on first significant move
    if (!locked.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      locked.current = true;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical scroll – ignore
        return;
      }
      setIsSwiping(true);
    }

    if (!isSwiping && locked.current) return;

    // Only allow left swipe
    if (dx < 0) {
      setOffsetX(dx);
    }
  }, [isSwiping]);

  const handleTouchEnd = useCallback(() => {
    if (offsetX < -threshold) {
      setDismissed(true);
      setTimeout(onDismiss, 250);
    } else {
      setOffsetX(0);
    }
    setIsSwiping(false);
  }, [offsetX, threshold, onDismiss]);

  const progress = Math.min(Math.abs(offsetX) / threshold, 1);

  if (dismissed) {
    return (
      <div className="overflow-hidden transition-all duration-250 ease-out" style={{ maxHeight: 0, opacity: 0, marginBottom: 0 }} />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background reveal on swipe */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-2xl bg-destructive/15"
        style={{ opacity: progress }}
      >
        <span className="text-sm font-medium text-destructive">Remove</span>
      </div>

      {/* Swipeable card */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? "none" : "transform 0.25s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
