import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Users } from "lucide-react";

type Phase = "entry" | "exit";

export default function HostAnchorMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<object | null>(null);
  const [tokenStr, setTokenStr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [scanPhase, setScanPhase] = useState<Phase>("entry");
  const [windowError, setWindowError] = useState<string | null>(null);

  const { data: nook } = useQuery({
    queryKey: ["nook-anchor", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("nooks")
        .select("id, topic, venue_note, nook_code, host_id, host_mode_active, date_time, duration_minutes")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Get arrived count
  const { data: arrivedCount = 0 } = useQuery({
    queryKey: ["anchor-arrivals", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("attendance")
        .select("id")
        .eq("nook_id", id!)
        .eq("entry_marked", true);
      return data?.length || 0;
    },
    enabled: !!id,
    refetchInterval: 15000,
  });

  // Determine active phase based on server time windows
  const getActivePhase = useCallback((): Phase | null => {
    if (!nook) return null;
    const now = Date.now();
    const start = new Date(nook.date_time).getTime();
    const durationMs = (nook.duration_minutes || 60) * 60 * 1000;
    const end = start + durationMs;

    const entryStart = start - 15 * 60 * 1000;
    const entryEnd = start + 15 * 60 * 1000;
    const exitStart = end - 15 * 60 * 1000;
    const exitEnd = end + 15 * 60 * 1000;

    if (now >= entryStart && now <= entryEnd) return "entry";
    if (now >= exitStart && now <= exitEnd) return "exit";
    return null;
  }, [nook]);

  // Host Anchor Mode visibility window: T-10 to T+30 min
  const isInAnchorWindow = useCallback((): boolean => {
    if (!nook) return false;
    const now = Date.now();
    const start = new Date(nook.date_time).getTime();
    const durationMs = (nook.duration_minutes || 60) * 60 * 1000;
    const end = start + durationMs;
    const windowOpen = start - 10 * 60 * 1000;
    const windowClose = end + 30 * 60 * 1000;
    return now >= windowOpen && now <= windowClose;
  }, [nook]);

  // Generate signed QR token via edge function
  const generateToken = useCallback(async (phase: Phase) => {
    if (!id || !user) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-qr-secret`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ nook_id: id, phase }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setToken(result.token);
        setTokenStr(JSON.stringify(result.token));
        setWindowError(null);
        setCountdown(60);
      } else {
        const err = await response.json();
        setWindowError(err.error || "QR not available");
      }
    } catch {
      setWindowError("Connection error. Retrying...");
    }
  }, [id, user]);

  // Update phase and generate token on phase change
  useEffect(() => {
    if (!nook || !user || nook.host_id !== user.id) return;
    const phase = getActivePhase();
    if (!phase) return;
    setScanPhase(phase);
    generateToken(phase);
  }, [nook?.date_time, nook?.host_id, user?.id]);

  // Refresh token every 60 seconds
  useEffect(() => {
    if (!nook || !user || nook.host_id !== user.id) return;
    const phase = getActivePhase();
    if (!phase) return;

    const interval = setInterval(() => {
      const currentPhase = getActivePhase();
      if (!currentPhase) return;
      setScanPhase(currentPhase);
      generateToken(currentPhase);
    }, 60000);

    return () => clearInterval(interval);
  }, [nook?.host_id, user?.id, generateToken, getActivePhase]);

  // Countdown timer
  useEffect(() => {
    if (!tokenStr) return;
    setCountdown(60);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [tokenStr]);

  // Activate host mode on mount
  useEffect(() => {
    if (!id || !user || !nook) return;
    if (nook.host_id !== user.id) return;

    (supabase as any)
      .from("nooks")
      .update({ host_mode_active: true })
      .eq("id", id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["host-mode", id] });
      });

    return () => {
      (supabase as any)
        .from("nooks")
        .update({ host_mode_active: false })
        .eq("id", id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["host-mode", id] });
        });
    };
  }, [id, user, nook?.host_id]);

  if (!nook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user?.id !== nook.host_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Only the host can activate this screen.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </div>
    );
  }

  const activePhase = getActivePhase();
  const inAnchorWindow = isInAnchorWindow();

  // Phase label
  const phaseLabel = scanPhase === "exit" ? "Exit Scan Active" : "Entry Scan Active";
  const phaseSubtext = scanPhase === "exit"
    ? "Participants are scanning to confirm they stayed."
    : "Participants are scanning to confirm arrival.";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Exit button */}
      <div className="p-4 border-b border-border/50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-2 hover:bg-secondary/50 rounded-lg transition-colors text-sm font-medium text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Main anchor display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Host Mode
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {nook.topic}
          </h1>
        </div>

        {/* Anchor Spot */}
        {nook.venue_note && (
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Anchor Spot</p>
            <p className="text-base text-foreground leading-relaxed">{nook.venue_note}</p>
          </div>
        )}

        {/* QR section */}
        {!inAnchorWindow ? (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Host Mode not yet active</p>
            <p className="text-xs text-muted-foreground">
              Available 10 minutes before meetup start.
            </p>
          </div>
        ) : activePhase === null ? (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Between Scan Windows</p>
            <p className="text-xs text-muted-foreground">
              QR scans open 15 minutes before start and 15 minutes before meetup end.
            </p>
          </div>
        ) : windowError ? (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
            <p className="text-sm text-muted-foreground">{windowError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateToken(scanPhase)}
            >
              Retry
            </Button>
          </div>
        ) : tokenStr ? (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            {/* Phase indicator */}
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{phaseLabel}</p>
                <p className="text-xs text-muted-foreground">{phaseSubtext}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                scanPhase === "exit"
                  ? "bg-primary/10 text-primary"
                  : "bg-success/10 text-success"
              }`}>
                {scanPhase === "exit" ? "EXIT" : "ENTRY"}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <QRCodeSVG value={tokenStr} size={180} bgColor="white" fgColor="black" />
              </div>

              {/* Countdown ring */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="3"
                      strokeDasharray={`${(countdown / 60) * 100} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-foreground">
                    {countdown}
                  </span>
                </div>
                <span className="text-xs">Refreshes in {countdown}s</span>
              </div>
            </div>

            {/* Host exit reminder — subtle, non-aggressive */}
            {scanPhase === "exit" && (
              <p className="text-xs text-muted-foreground text-center border-t border-border/40 pt-3">
                Please complete the exit scan to close this Nook properly.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center">
            <p className="text-sm text-muted-foreground">Generating QR code...</p>
          </div>
        )}

        {/* Arrived count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm">{arrivedCount} checked in</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Keep this screen visible so participants can find you.
        </p>
      </div>
    </div>
  );
}
