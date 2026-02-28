import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useJoinEligibility } from "@/hooks/useJoinEligibility";
import { JOIN_SAFETY_MESSAGES } from "@/constants/notificationContent";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NookLogo } from "@/components/nook/NookLogo";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { StatusBadge } from "@/components/nook/StatusBadge";
import { ComfortSignals } from "@/components/nook/ComfortSignals";
import { PageHeader } from "@/components/nook/PageHeader";
import {
  MapPin,
  Calendar,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Accessibility,
  Pencil,
  Trash2,
  User,
  Star,
  ClipboardCheck,
} from "lucide-react";
import { NOOK_RULES, NOOK_CATEGORIES } from "@/types/nook";
import { formatDurationHours } from "@/lib/utils";
import { computeMeetupPhase } from "@/lib/meetupPhase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { FounderTestPanel } from "@/components/nook/FounderTestPanel";
import { CommitmentPanel, GroupReadiness } from "@/components/nook/CommitmentPanel";
import { ArrivalPanel } from "@/components/nook/ArrivalPanel";
import { QRAttendance } from "@/components/nook/QRAttendance";
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

export default function NookDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const queryClient = useQueryClient();
  const { data: eligibility } = useJoinEligibility(user?.id);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  // Balance/safety check for joining
  const { data: safetyCheck } = useQuery({
    queryKey: ["nook-safety-check", id, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("check_nook_join_safety", {
        p_user_id: user!.id,
        p_nook_id: id,
      });
      if (error) throw error;
      return data as { allowed: boolean; reason?: string; code?: string };
    },
    enabled: !!id && !!user,
    staleTime: 2 * 60 * 1000,
  });
  const { data: nook, isLoading, isError } = useQuery({
    queryKey: ["nook", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("nooks")
        .select("id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note, google_maps_link, nook_code, host_mode_active, category, comfort_detail, gender_restriction, inclusive_non_binary")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Realtime sync: auto-refresh nook data when current_people or status changes
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`nook-detail-${id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "nooks",
        filter: `id=eq.${id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["nook", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  const { data: membership } = useQuery({
    queryKey: ["nook-membership", id, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("nook_members")
        .select("id, nook_id, user_id, status, commitment_status, created_at")
        .eq("nook_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch participant names for host (only when confirmed & within 1 hour of start)
  const isHost = user?.id === nook?.host_id;
  const dateTime = nook ? new Date(nook.date_time) : new Date();
  const durationMin = nook?.duration_minutes || 60;
  const endTime = new Date(dateTime.getTime() + durationMin * 60 * 1000);

  // Auto-refresh current time every 60s for dynamic status
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const phase = nook ? computeMeetupPhase(dateTime, durationMin, nook.status, now) : null;
  const isConfirmedOrLater = nook?.status === "confirmed" || nook?.status === "completed";
  const isWithinOneHour = dateTime.getTime() - now.getTime() <= 60 * 60 * 1000;
  const canSeeParticipants = isHost && isConfirmedOrLater && isWithinOneHour;

  const { data: participants = [] } = useQuery({
    queryKey: ["nook-participants", id],
    queryFn: async () => {
      const { data: memberData } = await supabase
        .from("nook_members")
        .select("user_id")
        .eq("nook_id", id!)
        .eq("status", "approved");

      const userIds = (memberData || [])
        .map((m) => m.user_id)
        .filter((uid) => uid !== nook?.host_id);

      if (userIds.length === 0) return [];

      const { data: profiles } = await (supabase.rpc as any)("get_display_profiles", { p_user_ids: userIds });

      return (profiles || []).map((p) => ({
        userId: p.user_id,
        displayName: p.display_name || "Nooker",
      }));
    },
    enabled: canSeeParticipants,
  });

  // Check attendance status for current user
  const { data: myAttendance } = useQuery({
    queryKey: ["my-attendance", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("status, entry_marked, exit_marked")
        .eq("nook_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  // Check if attendance has already been completed (any records exist for this nook)
  const { data: attendanceRecords } = useQuery({
    queryKey: ["attendance-completed", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id")
        .eq("nook_id", id!)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!id && isHost,
  });
  const attendanceCompleted = (attendanceRecords?.length ?? 0) > 0;

  // Check if feedback exists
  const { data: myFeedback } = useQuery({
    queryKey: ["my-feedback", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("feedback" as any)
        .select("id")
        .eq("nook_id", id!)
        .eq("from_user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nook_members").insert({
        nook_id: id!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nook", id] });
      queryClient.invalidateQueries({ queryKey: ["nook-membership", id] });
      toast({ title: "You're in 🌙", description: "You've joined. We'll let you know once it's confirmed ✨" });
    },
    onError: (err: Error) => {
      toast({ title: "Hmm, that didn't work", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("notify-cancellation", {
        body: { nook_id: id },
      });

      if (res.error) throw new Error(res.error.message || "Failed to cancel");
      const result = res.data;
      if (!result.success) throw new Error(result.error || "Failed to cancel");
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nook", id] });
      queryClient.invalidateQueries({ queryKey: ["nooks"] });
      toast({
        title: "Plans changed 🌿",
        description: data.message || "This Nook has been cancelled. All participants have been notified 🤍",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Hmm, that didn't work", description: err.message, variant: "destructive" });
    },
  });

  const hasJoined = !!membership;
  const isFull = nook ? nook.current_people >= nook.max_people : false;
  const isCancelled = nook?.status === "cancelled";
  const isEnded = nook ? now > endTime : false;
  const isLiveOrEnded = now >= dateTime && !isCancelled;
  // Mark Attendance: only during active meetup (start → end)
  const canMarkAttendance = isHost && now >= dateTime && now <= endTime && !attendanceCompleted;

  // Host cancellation: only allowed 10+ hours before start
  const hoursUntilStart = (dateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const canDelete = isHost && nook?.status !== "cancelled" && hoursUntilStart > 10;
  const cancelBlockedByTime = isHost && nook?.status !== "cancelled" && hoursUntilStart <= 10 && hoursUntilStart > 0;

  // Edit lock: locked within 3 hours of start (server also enforces)
  const canEdit = isHost && !isCancelled && hoursUntilStart > 3 && !isLiveOrEnded;
  const editLockedByTime = isHost && !isCancelled && hoursUntilStart <= 3 && hoursUntilStart > 0 && !isLiveOrEnded;

  // Determine if the nook is inactive (cancelled or completed/ended)
  const nookInactive = nook
    ? nook.status === "cancelled" || now >= new Date(new Date(nook.date_time).getTime() + (nook.duration_minutes || 60) * 60 * 1000)
    : false;
  const isParticipant = hasJoined || isHost;

  // Women-only logic
  const isWomenOnlyNook = nook ? (nook as any).gender_restriction === "women_only" : false;
  const isInclusiveNook = isWomenOnlyNook && !!(nook as any).inclusive_non_binary;
  const womenDetailBadge = isInclusiveNook ? "🌸 Women & Non-binary" : "🌸 Created for women";
  const womenDetailSubtext = isInclusiveNook
    ? "This space is created for women and is open to non-binary participants."
    : "This space is thoughtfully created for women.";

  if (isLoading) {
    return (
      <MobileLayout centered>
        <p className="text-muted-foreground">Loading...</p>
      </MobileLayout>
    );
  }

  if (isError) {
    return (
      <MobileLayout centered>
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Something went wrong. Please try again.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </MobileLayout>
    );
  }

  if (!nook) {
    return (
      <MobileLayout centered>
        <p className="text-muted-foreground">Nook not found.</p>
      </MobileLayout>
    );
  }

  // Block non-participants from accessing cancelled/completed nooks
  if (nookInactive && !isParticipant && !isAdmin) {
    return (
      <MobileLayout centered>
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">This Nook is no longer available.</p>
          <Button variant="outline" onClick={() => navigate("/explore")}>
            Explore Nooks
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const header = <PageHeader title={nook.topic} />;

  const footer = (
    <div className="space-y-2">
      {!user ? (
        <Button onClick={() => navigate("/auth")} className="w-full h-12 rounded-xl">
          Sign in to join
        </Button>
      ) : isCancelled ? (
        <div className="space-y-2">
          <Button disabled className="w-full h-12 rounded-xl opacity-50">Nook Cancelled</Button>
          <p className="text-xs text-center text-muted-foreground">
            This meetup was cancelled by the host. You've been notified.
          </p>
        </div>
      ) : isEnded && myAttendance?.status === "attended" && !myFeedback ? (
        <Button
          onClick={() => navigate(`/nook/${id}/feedback`)}
          className="w-full h-12 rounded-xl"
        >
          <Star className="w-5 h-5 mr-2" />
          Leave Feedback
        </Button>
      ) : hasJoined || isHost ? (
        <Button
          disabled
          className="w-full h-12 rounded-xl bg-success text-success-foreground"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {isHost ? "You're hosting" : "You're in"}
        </Button>
      ) : isFull ? (
        <Button disabled className="w-full h-12 rounded-xl">Nook Full</Button>
      ) : isWomenOnlyNook && user && !isHost ? (
        // Check if user profile gender is female — restriction handled server-side via safetyCheck
        // If safetyCheck passes they can join; if it returned allowed=false it's caught above.
        // We show a gentle restriction if safetyCheck explicitly says reserved.
        null
      ) : eligibility && !eligibility.eligible ? (
        <div className="space-y-2">
          <Button disabled className="w-full h-12 rounded-xl opacity-60">
            Temporarily Restricted
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {eligibility.message || "You're temporarily restricted from joining new Nooks. Showing up consistently helps build trust."}
          </p>
        </div>
      ) : safetyCheck && !safetyCheck.allowed ? (
        <div className="space-y-2">
          <Button disabled className="w-full h-12 rounded-xl opacity-60">
            {(safetyCheck.code && JOIN_SAFETY_MESSAGES[safetyCheck.code]?.label) || 'Cannot Join'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {(safetyCheck.code && JOIN_SAFETY_MESSAGES[safetyCheck.code]?.description)
              || safetyCheck.reason
              || "You cannot join this Nook right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {!safetyConfirmed && (
            <div className="bg-secondary/50 rounded-xl p-3 flex items-start gap-3">
              <Checkbox
                id="safety-confirm"
                checked={safetyConfirmed}
                onCheckedChange={(checked) => setSafetyConfirmed(checked === true)}
              />
              <label htmlFor="safety-confirm" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                This is a structured group meetup in a public place. Respect and cooperation are expected.
              </label>
            </div>
          )}
          <Button
            onClick={() => joinMutation.mutate()}
            className="w-full h-12 rounded-xl"
            disabled={joinMutation.isPending || !safetyConfirmed}
          >
            {joinMutation.isPending ? "Joining..." : "Request to Join"}
          </Button>
        </div>
      )}

      {nook.status === "pending" && !hasJoined && !isHost && (
        <p className="text-xs text-center text-muted-foreground">
          This Nook needs {nook.min_people - nook.current_people} more{" "}
          {nook.min_people - nook.current_people === 1 ? "person" : "people"} to be confirmed.
        </p>
      )}
    </div>
  );

  return (
    <MobileLayout header={header} footer={footer}>
      <div className={`animate-fade-in space-y-6 ${isCancelled ? "opacity-60" : ""}`}>
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            {phase && <StatusBadge phase={phase} />}
          </div>
          {(() => {
            const cat = NOOK_CATEGORIES.find((c) => c.value === (nook as any).category);
            return cat ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-2">
                {cat.emoji} {cat.label}
              </span>
            ) : null;
          })()}

          {/* Women-only gathering indicator */}
          {isWomenOnlyNook && (
            <div className="mt-2 mb-3 px-4 py-3 rounded-xl bg-[hsl(var(--women-card-bg))] border border-[hsl(var(--women-card-border))]">
              <p className="text-sm font-medium text-foreground">{womenDetailBadge}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{womenDetailSubtext}</p>
            </div>
          )}

          {/* Completed state */}
          {phase?.phase === "completed" && (
            <div className="bg-muted border border-border rounded-xl p-4 mb-3">
              <p className="text-sm font-medium text-foreground">Meetup Completed 🌙</p>
              {myAttendance?.status === "attended" && (
                <p className="text-xs text-muted-foreground mt-1">Attendance: Marked Present ✔️</p>
              )}
              {myAttendance?.status === "no_show" && (
                <p className="text-xs text-muted-foreground mt-1">Attendance: No-show</p>
              )}
            </div>
          )}

          {/* Host controls */}
          {isHost && !isCancelled && (
            <div className="flex flex-wrap gap-2 mt-3">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => navigate(`/nook/${id}/edit`)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
              )}
              {editLockedByTime && (
                <p className="text-xs text-muted-foreground">
                  Editing locked within 24 hours of start 🌿
                </p>
              )}
              {canMarkAttendance && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => navigate(`/nook/${id}/attendance`)}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Mark Attendance
                </Button>
              )}
              {attendanceCompleted && isHost && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Attendance Completed
                </span>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30">
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancel Nook
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this Nook?</AlertDialogTitle>
                      <AlertDialogDescription>
                        All participants will be notified immediately by email and notification. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Meetup</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Cancel Meetup
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
               )}
              {cancelBlockedByTime && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  Can't cancel within 10 hours of start for participant safety 🌿
                </p>
              )}
            </div>
          )}
        </div>

        {/* Participant list (host only, when visible) */}
        {canSeeParticipants && participants.length > 0 && (
          <div className="nook-section space-y-3">
            <h2 className="nook-section-title">Participants ({participants.length})</h2>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-xl bg-accent/30 border border-border flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{p.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commitment Panel (participants and host) */}
        {(hasJoined || isHost) && !isCancelled && (membership || isHost) && (
          <CommitmentPanel
            nookId={nook.id}
            userId={user!.id}
            membershipId={membership?.id || null}
            commitmentStatus={membership ? (membership as any).commitment_status : null}
            meetupDateTime={dateTime}
            meetupEndTime={endTime}
            isHost={isHost}
          />
        )}

        {/* Group Readiness */}
        {(hasJoined || isHost) && !isCancelled && (
          <GroupReadiness
            nookId={nook.id}
            meetupDateTime={dateTime}
            meetupEndTime={endTime}
          />
        )}

        {/* Arrival Panel */}
        {(hasJoined || isHost) && !isCancelled && (
          <ArrivalPanel
            nookId={nook.id}
            userId={user!.id}
            membershipId={membership?.id || null}
            meetupDateTime={dateTime}
            isHost={isHost}
            isParticipant={hasJoined || isHost}
            venueNote={nook.venue_note}
            nookCode={nook.nook_code}
          />
        )}

        {/* QR Attendance Scanning — participants only */}
        {hasJoined && !isHost && !isCancelled && (
          <QRAttendance
            nookId={nook.id}
            isHost={false}
            meetupDateTime={dateTime}
            meetupEndTime={endTime}
          />
        )}

        {/* Host Anchor Mode button — T-10 to T+30 */}
        {isHost && !isCancelled && (() => {
          const windowOpen = new Date(dateTime.getTime() - 10 * 60 * 1000);
          const windowClose = new Date(endTime.getTime() + 30 * 60 * 1000);
          const inWindow = now >= windowOpen && now <= windowClose;
          return inWindow ? (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl gap-2"
              onClick={() => navigate(`/nook/${id}/host-mode`)}
            >
              🪺 Activate Host Mode
            </Button>
          ) : null;
        })()}

        {/* Live Meetup Banner */}
        {phase?.phase === "live" && (
          <div className="bg-success/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-success shrink-0" />
              <p className="text-sm font-medium text-foreground">Meetup is Live</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Started at {format(dateTime, "h:mm a")}
            </p>
          </div>
        )}

        {/* Arrival Banner */}
        {phase?.phase === "arrival" && (
          <div className="bg-warning/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
              <p className="text-sm font-medium text-foreground">People are Gathering</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Meetup starts at {format(dateTime, "h:mm a")}
            </p>
          </div>
        )}

        {/* Nook Code — visible T-30 to T+30, members only */}
        {(() => {
          if (!nook.nook_code || !isParticipant || isCancelled) return null;
          const thirtyMinBefore = new Date(dateTime.getTime() - 30 * 60 * 1000);
          const thirtyMinAfter = new Date(endTime.getTime() + 30 * 60 * 1000);
          const codeVisible = now >= thirtyMinBefore && now <= thirtyMinAfter;
          if (!codeVisible) return null;

          if (isHost) {
            return (
              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3">
                <span className="font-mono text-3xl font-bold tracking-widest text-foreground select-all">
                  {nook.nook_code}
                </span>
                <p className="text-xs text-muted-foreground text-center">
                  This Nook Code helps the right members gather at the exact spot.
                </p>
              </div>
            );
          }

          return (
            <div className="bg-card border border-border rounded-xl px-5 py-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nook Code</span>
                <span className="font-mono font-bold text-lg tracking-widest text-foreground">
                  {nook.nook_code}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                This Nook Code helps the right members gather at the exact spot.
              </p>
            </div>
          );
        })()}

        {/* Full details card */}
        <div className="nook-section space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{format(dateTime, "EEEE, MMMM d")}</p>
              <p className="text-sm text-muted-foreground">{format(dateTime, "h:mm a")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{formatDurationHours(nook.duration_minutes)}</p>
              <p className="text-sm text-muted-foreground">Estimated duration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <MapPin className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground whitespace-pre-line">{nook.venue}</p>
              <p className="text-sm text-muted-foreground">{nook.city} · Public place</p>
            </div>
          </div>

          {nook.venue_note && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground whitespace-pre-line">{nook.venue_note}</p>
                <p className="text-sm text-muted-foreground">Exact meeting spot</p>
              </div>
            </div>
          )}

          {/* Open in Google Maps button */}
          {nook.venue && (
            <a
              href={
                (nook as any).google_maps_link &&
                String((nook as any).google_maps_link).includes("google.com/maps")
                  ? String((nook as any).google_maps_link)
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nook.venue + ", " + nook.city)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-accent/50 transition-colors w-fit"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              📍 Open in Google Maps
            </a>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {nook.current_people} of {nook.max_people} joined
              </p>
              <p className="text-sm text-muted-foreground">
                Group size: {nook.min_people}–{nook.max_people} people
              </p>
            </div>
          </div>

          {nook.icebreaker && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{nook.icebreaker}</p>
                <p className="text-sm text-muted-foreground">Icebreaker activity</p>
              </div>
            </div>
          )}


          {(nook as any).comfort_detail && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{(nook as any).comfort_detail}</p>
                <p className="text-sm text-muted-foreground">Comfort details</p>
              </div>
            </div>
          )}

          {nook.wheelchair_friendly && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Accessibility className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Wheelchair friendly</p>
                <p className="text-sm text-muted-foreground">Accessible venue</p>
              </div>
            </div>
          )}
        </div>

        <div className="nook-section space-y-3">
          <h2 className="nook-section-title">What to Expect</h2>
          <ComfortSignals />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Casual conversation. No forced introductions at the start. Take your time to get comfortable.
          </p>
        </div>

        <div className="nook-section space-y-3">
          <h2 className="nook-section-title">Nook Guidelines</h2>
          <div className="space-y-2.5">
            {NOOK_RULES.map((rule, index) => (
              <p key={index} className="text-sm text-muted-foreground flex items-start gap-2.5 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                {rule}
              </p>
            ))}
          </div>
        </div>

        {/* Founder Mode - admin only */}
        {isAdmin && nook && user && (
          <FounderTestPanel
            nookId={nook.id}
            nook={nook}
            userId={user.id}
            userEmail={user.email || ""}
          />
        )}
      </div>
    </MobileLayout>
  );
}
