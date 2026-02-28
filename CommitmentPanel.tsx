import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, HelpCircle, Navigation } from "lucide-react";

interface CommitmentPanelProps {
  nookId: string;
  userId: string;
  membershipId: string | null;
  commitmentStatus: string | null;
  meetupDateTime: Date;
  meetupEndTime: Date;
  isHost: boolean;
}

type Phase = "too_early" | "intention" | "status_update" | "arrival" | "live" | "ended";

function getPhase(meetupDateTime: Date, meetupEndTime: Date): Phase {
  const now = new Date();
  const msUntilStart = meetupDateTime.getTime() - now.getTime();
  const hoursUntilStart = msUntilStart / (1000 * 60 * 60);
  const minutesUntilStart = msUntilStart / (1000 * 60);

  if (now > meetupEndTime) return "ended";
  if (now >= meetupDateTime) return "live";
  if (minutesUntilStart <= 10) return "arrival";
  if (hoursUntilStart <= 1) return "status_update";
  if (hoursUntilStart <= 3) return "intention";
  return "too_early";
}

export { getPhase };
export type { Phase };

export function CommitmentPanel({
  nookId,
  userId,
  membershipId,
  commitmentStatus,
  meetupDateTime,
  meetupEndTime,
  isHost,
}: CommitmentPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const phase = getPhase(meetupDateTime, meetupEndTime);

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      if (!membershipId) return;
      const { error } = await supabase
        .from("nook_members")
        .update({ commitment_status: status } as any)
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nook-membership", nookId] });
      queryClient.invalidateQueries({ queryKey: ["nook-readiness", nookId] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const setStatus = (status: string, message: string) => {
    updateStatus.mutate(status);
    toast({ title: message });

    if (isHost && (status === "cancelled" || status === "no_show")) {
      transferHost();
    }
  };

  const transferHost = async () => {
    try {
      const { data: members } = await supabase
        .from("nook_members")
        .select("user_id, commitment_status, created_at")
        .eq("nook_id", nookId)
        .eq("status", "approved")
        .neq("user_id", userId)
        .order("created_at", { ascending: true });

      const eligible = (members || []).filter(
        (m) => !["cancelled", "no_show"].includes((m as any).commitment_status || "")
      );

      if (eligible.length === 0) {
        await supabase
          .from("nooks")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: userId } as any)
          .eq("id", nookId);

        const allMembers = (members || []).filter((m) => m.user_id !== userId);
        if (allMembers.length > 0) {
          await supabase.from("notifications").insert(
            allMembers.map((m) => ({
              user_id: m.user_id,
      title: "This one won't happen today 🌙",
          message: "The host couldn't attend and no one else stepped in. You can always join another circle soon 🤍",
              type: "cancelled",
              nook_id: nookId,
            })) as any
          );
        }

        toast({ title: "This one won't happen today 🌙", description: "No one else could step in as host." });
        queryClient.invalidateQueries({ queryKey: ["nook", nookId] });
        return;
      }

      const newHostId = eligible[0].user_id;

      await supabase
        .from("nooks")
        .update({ host_id: newHostId } as any)
        .eq("id", nookId);

      const allParticipants = (members || []).filter((m) => m.user_id !== userId);
      const notifications = allParticipants.map((m) => ({
        user_id: m.user_id,
        title: m.user_id === newHostId ? "The circle's in your hands 🌙" : "Small shift 🌿",
        message:
          m.user_id === newHostId
            ? "The original host couldn't make it. You're now guiding this Nook 🤍"
            : "The host has changed, but the Nook continues. See you there ✨",
        type: "host_transferred",
        nook_id: nookId,
      }));

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications as any);
      }

      toast({ title: "Small shift 🌿", description: "A new host is guiding the Nook forward 🤍" });
      queryClient.invalidateQueries({ queryKey: ["nook", nookId] });
    } catch (err) {
      console.error("Host transfer failed:", err);
    }
  };

  if (phase === "too_early" || phase === "ended") return null;

  const isPending = updateStatus.isPending;

  // ─── Phase: Intention (3h → 1h before) ───
  if (phase === "intention") {
    if (commitmentStatus === "confirmed") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <p className="font-medium text-foreground">You're confirmed! 🌟</p>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll check in with you 1 hour before the meetup.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setShowCancelConfirm(true)}
          >
            Change of plans?
          </Button>
          <CancelConfirmDialog
            open={showCancelConfirm}
            onOpenChange={setShowCancelConfirm}
            onConfirm={() => {
              setStatus("cancelled", "Got it — hope to see you next time 🌙");
              setShowCancelConfirm(false);
            }}
          />
        </div>
      );
    }

    if (commitmentStatus === "unsure") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <p className="font-medium text-foreground">Still thinking about it</p>
          </div>
          <p className="text-xs text-muted-foreground">
            No pressure — let us know when you decide.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-xl gap-1"
              disabled={isPending}
              onClick={() => setStatus("confirmed", "You're confirmed! See you there ✨")}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Yes, I'm coming
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-muted-foreground"
              disabled={isPending}
              onClick={() => setShowCancelConfirm(true)}
            >
              Can't make it
            </Button>
          </div>
          <CancelConfirmDialog
            open={showCancelConfirm}
            onOpenChange={setShowCancelConfirm}
            onConfirm={() => {
              setStatus("cancelled", "Got it — hope to see you next time 🌙");
              setShowCancelConfirm(false);
            }}
          />
        </div>
      );
    }

    if (commitmentStatus === "cancelled") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            You've cancelled. Hope to see you at another Nook! 🌿
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setStatus("confirmed", "Welcome back! You're confirmed ✨")}
          >
            Actually, I can make it!
          </Button>
        </div>
      );
    }

    // No selection yet
    return (
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div>
          <p className="font-medium text-foreground mb-1">Your Nook is happening soon 🌿</p>
          <p className="text-xs text-muted-foreground">Are you coming?</p>
        </div>
        <div className="space-y-2">
          <Button
            className="w-full h-11 rounded-xl gap-2"
            disabled={isPending}
            onClick={() => setStatus("confirmed", "You're confirmed! See you there ✨")}
          >
            <CheckCircle2 className="w-4 h-4" />
            Yes, I'm coming
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl gap-2"
            disabled={isPending}
            onClick={() => setStatus("unsure", "No rush — let us know when you decide 🌙")}
          >
            <HelpCircle className="w-4 h-4" />
            Not sure yet
          </Button>
          <Button
            variant="ghost"
            className="w-full h-11 rounded-xl gap-2 text-muted-foreground"
            disabled={isPending}
            onClick={() => setShowCancelConfirm(true)}
          >
            <XCircle className="w-4 h-4" />
            I can't make it
          </Button>
        </div>
        <CancelConfirmDialog
          open={showCancelConfirm}
          onOpenChange={setShowCancelConfirm}
          onConfirm={() => {
            setStatus("cancelled", "Got it — hope to see you next time 🌙");
            setShowCancelConfirm(false);
          }}
        />
      </div>
    );
  }

  // ─── Phase: Status Update (1h → arrival window) ───
  if (phase === "status_update") {
    if (commitmentStatus === "on_the_way") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <p className="font-medium text-foreground">You're on the way! 🚶</p>
          </div>
          <p className="text-xs text-muted-foreground">Take your time. See you there 🌙</p>
        </div>
      );
    }

    if (commitmentStatus === "running_late") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-muted-foreground" />
            <p className="font-medium text-foreground">Running a bit late</p>
          </div>
          <p className="text-xs text-muted-foreground">No worries — you can still join within the grace period 🌿</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1"
            disabled={isPending}
            onClick={() => setStatus("on_the_way", "See you soon! 🌙")}
          >
            🚶 Actually on the way now
          </Button>
        </div>
      );
    }

    if (commitmentStatus === "cancelled") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">
            You've cancelled. Hope to see you at another Nook! 🌿
          </p>
        </div>
      );
    }

    // Show status update options (only if confirmed or unsure or no status)
    return (
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div>
          <p className="font-medium text-foreground mb-1">Nook starting soon 🌙</p>
          <p className="text-xs text-muted-foreground">Update your status</p>
        </div>
        <div className="space-y-2">
          <Button
            className="w-full h-10 rounded-xl gap-2 text-sm"
            disabled={isPending}
            onClick={() => setStatus("on_the_way", "See you soon! 🌙")}
          >
            🚶 On the way
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl gap-2 text-sm"
            disabled={isPending}
            onClick={() => setStatus("running_late", "No rush — see you soon 🌿")}
          >
            ⏳ Running late
          </Button>
          <Button
            variant="ghost"
            className="w-full h-10 rounded-xl gap-2 text-sm text-muted-foreground"
            disabled={isPending}
            onClick={() => setShowCancelConfirm(true)}
          >
            ❌ Can't make it
          </Button>
        </div>
        <CancelConfirmDialog
          open={showCancelConfirm}
          onOpenChange={setShowCancelConfirm}
          onConfirm={() => {
            setStatus("cancelled", "Got it — plans change, totally okay 🌙");
            setShowCancelConfirm(false);
          }}
        />
      </div>
    );
  }

  // ─── Phase: Arrival & Live — handled by ArrivalPanel ───
  // Show encouragement based on prior status
  if (phase === "arrival" || phase === "live") {
    if (commitmentStatus === "arrived") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <p className="font-medium text-foreground">You've arrived! 🌟</p>
          </div>
          <p className="text-xs text-muted-foreground">Enjoy the meetup 🌿</p>
        </div>
      );
    }

    if (commitmentStatus === "cancelled" || commitmentStatus === "no_show") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">
            {commitmentStatus === "no_show"
              ? "Couldn't make it this time. See you next time 🌿"
              : "You've cancelled. Hope to see you at another Nook! 🌿"}
          </p>
        </div>
      );
    }

    // Show encouragement based on travel status
    if (commitmentStatus === "on_the_way") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
          <p className="font-medium text-foreground">You're almost there 🌿</p>
          <p className="text-xs text-muted-foreground">Look for the Nook Host screen at the anchor spot.</p>
        </div>
      );
    }

    if (commitmentStatus === "running_late") {
      return (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
          <p className="font-medium text-foreground">You can still join within the grace period 🌿</p>
          <p className="text-xs text-muted-foreground">No judgement — head to the meeting spot when ready.</p>
        </div>
      );
    }

    return null;
  }

  return null;
}

