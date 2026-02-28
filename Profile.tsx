import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { NavTabBar } from "@/components/nook/NavTabBar";
import { NookCard } from "@/components/nook/NookCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/nook/PageHeader";
import { differenceInYears, format } from "date-fns";
import { CredibilityBadge } from "@/components/profile/CredibilityBadge";
import { MeetupStats } from "@/components/profile/MeetupStats";
import { ComfortRating } from "@/components/profile/ComfortRating";
import { ParticipationStyle } from "@/components/profile/ParticipationStyle";
import type { Nook } from "@/types/nook";

const INTEREST_EMOJIS: Record<string, string> = {
  Music: "🎵", Movies: "🎬", Poetry: "✍️", Walking: "🚶",
  Cafés: "☕", Tech: "💻", Art: "🎨", Books: "📚",
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleContactSupport = () => {
    try {
      window.location.href = "mailto:support@nookly.app";
      // If no mail app opens, show fallback after a brief delay
      setTimeout(() => setShowEmailFallback(true), 1500);
    } catch {
      setShowEmailFallback(true);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("support@nookly.app");
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Real-time refresh: invalidate counts AND badge tier on any relevant change
  useEffect(() => {
    if (!user) return;
    const countsKey  = ["profile-meetup-counts", user.id];
    const badgeKey   = ["badge-tier", user.id];

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: countsKey });
      // Badge tier uses weighted recent+lifetime ratio — must recompute after
      // any attendance change (cron processing, exit scan, etc.)
      queryClient.invalidateQueries({ queryKey: badgeKey });
    };

    const memberChannel = supabase
      .channel(`profile-members-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "nook_members",
        filter: `user_id=eq.${user.id}`,
      }, invalidateAll)
      .subscribe();

    const attendanceChannel = supabase
      .channel(`profile-attendance-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "attendance",
        filter: `user_id=eq.${user.id}`,
      }, invalidateAll)
      .subscribe();

    const nooksChannel = supabase
      .channel(`profile-nooks-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "nooks",
        filter: `host_id=eq.${user.id}`,
      }, invalidateAll)
      .subscribe();

    return () => {
      supabase.removeChannel(memberChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(nooksChannel);
    };
  }, [user, queryClient]);


  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  // Live meetup counts from actual tables (not stale profile counters)
  const { data: meetupCounts } = useQuery({
    queryKey: ["profile-meetup-counts", user?.id],
    queryFn: async () => {
      const [{ count: hosted }, { data: memberRows }, { data: attendanceRows }] = await Promise.all([
        supabase.from("nooks").select("*", { count: "exact", head: true }).eq("host_id", user?.id),
        supabase.from("nook_members").select("nook_id").eq("user_id", user?.id).eq("status", "approved"),
        supabase.from("attendance").select("status").eq("user_id", user?.id),
      ]);
      const joined = (memberRows || []).length;
      const attended = (attendanceRows || []).filter(r => r.status === "attended").length;
      const noShows = (attendanceRows || []).filter(r => ["no_show", "host_no_show"].includes(r.status)).length;
      return { hosted: hosted ?? 0, joined, attended, noShows };
    },
    enabled: !!user,
  });

  // Comfort rating + participation style tags from feedback received
  const { data: feedbackStats } = useQuery({
    queryKey: ["profile-feedback-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("feedback")
        .select("rating, tags")
        .eq("to_user_id", user?.id);
      if (!data || data.length === 0) return { avgRating: null, totalMeetups: 0, allTags: [] as string[] };
      const sum = data.reduce((s, f) => s + f.rating, 0);
      const allTags = data.flatMap((f) => f.tags || []);
      return { avgRating: sum / data.length, totalMeetups: data.length, allTags };
    },
    enabled: !!user,
  });

  // Upcoming nooks (hosted + joined)
  const { data: upcomingNooks = [] } = useQuery({
    queryKey: ["profile-upcoming", user?.id],
    queryFn: async () => {
      const now = new Date().toISOString();
      const nookSelect = "id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note";
      const { data: hosted } = await supabase
        .from("nooks").select(nookSelect)
        .eq("host_id", user?.id).gte("date_time", now).neq("status", "cancelled")
        .order("date_time", { ascending: true });
      const { data: memberRows } = await supabase
        .from("nook_members").select("nook_id")
        .eq("user_id", user?.id).eq("status", "approved");
      const joinedIds = (memberRows || []).map((m) => m.nook_id);
      let joined: any[] = [];
      if (joinedIds.length > 0) {
        const { data } = await supabase
          .from("nooks").select(nookSelect)
          .in("id", joinedIds).gte("date_time", now).neq("status", "cancelled")
          .order("date_time", { ascending: true });
        joined = data || [];
      }
      const all = [...(hosted || []), ...joined];
      return Array.from(new Map(all.map((n) => [n.id, n])).values()).map(mapNook);
    },
    enabled: !!user,
  });

  // Past nooks with pending feedback
  const { data: pastNooksWithPendingFeedback = [] } = useQuery({
    queryKey: ["profile-past-pending", user?.id],
    queryFn: async () => {
      const now = new Date().toISOString();
      const nookSelect = "id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note";
      const { data: hosted } = await supabase
        .from("nooks").select(nookSelect)
        .eq("host_id", user?.id).lt("date_time", now)
        .order("date_time", { ascending: false }).limit(20);
      const { data: memberRows } = await supabase
        .from("nook_members").select("nook_id")
        .eq("user_id", user?.id).eq("status", "approved");
      const joinedIds = (memberRows || []).map((m) => m.nook_id);
      let joined: any[] = [];
      if (joinedIds.length > 0) {
        const { data } = await supabase
          .from("nooks").select(nookSelect)
          .in("id", joinedIds).lt("date_time", now)
          .order("date_time", { ascending: false }).limit(20);
        joined = data || [];
      }
      const all = [...(hosted || []), ...joined];
      const unique = Array.from(new Map(all.map((n) => [n.id, n])).values());
      const { data: feedbackRows } = await supabase
        .from("feedback").select("nook_id").eq("from_user_id", user?.id);
      const feedbackNookIds = new Set((feedbackRows || []).map((f) => f.nook_id));
      return unique.filter((n) => !feedbackNookIds.has(n.id)).map(mapNook);
    },
    enabled: !!user,
  });

  

  const age = profile?.dob ? differenceInYears(new Date(), new Date(profile.dob)) : null;
  const displayName = profile?.display_name || profile?.full_name || "Nooker";
  const city = profile?.city || "";
  const bio = profile?.bio || "";
  const interests: string[] = profile?.interests || [];
  const photoUrl = profile?.profile_photo_url || "";
  const hostedCount = meetupCounts?.hosted ?? 0;
  const attendedCount = meetupCounts?.attended ?? 0;
  const noShows = meetupCounts?.noShows ?? 0;
  const joinedCount = meetupCounts?.joined ?? 0;

  const header = <PageHeader title="My Profile" />;

  if (!user || profileLoading) {
    return (
      <MobileLayout header={header} centered footer={<NavTabBar />}>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout header={header} footer={<NavTabBar />}>
      <div className="animate-fade-in space-y-5 pb-6">

        {/* ── Identity Card ── */}
        <div className="nook-section text-center space-y-4">
          <div className="relative inline-block">
          {photoUrl ? (
              <img
                src={photoUrl.startsWith("blob:") ? photoUrl : `${photoUrl.split("?")[0]}?t=${profile?.updated_at ? new Date(profile.updated_at).getTime() : Date.now()}`}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover shadow-md ring-2 ring-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border shadow-md">
                <span className="text-4xl">👤</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            {(city || age) && (
              <p className="text-sm text-muted-foreground">
                {[city, age ? `Age ${age}` : null].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="flex justify-center pt-0.5">
              {user && <CredibilityBadge userId={user.id} />}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl"
            onClick={() => navigate("/profile/edit")}
          >
            ✏️ Edit Profile
          </Button>
        </div>

        {/* ── Meetup Summary ── */}
        <MeetupStats joined={joinedCount} attended={attendedCount} noShows={noShows} hosted={hostedCount} />

        {/* ── Comfort Rating ── */}
        <ComfortRating
          avgRating={feedbackStats?.avgRating ?? null}
          totalMeetups={feedbackStats?.totalMeetups ?? 0}
        />

        {/* ── Participation Style ── */}
        <ParticipationStyle tags={feedbackStats?.allTags ?? []} />

        {/* ── About Me ── */}
        {(bio || interests.length > 0) && (
          <section className="nook-section space-y-3">
            <h2 className="nook-section-title">About</h2>
            {bio && <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full border border-border/50"
                  >
                    {INTEREST_EMOJIS[tag] || "✨"} {tag}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Upcoming Meetups ── */}
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-base">📅 Upcoming Meetups</h2>
          {upcomingNooks.length > 0 ? (
            <div className="space-y-3">
              {upcomingNooks.map((nook) => (
                <NookCard key={nook.id} nook={nook} onClick={() => navigate(`/nook/${nook.id}`)} />
              ))}
            </div>
          ) : (
            <div className="nook-empty space-y-3">
              <p className="text-sm text-muted-foreground">Your Nook journey starts here 🌿</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => navigate("/explore")} className="gap-1 text-xs rounded-xl">
                  🔎 Explore Nooks
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/raise")} className="gap-1 text-xs rounded-xl">
                  🪺 Raise a Nook
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ── Past Meetups ── */}
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground text-base">🌙 Past Meetups</h2>
          {pastNooksWithPendingFeedback.length > 0 ? (
            <div className="space-y-2.5">
              {pastNooksWithPendingFeedback.map((nook) => (
                <div
                  key={nook.id}
                  className="nook-card-hover p-4 flex items-center justify-between cursor-pointer rounded-2xl"
                  onClick={() => navigate(`/nook/${nook.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{nook.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">📅 {format(nook.dateTime, "MMM d, yyyy")}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 rounded-xl"
                    onClick={(e) => { e.stopPropagation(); navigate(`/nook/${nook.id}/feedback`); }}
                  >
                    ⭐ Feedback
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground nook-empty text-center">You're all caught up! 🌿</p>
          )}
        </section>

        {/* ── Privacy & Safety ── */}
        <section className="nook-section space-y-3">
          <h2 className="nook-section-title">🔒 Privacy & Safety</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-base">{profile?.show_full_name ? "✅" : "⬜"}</span>
              Show my full name to others
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">{profile?.show_gender ? "✅" : "⬜"}</span>
              Show my gender on my profile
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 rounded-xl"
            onClick={() => navigate("/settings/privacy")}
          >
            🛡 Manage Privacy Settings
          </Button>
        </section>

        {/* ── Safety ── */}
        <section className="nook-section space-y-3">
          <h2 className="nook-section-title">🛡 Safety</h2>
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "Your comfort comes first. Meetups should always feel safe and respectful ✨"
          </p>
          <div className="space-y-1">
            {[
              { emoji: "⚠️", label: "Report a Safety Issue", path: "/report" },
              { emoji: "🚫", label: "Blocked Accounts", path: "/settings/privacy" },
            ].map(({ emoji, label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm flex items-center gap-2 text-foreground"
              >
                {emoji} {label}
              </button>
            ))}
          <button
              onClick={handleContactSupport}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm flex items-center gap-2 text-foreground"
            >
              💌 Contact Support
            </button>
          </div>
        </section>

      </div>

      {/* Email fallback modal */}
      {showEmailFallback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowEmailFallback(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-6 space-y-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <p className="text-2xl">💌</p>
              <p className="font-semibold text-foreground">Email Us</p>
              <p className="text-sm text-muted-foreground">We'd love to hear from you.</p>
            </div>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-medium text-foreground select-all">support@nookly.app</p>
            </div>
            <button
              onClick={handleCopyEmail}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform"
            >
              {emailCopied ? "✅ Copied!" : "Copy Email Address"}
            </button>
            <button
              onClick={() => setShowEmailFallback(false)}
              className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

function mapNook(n: any): Nook {
  return {
    id: n.id, topic: n.topic, city: n.city, venue: n.venue,
    dateTime: new Date(n.date_time), durationMinutes: n.duration_minutes || 60,
    minPeople: n.min_people, maxPeople: n.max_people,
    currentPeople: n.current_people, status: n.status,
    createdAt: new Date(n.created_at), hostId: n.host_id,
  };
}
