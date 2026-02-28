import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { computeBadge } from "@/components/profile/CredibilityBadge";
import { useRef, useEffect } from "react";
import { hapticLight } from "@/lib/haptics";
import {
  User,
  Bookmark,
  Compass,
  Plus,
  Bell,
  LogOut,
  Sun,
  Moon,
  X,
  Settings,
  ChevronRight,
} from "lucide-react";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // ── Swipe-to-close gesture ────────────────────────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const dx = touchStartX.current - e.changedTouches[0].clientX;
      if (dx > 60) onClose(); // swipe left to close
      touchStartX.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onClose]);

  const { data: profile } = useQuery({
    queryKey: ["side-drawer-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles" as any)
        .select("display_name, full_name, meetups_hosted, meetups_attended, no_shows, profile_photo_url")
        .eq("user_id", user!.id)
        .single();
      return data as any;
    },
    enabled: !!user,
  });

  const { data: feedbackStats } = useQuery({
    queryKey: ["side-drawer-feedback", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("feedback")
        .select("rating")
        .eq("to_user_id", user!.id);
      if (!data || data.length === 0) return null;
      return (data.reduce((s, f) => s + f.rating, 0) / data.length).toFixed(1);
    },
    enabled: !!user,
  });

  const badge = profile
    ? computeBadge(
        profile.meetups_hosted ?? 0,
        profile.meetups_attended ?? 0,
        profile.no_shows ?? 0,
        feedbackStats ? parseFloat(feedbackStats) : undefined
      )
    : null;

  const displayName =
    profile?.display_name ||
    profile?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "You";

  const go = (path: string) => {
    hapticLight();
    onClose();
    navigate(path);
  };

  const handleSignOut = async () => {
    hapticLight();
    onClose();
    await signOut();
    navigate("/");
  };

  const navItems = [
    { icon: User, label: "My Profile", path: "/profile" },
    { icon: Bookmark, label: "My Nooks", path: "/my-nooks" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Plus, label: "Raise a Nook", path: "/raise" },
  ];

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          open
            ? "opacity-100 pointer-events-auto backdrop-blur-sm bg-black/30"
            : "opacity-0 pointer-events-none backdrop-blur-none bg-black/0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 left-0 z-50 h-full w-[82%] max-w-sm bg-card border-r border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          borderRadius: "0 1.5rem 1.5rem 0",
        }}
      >
        {/* Close button */}
        <div className="flex justify-between items-center px-4 pt-4 pb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Menu</p>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4.5 h-4.5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">

          {/* ── Profile Preview ── */}
          <button
            onClick={() => go("/profile")}
            className="w-full mb-5 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/10">
                {profile?.profile_photo_url ? (
                  <img
                    src={`${profile.profile_photo_url.split("?")[0]}?t=${Date.now()}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-base leading-tight truncate">
                  {displayName}
                </p>
                {badge && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    {badge.emoji} {badge.label}
                    {feedbackStats && (
                      <span className="ml-1 text-muted-foreground">· ⭐ {feedbackStats}</span>
                    )}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          </button>

          {/* ── Primary Navigation ── */}
          <nav className="space-y-0.5">
            {navItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-secondary transition-colors text-left min-h-[48px] active:scale-[0.98]"
              >
                <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground text-sm">{label}</span>
              </button>
            ))}
          </nav>

          {/* ── Divider ── */}
          <div className="my-3 border-t border-border" />

          {/* ── Account & Settings section label ── */}
          <p className="px-4 pt-1 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Account &amp; Settings
          </p>

          {/* Theme toggle */}
          <button
            onClick={() => { hapticLight(); setTheme(theme === "light" ? "dark" : "light"); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-secondary transition-colors text-left min-h-[48px] active:scale-[0.98]"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
            <span className="font-medium text-foreground text-sm">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>

          {/* Account Settings */}
          <button
            onClick={() => go("/profile/edit")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-secondary transition-colors text-left min-h-[48px] active:scale-[0.98]"
          >
            <Settings className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-foreground text-sm">Account Settings</span>
          </button>

          {/* Notification settings */}
          <button
            onClick={() => go("/settings/notifications")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-secondary transition-colors text-left min-h-[48px] active:scale-[0.98]"
          >
            <Bell className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-foreground text-sm">Notification Settings</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-secondary transition-colors text-left min-h-[48px] active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-destructive/80 text-sm">Sign Out</span>
          </button>

          {/* Swipe hint */}
          <p className="text-center text-xs text-muted-foreground/40 pt-4 pb-2">
            Swipe left to close
          </p>
        </div>
      </div>
    </>
  );
}