// ─── Group Readiness (Aggregate Only) ───
interface GroupReadinessProps {
  nookId: string;
  meetupDateTime: Date;
  meetupEndTime: Date;
}

export function GroupReadiness({ nookId, meetupDateTime, meetupEndTime }: GroupReadinessProps) {
  const phase = getPhase(meetupDateTime, meetupEndTime);
  if (phase === "too_early") return null;

  return <GroupReadinessInner nookId={nookId} phase={phase} />;
}

function GroupReadinessInner({ nookId, phase }: { nookId: string; phase: Phase }) {
  const { data: counts } = useReadinessCounts(nookId);

  if (!counts || Object.values(counts).every(v => v === 0)) return null;

  // Show different aggregates based on phase
  let items: { label: string; count: number; emoji: string }[] = [];

  if (phase === "intention") {
    items = [
      { label: "Confirmed", count: counts.confirmed, emoji: "👥" },
      { label: "Unsure", count: counts.unsure, emoji: "❔" },
    ].filter(i => i.count > 0);
  } else if (phase === "status_update") {
    items = [
      { label: "On the way", count: counts.on_the_way, emoji: "🚶" },
      { label: "Running late", count: counts.running_late, emoji: "⏳" },
      { label: "Confirmed", count: counts.confirmed, emoji: "👥" },
    ].filter(i => i.count > 0);
  } else {
    // arrival / live / ended
    items = [
      { label: "Arrived", count: counts.arrived, emoji: "📍" },
      { label: "On the way", count: counts.on_the_way, emoji: "🚶" },
      { label: "Running late", count: counts.running_late, emoji: "⏳" },
    ].filter(i => i.count > 0);
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <p className="font-medium text-foreground text-sm">Group Status 🌙</p>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs">{item.emoji}</span>
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {item.count} {item.count === 1 ? "person" : "people"}
            </span>
          </div>
        ))}
      </div>
      {phase === "ended" && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Thanks for being part of this Nook 🌿
        </p>
      )}
    </div>
  );
}

// Hook for readiness counts
function useReadinessCounts(nookId: string) {
  return useQuery({
    queryKey: ["nook-readiness", nookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nook_members")
        .select("commitment_status, status")
        .eq("nook_id", nookId)
        .eq("status", "approved");

      if (error) throw error;

      const counts = {
        confirmed: 0,
        unsure: 0,
        cancelled: 0,
        getting_ready: 0,
        on_the_way: 0,
        arrived: 0,
        running_late: 0,
        no_show: 0,
        pending: 0,
      };

      for (const m of data || []) {
        const cs = (m as any).commitment_status;
        if (cs && cs in counts) {
          counts[cs as keyof typeof counts]++;
        } else {
          counts.pending++;
        }
      }

      return counts;
    },
    refetchInterval: 30000,
  });
}

// ─── Cancel Confirmation Dialog ───
function CancelConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Plans change — totally okay 🌙</AlertDialogTitle>
          <AlertDialogDescription>
            Cancelling early helps the group plan better. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>I'll try to come</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, I can't make it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
