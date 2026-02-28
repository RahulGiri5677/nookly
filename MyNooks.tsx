import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NookLogo } from "@/components/nook/NookLogo";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { NavTabBar } from "@/components/nook/NavTabBar";
import { NookCard } from "@/components/nook/NookCard";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/nook/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import type { Nook } from "@/types/nook";
import { isNookActive } from "@/lib/nookVisibility";

export default function MyNooks() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: hostedNooks = [], isLoading: loadingHosted } = useQuery({
    queryKey: ["my-hosted-nooks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nooks")
        .select("id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note")
        .eq("host_id", user!.id)
        .order("date_time", { ascending: false });
      if (error) throw error;
      return (data || []).map((n): Nook => ({
        id: n.id,
        topic: n.topic as Nook["topic"],
        city: n.city,
        venue: n.venue,
        dateTime: new Date(n.date_time),
        durationMinutes: n.duration_minutes,
        minPeople: n.min_people,
        maxPeople: n.max_people,
        currentPeople: n.current_people,
        status: n.status as Nook["status"],
        createdAt: new Date(n.created_at),
        hostId: n.host_id,
        category: (n as any).category,
        comfortDetail: (n as any).comfort_detail,
      }));
    },
    enabled: !!user,
  });

  const { data: joinedNookIds = [] } = useQuery({
    queryKey: ["my-joined-nook-ids", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nook_members")
        .select("nook_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []).map((m) => m.nook_id);
    },
    enabled: !!user,
  });

  const { data: joinedNooks = [], isLoading: loadingJoined } = useQuery({
    queryKey: ["my-joined-nooks", joinedNookIds],
    queryFn: async () => {
      if (joinedNookIds.length === 0) return [];
      const { data, error } = await supabase
        .from("nooks")
        .select("id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note")
        .in("id", joinedNookIds)
        .order("date_time", { ascending: false });
      if (error) throw error;
      return (data || []).map((n): Nook => ({
        id: n.id,
        topic: n.topic as Nook["topic"],
        city: n.city,
        venue: n.venue,
        dateTime: new Date(n.date_time),
        durationMinutes: n.duration_minutes,
        minPeople: n.min_people,
        maxPeople: n.max_people,
        currentPeople: n.current_people,
        status: n.status as Nook["status"],
        createdAt: new Date(n.created_at),
        hostId: n.host_id,
        category: (n as any).category,
        comfortDetail: (n as any).comfort_detail,
      }));
    },
    enabled: joinedNookIds.length > 0,
  });

  const isLoading = loadingHosted || loadingJoined;

  const header = <PageHeader title="My Nooks 🪺" subtitle="Your little corners of connection." />;

  return (
    <MobileLayout header={header} footer={<NavTabBar />}>
      <div className="animate-fade-in space-y-7 pb-6">

        {(() => {
          const now = new Date();
          const activeHosted = hostedNooks.filter(n => isNookActive(n, now));
          const pastHosted = hostedNooks.filter(n => !isNookActive(n, now));
          const joinedAsParticipant = joinedNooks.filter(n => n.hostId !== user?.id);
          const activeJoined = joinedAsParticipant.filter(n => isNookActive(n, now));
          const pastJoined = joinedAsParticipant.filter(n => !isNookActive(n, now));
          const pastNooks = [...pastHosted, ...pastJoined].sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());

          return (
            <>
              {/* Hosted */}
              <div className="space-y-3">
                <div>
                  <h2 className="font-semibold text-foreground text-base">✨ Hosted by You</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">The Nooks you created</p>
                </div>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : activeHosted.length > 0 ? (
                  <div className="space-y-3">
                    {activeHosted.map((nook) => (
                      <NookCard
                        key={nook.id}
                        nook={nook}
                        onClick={() => navigate(`/nook/${nook.id}`)}
                        className={nook.status === "cancelled" ? "opacity-40" : ""}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="nook-empty space-y-3">
                    <p className="text-muted-foreground text-sm">No active hosted Nooks.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/raise")} className="gap-1 rounded-xl">
                      <Plus className="w-3.5 h-3.5" />
                      Raise a Nook
                    </Button>
                  </div>
                )}
              </div>

              {/* Joined */}
              <div className="space-y-3">
                <div>
                  <h2 className="font-semibold text-foreground text-base">🤝 Joined</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">The Nooks you're part of</p>
                </div>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : activeJoined.length > 0 ? (
                  <div className="space-y-3">
                    {activeJoined.map((nook) => (
                      <NookCard
                        key={nook.id}
                        nook={nook}
                        onClick={() => navigate(`/nook/${nook.id}`)}
                        className={nook.status === "cancelled" ? "opacity-40" : ""}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="nook-empty space-y-3">
                    <p className="text-muted-foreground text-sm">No active Nooks yet 🌿</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/explore")} className="gap-1 rounded-xl">
                      <Search className="w-3.5 h-3.5" />
                      Explore Nooks
                    </Button>
                  </div>
                )}
              </div>

              {/* Past */}
              {pastNooks.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h2 className="font-semibold text-foreground text-base">🕰️ Past Meetups</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Your completed Nooks</p>
                  </div>
                  <div className="space-y-3">
                    {pastNooks.map((nook) => (
                      <NookCard
                        key={nook.id}
                        nook={nook}
                        onClick={() => navigate(`/nook/${nook.id}`)}
                        className="opacity-50"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </MobileLayout>
  );
}
