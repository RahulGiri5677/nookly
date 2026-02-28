/**
 * NookToast — Premium in-app notification pop-up system
 *
 * Features:
 * - Closable (✕ button + tap outside)
 * - Auto-dismiss after 5s for non-critical
 * - "View Nook" action button for nook-related toasts
 * - Fade + slide-down exit animation
 * - Haptic feedback on all interactions
 * - Themed with design tokens (no raw colors)
 * - Stays inside safe border (above footer, below header)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle2, AlertCircle, Info, Bell, ArrowRight } from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type NookToastType = "success" | "error" | "info" | "notification";
export type NookToastVariant = "non-critical" | "critical";

export interface NookToastData {
  id: string;
  type: NookToastType;
  variant?: NookToastVariant;
  title: string;
  message?: string;
  nook_id?: string | null;
  /** Override default action label */
  actionLabel?: string;
  /** Override default action route */
  actionRoute?: string;
}

interface NookToastItemProps {
  toast: NookToastData;
  onClose: (id: string) => void;
}

const typeConfig = {
  success: {
    Icon: CheckCircle2,
    bg: "bg-success/10 border-success/25",
    iconColor: "text-success",
    titleColor: "text-foreground",
  },
  error: {
    Icon: AlertCircle,
    bg: "bg-destructive/10 border-destructive/25",
    iconColor: "text-destructive",
    titleColor: "text-foreground",
  },
  info: {
    Icon: Info,
    bg: "bg-primary/8 border-primary/20",
    iconColor: "text-primary",
    titleColor: "text-foreground",
  },
  notification: {
    Icon: Bell,
    bg: "bg-card border-border",
    iconColor: "text-primary",
    titleColor: "text-foreground",
  },
} as const;

function NookToastItem({ toast, onClose }: NookToastItemProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCritical = toast.variant === "critical";

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss for non-critical
  const startDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  }, [toast.id, onClose]);

  useEffect(() => {
    if (!isCritical) {
      timerRef.current = setTimeout(startDismiss, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isCritical, startDismiss]);

  const handleClose = () => {
    hapticLight();
    if (timerRef.current) clearTimeout(timerRef.current);
    startDismiss();
  };

  const handleViewNook = () => {
    hapticMedium();
    if (timerRef.current) clearTimeout(timerRef.current);
    const route = toast.actionRoute ?? (toast.nook_id ? `/nook/${toast.nook_id}` : null);
    if (route) {
      startDismiss();
      setTimeout(() => navigate(route), 150);
    }
  };

  const hasAction = !!(toast.actionRoute || toast.nook_id);
  const { Icon, bg, iconColor, titleColor } = typeConfig[toast.type];

  return (
    <div
      className={cn(
        "relative mx-4 rounded-[22px] border shadow-lg overflow-hidden",
        "transition-all duration-300 ease-out",
        bg,
        visible && !exiting
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-3 scale-[0.97]",
      )}
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Progress bar for auto-dismiss */}
      {!isCritical && (
        <div
          className="absolute top-0 left-0 h-0.5 bg-primary/30 rounded-full"
          style={{
            animation: `toast-progress 5s linear forwards`,
            transformOrigin: "left",
          }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-background/50", iconColor)}>
            <Icon className="w-4.5 h-4.5" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className={cn("text-sm font-semibold leading-tight", titleColor)}>
              {toast.title}
            </p>
            {toast.message && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {toast.message}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/8 transition-colors flex-shrink-0 active:scale-90"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Action button */}
        {hasAction && (
          <div className="mt-3 ml-12">
            <button
              onClick={handleViewNook}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors active:scale-95 active:opacity-80"
            >
              <span>{toast.actionLabel ?? "View Nook"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Global toast store (module-level singleton) ─── */
type Listener = (toasts: NookToastData[]) => void;

let toastQueue: NookToastData[] = [];
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((fn) => fn([...toastQueue]));
}

let toastCounter = 0;

export function showNookToast(data: Omit<NookToastData, "id">): string {
  const id = `nt-${++toastCounter}`;
  toastQueue = [{ ...data, id }, ...toastQueue].slice(0, 3); // max 3 visible
  notifyListeners();
  return id;
}

export function dismissNookToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notifyListeners();
}

/* ─── NookToastContainer — mount once in App ─── */
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const listener: Listener = () => callback();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): NookToastData[] {
  return toastQueue;
}

export function NookToastContainer() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-[9999] left-0 right-0 flex flex-col gap-2.5 pointer-events-none"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 88px)", // above footer
        maxWidth: "448px",
        margin: "0 auto",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <NookToastItem toast={t} onClose={dismissNookToast} />
        </div>
      ))}
    </div>
  );
}
