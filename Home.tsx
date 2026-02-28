import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { SideDrawer } from "@/components/nook/SideDrawer";
import { Plus, Compass, User, Bell, FlaskConical, Menu } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { NavTabBar } from "@/components/nook/NavTabBar";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, emailVerified, resendVerification } = useAuth();
  const unreadCount = useUnreadNotifications();
  const { isAdmin } = useAdminRole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  // Passive background trigger: run auto-mark-noshow at most once per hour per session
  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    if (now - lastRunRef.current < ONE_HOUR) return;
    lastRunRef.current = now;
    supabase.functions.invoke("auto-mark-noshow").catch(() => {
      // Silently fail — non-critical background job
    });
  }, [user]);

  const header = (
    <div className="flex items-center justify-between">
      {/* Left: Menu icon */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Center: empty spacer */}
      <div />

      {/* Right: Notification bell */}
      <button
        onClick={() => navigate("/notifications")}
        className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
        )}
      </button>
    </div>
  );

  if (loading) return null;

  return (
    <>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <MobileLayout header={header} centered footer={<NavTabBar />}>
        <div className="w-full space-y-5 animate-fade-in">

          {/* Email verification banner */}
          {user && !emailVerified && (
            <div className="nook-section flex items-center justify-between gap-3 py-3 border-warning/30 bg-warning/8 text-sm">
              <span className="text-foreground">Please verify your email address.</span>
              <button
                onClick={() => user.email && resendVerification(user.email)}
                className="text-primary text-xs font-medium whitespace-nowrap hover:underline"
              >
                Resend
              </button>
            </div>
          )}

          {/* Hero */}
          <div className="text-center pt-2 pb-4">
            <h1 className="text-4xl font-bold text-foreground mb-2.5 tracking-tight">Nook</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
              Small circles. Public spaces. Real conversations. 🤍
            </p>
          </div>

          {/* Action cards */}
          <div className="space-y-3.5">
            <button
              onClick={() => navigate("/raise")}
              className="w-full nook-card-hover p-5 text-left rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-primary/20 nook-btn-press"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/12 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h3 className="font-semibold text-foreground text-[1.05rem] mb-0.5">Create a Nook ✨</h3>
                  <p className="text-muted-foreground text-sm">Plan a simple group meetup</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/explore")}
              className="w-full nook-card-hover p-5 text-left rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-primary/20 nook-btn-press"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-6 h-6 text-accent-foreground" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h3 className="font-semibold text-foreground text-[1.05rem] mb-0.5">Explore Nooks 🔎</h3>
                  <p className="text-muted-foreground text-sm">Find a small meetup near you</p>
                </div>
              </div>
            </button>

            {user && (
              <button
                onClick={() => navigate("/my-nooks")}
                className="w-full nook-card-hover p-5 text-left rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-primary/20 nook-btn-press"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-foreground/70" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="font-semibold text-foreground text-[1.05rem] mb-0.5">My Nooks 📌</h3>
                    <p className="text-muted-foreground text-sm">Meetups you've created & joined</p>
                  </div>
                </div>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate("/founder")}
                className="w-full p-5 rounded-[1.25rem] border border-dashed border-primary/30 text-left nook-btn-press focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 hover:bg-primary/4 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="font-semibold text-foreground text-[1.05rem] mb-0.5">🧪 Founder Mode</h3>
                    <p className="text-muted-foreground text-sm">Database, emails, flags, logs & more</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </MobileLayout>
    </>
  );
}
