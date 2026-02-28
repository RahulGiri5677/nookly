import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NookLogo } from "@/components/nook/NookLogo";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { User, CheckCircle2, XCircle } from "lucide-react";
import { BackHeader } from "@/components/nook/BackHeader";
import { useAuth } from "@/hooks/useAuth";
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

interface ParticipantAttendance {
  userId: string;
  displayName: string;
  status: "present" | "no-show";
}

export default function MarkAttendance() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [participants, setParticipants] = useState<ParticipantAttendance[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: nook } = useQuery({
    queryKey: ["nook", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nooks")
        .select("id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["nook-members-profiles", id],
    queryFn: async () => {
      const { data: memberData, error } = await supabase
        .from("nook_members")
        .select("user_id")
        .eq("nook_id", id!)
        .eq("status", "approved");
      if (error) throw error;

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
    enabled: !!id && !!nook,
  });

  // Initialize participants state once loaded
  if (members.length > 0 && !initialized) {
    setParticipants(
      members.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
        status: "present" as const,
      }))
    );
    setInitialized(true);
  }

  const isHost = user?.id === nook?.host_id;
  const dateTime = nook ? new Date(nook.date_time) : new Date();
  const endTime = new Date(dateTime.getTime() + (nook?.duration_minutes || 60) * 60 * 1000);
  const now = new Date();
  // Mark Attendance: only during active meetup lifecycle (start → end, server also enforces)
  const canMark = isHost && now >= dateTime && now <= endTime;

  const toggleStatus = (userId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId
          ? { ...p, status: p.status === "present" ? "no-show" : "present" }
          : p
      )
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const attendances = participants.map((p) => ({
        user_id: p.userId,
        status: p.status === "present" ? "attended" : "no_show",
      }));

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nook_id: id, attendances }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save attendance");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nook", id] });
      toast({
        title: "✅ Attendance saved",
        description: "All participants have been notified.",
      });
      navigate(`/nook/${id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!canMark && !isLoading) {
    return (
      <MobileLayout centered>
        <p className="text-muted-foreground text-center">
          Attendance can only be marked during the active meetup (start until scheduled end time).
        </p>
      </MobileLayout>
    );
  }

  const header = <BackHeader />;

  return (
    <MobileLayout header={header}>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Mark Attendance 🌿
          </h1>
          <p className="text-sm text-muted-foreground">
            Confirm who attended so Nook stays respectful.
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading participants...</p>
        ) : participants.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No participants to mark.</p>
        ) : (
          <div className="space-y-3">
            {participants.map((p) => (
              <button
                key={p.userId}
                onClick={() => toggleStatus(p.userId)}
                className="w-full text-left p-4 rounded-2xl border border-border bg-card transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                      <User className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{p.displayName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === "present" ? (
                      <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        Attended
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-destructive text-sm font-medium">
                        <XCircle className="w-5 h-5" />
                        No-show
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {participants.length > 0 && (
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full h-12 rounded-xl"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Attendance"}
          </Button>
        )}

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Attendance?</AlertDialogTitle>
              <AlertDialogDescription>
                This will notify participants and update meetup records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => saveMutation.mutate()}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
}
