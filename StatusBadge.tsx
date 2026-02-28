import { cn } from "@/lib/utils";
import type { MeetupPhaseInfo } from "@/lib/meetupPhase";

interface StatusBadgeProps {
  phase: MeetupPhaseInfo;
  className?: string;
}

export function StatusBadge({ phase, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border-0 shrink-0",
        phase.colorClass,
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full shrink-0", phase.dotClass)} />
      <span className="whitespace-nowrap">{phase.label}</span>
    </span>
  );
}
