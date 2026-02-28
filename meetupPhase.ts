export type MeetupPhase = "filling_up" | "arrival" | "live" | "completed" | "cancelled";

export interface MeetupPhaseInfo {
  phase: MeetupPhase;
  label: string;
  /** @deprecated use dot indicator instead */
  emoji: string;
  colorClass: string;
  dotClass: string;
}

export function computeMeetupPhase(
  startTime: Date,
  durationMinutes: number,
  dbStatus: string,
  now: Date = new Date()
): MeetupPhaseInfo {
  if (dbStatus === "cancelled") {
    return {
      phase: "cancelled",
      label: "Cancelled",
      emoji: "",
      colorClass: "bg-destructive/8 text-destructive/80 border-transparent",
      dotClass: "bg-destructive/60",
    };
  }

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const arrivalStart = new Date(startTime.getTime() - 15 * 60 * 1000);

  if (now >= endTime) {
    return {
      phase: "completed",
      label: "Completed",
      emoji: "",
      colorClass: "bg-muted/60 text-muted-foreground border-transparent",
      dotClass: "bg-accent/70",
    };
  }

  if (now >= startTime) {
    return {
      phase: "live",
      label: "Live Now",
      emoji: "",
      colorClass: "bg-success/10 text-success border-transparent",
      dotClass: "bg-success",
    };
  }

  if (now >= arrivalStart) {
    return {
      phase: "arrival",
      label: "Gathering",
      emoji: "",
      colorClass: "bg-warning/10 text-warning-foreground border-transparent",
      dotClass: "bg-warning",
    };
  }

  // Before arrival window
  if (dbStatus === "confirmed") {
    return {
      phase: "filling_up",
      label: "Confirmed",
      emoji: "",
      colorClass: "bg-success/10 text-success border-transparent",
      dotClass: "bg-success",
    };
  }

  return {
    phase: "filling_up",
    label: "Filling Up",
    emoji: "",
    colorClass: "bg-pending/10 text-pending border-transparent",
    dotClass: "bg-pending",
  };
}
