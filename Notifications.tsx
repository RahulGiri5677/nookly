import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { SwipeableDismiss } from "@/components/nook/SwipeableDismiss";
import {
  Bell, XCircle, CheckCircle2, Clock, Users, Star,
  MapPin, Shield, CheckCheck, Trash2, ArrowRight, MoreVertical, X,
} from "lucide-react";
import { PageHeader } from "@/components/nook/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  nook_id: string | null;
  nook_title: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, typeof Bell> = {
  cancelled: XCircle,
  confirmed: CheckCircle2,
  reminder: Clock,
  new_participant: Users,
  attendance: CheckCircle2,
  no_show: XCircle,
  feedback: Star,
  update: MapPin,
  magic_link: Shield,
  host_transferred: Users,
  new_meetup_suggestion: Bell,
};

const typeColors: Record<string, string> = {
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-destructive/10 text-destructive",
  confirmed: "bg-success/10 text-success",
  attendance: "bg-success/10 text-success",
  feedback: "bg-primary/10 text-primary",
  reminder: "bg-warning/10 text-warning",
  new_participant: "bg-accent/20 text-accent-foreground",
  update: "bg-muted text-muted-foreground",
  magic_link: "bg-muted text-muted-foreground",
};

function getDeepLinkRoute(notification: Notification): string | null {
  switch (notification.type) {
    case "feedback":
      return notification.nook_id ? `/nook/${notification.nook_id}/feedback` : null;
    case "new_meetup_suggestion":
      return "/explore";
    default:
      return notification.nook_id ? `/nook/${notification.nook_id}` : null;
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [actionSheet, setActionSheet] = useState<Notification | null>(null);
  const [detailPopup, setDetailPopup] = useState<Notification | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase
        .from("notifications" as any)
        .update({ is_read: true } as any)
        .eq("id", notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from("notifications" as any)
        .update({ is_read: true } as any)
        .eq("user_id", user!.id)
        .eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase
        .from("notifications" as any)
        .delete()
        .eq("id", notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from("notifications" as any)
        .delete()
        .eq("user_id", user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const handleClick = (notification: Notification) => {
    hapticLight();
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    setDetailPopup(notification);
  };

  const handleNavigateFromDetail = (notification: Notification) => {
    hapticMedium();
    const route = getDeepLinkRoute(notification);
    if (route) navigate(route);
    setDetailPopup(null);
  };

  const handleViewNook = (notification: Notification) => {
    hapticMedium();
    if (!notification.is_read) markReadMutation.mutate(notification.id);
    const route = getDeepLinkRoute(notification);
    if (route) navigate(route);
    setActionSheet(null);
  };

  // Long press handlers
  const handlePressStart = (n: Notification) => {
    const timer = setTimeout(() => {
      hapticMedium();
      setActionSheet(n);
    }, 500);
    setLongPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const unreadExist = notifications.some((n) => !n.is_read);

  const header = (
    <PageHeader
      title="Notifications"
      right={
        unreadExist ? (
          <button
            onClick={() => { hapticLight(); markAllReadMutation.mutate(); }}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 active:scale-95"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Mark all read</span>
          </button>
        ) : undefined
      }
    />
  );

  return (
    <MobileLayout header={header}>
      <div className="animate-fade-in space-y-4">

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">💌</div>
            <h3 className="font-medium text-foreground">No updates yet</h3>
            <p className="text-muted-foreground text-sm">
              Your meetup notifications will appear here.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-1">
              Swipe left to remove · Long press for options
            </p>

            <div className="space-y-2.5">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                const iconColorClass = typeColors[n.type] || "bg-muted text-muted-foreground";
                const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
                const route = getDeepLinkRoute(n);
                const hasRoute = !!route;

                return (
                  <SwipeableDismiss
                    key={n.id}
                    onDismiss={() => deleteMutation.mutate(n.id)}
                  >
                    <div
                      className={`relative w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                        n.is_read
                          ? "bg-card border-border"
                          : "bg-primary/5 border-primary/20"
                      }`}
                      onClick={() => handleClick(n)}
                      onTouchStart={() => handlePressStart(n)}
                      onTouchEnd={handlePressEnd}
                      onMouseDown={() => handlePressStart(n)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColorClass} ${n.is_read ? "opacity-70" : ""}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm ${n.is_read ? "font-normal text-foreground" : "font-semibold text-foreground"} leading-snug`}>
                              {n.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!n.is_read && (
                                <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); hapticLight(); setActionSheet(n); }}
                                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                                aria-label="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground/60">
                              {timeAgo}
                            </p>

                            {/* View Nook inline action */}
                            {hasRoute && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewNook(n); }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors active:scale-95"
                              >
                                <span>{n.type === "feedback" ? "Leave feedback" : "View Nook"}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwipeableDismiss>
                );
              })}
            </div>

            {/* Clear All Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 rounded-xl mt-2"
                  onClick={() => hapticLight()}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Notifications
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[22px] mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all your notifications. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => hapticLight()}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { hapticMedium(); clearAllMutation.mutate(); }}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      {/* Long-press / options action sheet */}
      <Sheet open={!!actionSheet} onOpenChange={(open) => !open && setActionSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-[24px] pb-safe">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-base font-semibold text-foreground line-clamp-1">
              {actionSheet?.title}
            </SheetTitle>
            <p className="text-xs text-muted-foreground line-clamp-1">{actionSheet?.nook_title}</p>
          </SheetHeader>

          <div className="space-y-1 mt-2">
            {/* View Nook */}
            {actionSheet && getDeepLinkRoute(actionSheet) && (
              <button
                onClick={() => actionSheet && handleViewNook(actionSheet)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-secondary/60 transition-colors active:scale-[0.98] text-left"
              >
                <ArrowRight className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {actionSheet?.type === "feedback" ? "Leave Feedback" : "View Nook"}
                </span>
              </button>
            )}

            {/* Mark as read */}
            {actionSheet && !actionSheet.is_read && (
              <button
                onClick={() => {
                  hapticLight();
                  if (actionSheet) markReadMutation.mutate(actionSheet.id);
                  setActionSheet(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-secondary/60 transition-colors active:scale-[0.98] text-left"
              >
                <CheckCheck className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Mark as read</span>
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => {
                hapticMedium();
                if (actionSheet) deleteMutation.mutate(actionSheet.id);
                setActionSheet(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-destructive/8 transition-colors active:scale-[0.98] text-left"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">Remove notification</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Notification Detail Pop-up ───────────────────── */}
      {detailPopup && (() => {
        const n = detailPopup;
        const Icon = typeIcons[n.type] || Bell;
        const iconColorClass = typeColors[n.type] || "bg-muted text-muted-foreground";
        const route = getDeepLinkRoute(n);
        const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });

        return (
          /* Backdrop */
          <div
            className="fixed inset-0 z-[9998] flex items-end justify-center"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
            onClick={() => { hapticLight(); setDetailPopup(null); }}
          >
            {/* Blur overlay */}
            <div className="absolute inset-0 bg-foreground/20" style={{ backdropFilter: "blur(4px)" }} />

            {/* Card */}
            <div
              className="relative w-full max-w-md mx-4 rounded-[24px] border border-border bg-card shadow-2xl overflow-hidden animate-slide-up-fade"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => { hapticLight(); setDetailPopup(null); }}
                className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted transition-colors active:scale-90 z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="p-5 pt-5">
                {/* Icon + type badge */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0", iconColorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      {n.type.replace(/_/g, " ")}
                    </p>
                    {n.nook_title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.nook_title}</p>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold text-foreground leading-snug mb-2">
                  {n.title}
                </h2>

                {/* Body */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {n.message}
                </p>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground/50 mt-3">{timeAgo}</p>

                {/* Actions */}
                <div className={cn("mt-4 flex gap-2", route ? "justify-between" : "justify-end")}>
                  {route && (
                    <button
                      onClick={() => handleNavigateFromDetail(n)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all active:scale-95 hover:opacity-90"
                    >
                      <span>{n.type === "feedback" ? "Leave Feedback" : "View Nook"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { hapticLight(); setDetailPopup(null); }}
                    className="px-4 py-2.5 rounded-xl bg-muted/60 text-muted-foreground text-sm font-medium transition-all active:scale-95 hover:bg-muted"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </MobileLayout>
  );
}
