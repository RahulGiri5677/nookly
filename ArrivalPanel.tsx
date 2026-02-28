import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MapPin, Users, ScanLine } from "lucide-react";

interface ArrivalPanelProps {
  nookId: string;
  userId: string;
  membershipId: string | null;
  meetupDateTime: Date;
  isHost: boolean;
  isParticipant: boolean;
  venueNote: string | null;
  nookCode: string | null;
}

export function ArrivalPanel({
  nookId,
  userId,
  membershipId,
  meetupDateTime,
  isHost,
  isParticipant,
  venueNote,
  nookCode,
}: ArrivalPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);
  const [code, setCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const now = new Date();
  const arrivalWindowStart = new Date(meetupDateTime.getTime() - 10 * 60 * 1000);
  const arrivalWindowEnd = new Date(meetupDateTime.getTime() + 15 * 60 * 1000);
  const inArrivalWindow = now >= arrivalWindowStart && now <= arrivalWindowEnd;

  // Get current user's arrival status
  const { data: myMember } = useQuery({
    queryKey: ["my-arrival", nookId, userId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("nook_members")
        .select("id, arrival_status, arrival_timestamp")
        .eq("nook_id", nookId)
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    enabled: isParticipant,
    refetchInterval: 15000,
  });

  // Check attendance table too
  const { data: myAttendance } = useQuery({
    queryKey: ["my-qr-attendance", nookId, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("nook_id", nookId)
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    enabled: isParticipant,
    refetchInterval: 15000,
  });

  // Get all arrival data
  const { data: arrivals = [] } = useQuery({
    queryKey: ["nook-arrivals", nookId],
    queryFn: async () => {
      const { data: members } = await (supabase as any)
        .from("nook_members")
        .select("user_id, arrival_status, arrival_timestamp")
        .eq("nook_id", nookId)
        .eq("status", "approved")
        .eq("arrival_status", "arrived");

      if (!members || members.length === 0) return [];

      const userIds = members.map((m: any) => m.user_id);
      const { data: profiles } = await (supabase.rpc as any)("get_display_profiles", { p_user_ids: userIds });

      return members.map((m: any) => ({
        userId: m.user_id,
        displayName: (profiles || []).find((p: any) => p.user_id === m.user_id)?.display_name || "Nooker",
      }));
    },
    enabled: isParticipant && inArrivalWindow,
    refetchInterval: 15000,
  });

  // Check host mode
  const { data: hostModeActive } = useQuery({
    queryKey: ["host-mode", nookId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("nooks")
        .select("host_mode_active, host_id")
        .eq("id", nookId)
        .maybeSingle();
      return data;
    },
    enabled: isParticipant && inArrivalWindow,
    refetchInterval: 15000,
  });

  // Handle QR code verification
  const handleScanVerify = async () => {
    if (!code.trim()) return;
    setIsScanning(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ nook_id: nookId, code: code.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: response.status === 400 ? "Invalid code" : "Error",
          description: result.error || "Try again.",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      // Also mark arrival in nook_members
      await (supabase as any)
        .from("nook_members")
        .update({
          arrival_status: "arrived",
          arrival_timestamp: new Date().toISOString(),
          commitment_status: "arrived",
        })
        .eq("nook_id", nookId)
        .eq("user_id", userId);

      queryClient.invalidateQueries({ queryKey: ["my-arrival", nookId] });
      queryClient.invalidateQueries({ queryKey: ["my-qr-attendance", nookId] });
      queryClient.invalidateQueries({ queryKey: ["nook-arrivals", nookId] });
      queryClient.invalidateQueries({ queryKey: ["nook-readiness", nookId] });
      toast({ title: "✔ Attendance confirmed", description: "You're checked in." });
      setShowScanner(false);
      setCode("");
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }

    setIsScanning(false);
  };

  if (!isParticipant || !inArrivalWindow) return null;

  const hasArrived = myMember?.arrival_status === "arrived" ||
    myAttendance?.status === "attended" ||
    myAttendance?.status === "late";
  const arrivedCount = arrivals.length;
  const showNames = arrivedCount >= 3;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      {/* Nook Code */}
      {nookCode && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Nook Code</p>
          <span className="text-sm font-mono font-semibold text-foreground bg-secondary px-3 py-1 rounded-lg">
            {nookCode}
          </span>
        </div>
      )}

      {/* Exact Meeting Spot */}
      {venueNote && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Exact Meeting Spot</p>
            <p className="text-sm text-foreground">{venueNote}</p>
          </div>
        </div>
      )}

      {/* Arrival action */}
      {hasArrived ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <p className="font-medium text-foreground">You're checked in</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{arrivedCount} {arrivedCount === 1 ? "person has" : "people have"} arrived</span>
          </div>

          {/* Show names only after 3 arrived */}
          {showNames && (
            <div className="space-y-1.5 pt-1">
              {arrivals.map((a: any) => (
                <div key={a.userId} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {a.displayName} — Arrived
                </div>
              ))}
            </div>
          )}
        </div>
      ) : showScanner ? (
        /* QR code entry screen */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground text-sm">Enter Host Code</p>
              <p className="text-xs text-muted-foreground">Ask the host for the code on their screen.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-12 rounded-xl font-mono text-center text-lg tracking-widest"
              maxLength={8}
              autoFocus
            />
            <Button
              onClick={handleScanVerify}
              disabled={isScanning || !code.trim()}
              className="h-12 rounded-xl px-6"
            >
              {isScanning ? "..." : "Verify"}
            </Button>
          </div>
          <button
            onClick={() => setShowScanner(false)}
            className="text-xs text-muted-foreground underline"
          >
            Go back
          </button>
        </div>
      ) : (
        <Button
          className="w-full h-11 rounded-xl gap-2"
          onClick={() => setShowScanner(true)}
        >
          <MapPin className="w-4 h-4" />
          📍 I've Arrived
        </Button>
      )}

      {/* Host status */}
      {hostModeActive?.host_mode_active ? (
        <p className="text-xs text-muted-foreground">
          🪺 Host is at the anchor spot.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Host not yet arrived.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Look for the Nook Host screen at the defined anchor point.
      </p>
    </div>
  );
}
