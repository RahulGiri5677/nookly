import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
}

export function MobileLayout({
  children,
  className,
  header,
  footer,
  centered = false,
}: MobileLayoutProps) {
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

  const observe = useCallback(
    (el: HTMLElement | null, setter: (h: number) => void) => {
      if (!el) return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setter(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);
        }
      });
      ro.observe(el);
      // Read initial height synchronously
      setter(el.getBoundingClientRect().height);
      return () => ro.disconnect();
    },
    []
  );

  useEffect(() => observe(headerRef.current, setHeaderHeight), [header, observe]);
  useEffect(() => observe(footerRef.current, setFooterHeight), [footer, observe]);

  return (
    // Root: full dynamic viewport, no overflow, no scroll
    <div
      className="fixed inset-0 flex flex-col bg-background"
      style={{ height: "100dvh" }}
    >
      {/* ── FIXED HEADER ─────────────────────────────────── */}
      {header && (
        <header
          ref={headerRef}
          className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="max-w-md mx-auto px-5 py-3.5">{header}</div>
        </header>
      )}

      {/* ── SCROLLABLE CONTENT — the ONLY scrolling region ── */}
      <main
        className={cn(
          "absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-none",
          centered && "flex flex-col items-center justify-center",
          className
        )}
        style={{
          // Offset exactly the measured heights (which already include safe-area padding)
          paddingTop: header ? headerHeight : "env(safe-area-inset-top)",
          paddingBottom: footer ? footerHeight : "env(safe-area-inset-bottom)",
        }}
      >
        <div className={cn("nook-container py-5", centered && "w-full")}>{children}</div>
      </main>

      {/* ── FIXED FOOTER ──────────────────────────────────── */}
      {footer && (
        <footer
          ref={footerRef}
          className="fixed bottom-0 left-0 right-0 z-50 px-3"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-md mx-auto mb-2 rounded-2xl bg-card/92 backdrop-blur-md border border-border/50 shadow-[0_-4px_24px_0_hsl(var(--foreground)/0.07)] px-2 pt-1.5 pb-1">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}
