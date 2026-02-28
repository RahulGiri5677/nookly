import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ScanLine, LogIn, LogOut } from "lucide-react";
import { QRScanner } from "./QRScanner";

interface QRAttendanceProps {
  nookId: string;
  isHost: boolean;
  meetupDateTime: Date;
  meetupEndTime: Date;
}

type ScanPhase = "entry" | "exit";
type ScanState = "idle" | "scanning" | "success" | "error";

function getActivePhase(startTime: Date, endTime: Date): ScanPhase | null {
  const now = Date.now();
  const start = startTime.getTime();
  const end = endTime.getTime();

  const entryStart = start - 15 * 60 * 1000;
  const entryEnd = start + 15 * 60 * 1000;
  const exitStart = end - 15 * 60 * 1000;
  const exitEnd = end + 15 * 60 * 1000;

  if (now >= entryStart && now <= entryEnd) return "entry";
  if (now >= exitStart && now <= exitEnd) return "exit";
  return null;
}

function isInScanWindow(startTime: Date, endTime: Date): boolean {
  return getActivePhase(startTime, endTime) !== null;
}

export function QRAttendance({ nookId, isHost, meetupDateTime, meetupEndTime }: QRAttendanceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedPhase, setScannedPhase] = useState<ScanPhase | null>(null);
  const [entryDone, setEntryDone] = useState(false);
  const [exitDone, setExitDone] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update time every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Load existing attendance
  useEffect(() => {
    if (!user) return;
    supabase
      .from("attendance")
      .select("status, entry_marked, exit_marked")
      .eq("nook_id", nookId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEntryDone(!!(data as any).entry_marked);
          setExitDone(!!(data as any).exit_marked);
        }
      });
  }, [nookId, user]);

  const activePhase = getActivePhase(meetupDateTime, meetupEndTime);
  const inWindow = isInScanWindow(meetupDateTime, meetupEndTime);

  const handleScan = useCallback(async (rawData: string) => {
    if (isVerifying || !user) return;
    setScannerOpen(false);
    setIsVerifying(true);
    setScanState("idle");

    try {
      let parsedToken: object;
      try {
        parsedToken = JSON.parse(rawData);
      } catch {
        toast({ title: "Invalid QR", description: "This doesn't look like a Nook QR code.", variant: "destructive" });
        setScanState("error");
        setIsVerifying(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token: parsedToken }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast({ title: "Scan failed", description: result.error || "Try again.", variant: "destructive" });
        setScanState("error");
      } else {
        const phase = (parsedToken as any).phase as ScanPhase;
        setScannedPhase(phase);
        if (phase === "entry") setEntryDone(true);
        if (phase === "exit") setExitDone(true);
        setScanState("success");
        toast({ title: phase === "entry" ? "✔ Entry Confirmed" : "✔ Exit Confirmed", description: result.message });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      setScanState("error");
    }
    setIsVerifying(false);
  }, [isVerifying, user, nookId, toast]);

  // Host: not shown here — host has HostAnchorMode screen
  if (isHost) return null;

  // Before window
  if (!inWindow) {
    const start = meetupDateTime.getTime();
    const entryStart = start - 15 * 60 * 1000;
    const now = Date.now();

    const isFuture = now < entryStart;

    return (
      <div className="bg-secondary/30 rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">Attendance Scan</p>
            <p className="text-xs">
              {isFuture
                ? "Entry scan opens 15 minutes before the meetup starts."
                : "Scan windows have closed. Attendance will be processed automatically."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Already fully done
  if (entryDone && exitDone) {
    return (
      <div className="bg-success/10 rounded-2xl border border-success/30 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <div>
            <p className="font-medium text-foreground">Attendance Complete</p>
            <p className="text-xs text-muted-foreground">Entry and exit confirmed. Thanks for being there.</p>
          </div>
        </div>
      </div>
    );
  }

  const showEntryBlock = activePhase === "entry" && !entryDone;
  const showExitBlock = activePhase === "exit" && entryDone && !exitDone;
  const showExitRequiresEntry = activePhase === "exit" && !entryDone;

  return (
    <>
      {scannerOpen && (
        <QRScanner
          label={activePhase === "exit" ? "Scan Exit QR" : "Scan Entry QR"}
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground text-sm">Attendance</p>
          <span className={`ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium ${
            activePhase === "exit"
              ? "bg-primary/10 text-primary"
              : "bg-success/10 text-success"
          }`}>
            {activePhase === "exit" ? "EXIT SCAN" : "ENTRY SCAN"}
          </span>
        </div>

        {/* Entry status */}
        <div className="flex items-center gap-2">
          {entryDone ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-border" />
          )}
          <div className="flex items-center gap-1.5">
            <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={`text-sm ${entryDone ? "text-foreground" : "text-muted-foreground"}`}>
              Entry scan {entryDone ? "confirmed" : "pending"}
            </span>
          </div>
        </div>

        {/* Exit status */}
        <div className="flex items-center gap-2">
          {exitDone ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-border" />
          )}
          <div className="flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={`text-sm ${exitDone ? "text-foreground" : "text-muted-foreground"}`}>
              Exit scan {exitDone ? "confirmed" : "pending"}
            </span>
          </div>
        </div>

        {showEntryBlock && (
          <Button
            className="w-full h-12 rounded-xl"
            onClick={() => setScannerOpen(true)}
            disabled={isVerifying}
          >
            <ScanLine className="w-4 h-4 mr-2" />
            {isVerifying ? "Verifying..." : "Scan Entry QR"}
          </Button>
        )}

        {showExitBlock && (
          <Button
            className="w-full h-12 rounded-xl"
            variant="outline"
            onClick={() => setScannerOpen(true)}
            disabled={isVerifying}
          >
            <ScanLine className="w-4 h-4 mr-2" />
            {isVerifying ? "Verifying..." : "Scan Exit QR"}
          </Button>
        )}

        {showExitRequiresEntry && (
          <p className="text-xs text-muted-foreground text-center">
            Exit scan requires entry scan first. If you missed entry, attendance will be marked partial.
          </p>
        )}

        {scanState === "success" && (
          <p className="text-xs text-success text-center">
            {scannedPhase === "entry" ? "✔ You're checked in." : "✔ Thanks for staying till the end."}
          </p>
        )}
      </div>
    </>
  );
}
