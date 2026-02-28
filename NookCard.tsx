import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { computeMeetupPhase } from "@/lib/meetupPhase";
import type { Nook } from "@/types/nook";
import { NOOK_CATEGORIES } from "@/types/nook";

const TOPIC_EMOJIS: Record<string, string> = {
  "Coffee & Conversation": "☕",
  "Walk & Talk": "🚶",
  "Books": "📚",
  "Art & Creativity": "🎨",
  "Music": "🎶",
  "Discussion": "💬",
  "Learning / Skill Share": "📚",
};

interface NookCardProps {
  nook: Nook & { genderRestriction?: string; gender_restriction?: string; inclusive_non_binary?: boolean };
  onClick?: () => void;
  className?: string;
}

export function NookCard({ nook, onClick, className }: NookCardProps) {
  const formattedDate = format(nook.dateTime, "EEE, MMM d · h:mm a");
  const emoji = TOPIC_EMOJIS[nook.topic] ?? "";
  const cat = NOOK_CATEGORIES.find((c) => c.value === nook.category);
  const isWomenOnly =
    (nook as any).genderRestriction === "women_only" ||
    (nook as any).gender_restriction === "women_only";
  const isInclusive = isWomenOnly && !!(nook as any).inclusive_non_binary;
  const womenBadgeLabel = isInclusive ? "🌸 Women & NB" : "🌸 Women Only";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-5 py-5 rounded-[1.25rem] border animate-fade-in relative",
        "nook-btn-press focus:outline-none focus:ring-2 focus:ring-primary/20",
        // transition
        "transition-all duration-220",
        isWomenOnly
          ? [
              "bg-[hsl(var(--women-card-bg))]",
              "border-[hsl(var(--women-card-border))]",
              "shadow-[var(--card-shadow)]",
              "hover:shadow-[var(--card-shadow-hover)]",
              "hover:border-[hsl(var(--women-accent)/0.35)]",
              "hover:-translate-y-[1px]",
            ]
          : [
              "bg-card border-border",
              "shadow-[var(--card-shadow)]",
              "hover:shadow-[var(--card-shadow-hover)]",
              "hover:border-primary/20",
              "hover:-translate-y-[1px]",
            ],
        className
      )}
    >
      {/* Top row: Status + Women badge */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="shrink-0">
          <StatusBadge
            phase={computeMeetupPhase(nook.dateTime, nook.durationMinutes || 60, nook.status)}
          />
        </div>
        {isWomenOnly && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 border",
              "bg-[hsl(var(--women-badge-bg))] border-[hsl(var(--women-badge-border))] text-[hsl(var(--women-badge-text))]"
            )}
          >
            {womenBadgeLabel}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-lg leading-snug mb-2.5 break-words min-w-0">
        {emoji ? `${emoji} ` : ""}
        {nook.topic}
      </h3>

      {/* Category chip */}
      {cat && (
        <div className="mb-3.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium border border-accent/20">
            {cat.emoji} {cat.label}
          </span>
        </div>
      )}

      {/* Meta rows */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 text-muted-foreground text-sm">
          <span className="shrink-0 mt-0.5">🗓️</span>
          <span className="break-words min-w-0">{formattedDate}</span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground text-sm">
          <span className="shrink-0 mt-0.5">📍</span>
          <span className="break-words min-w-0">{nook.city}</span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground text-sm">
          <span className="shrink-0 mt-0.5">👥</span>
          <span className="break-words min-w-0">
            {nook.currentPeople} of {nook.maxPeople} joined
          </span>
        </div>
        {nook.comfortDetail && (
          <div className="flex items-start gap-2 text-muted-foreground text-sm">
            <span className="shrink-0 mt-0.5">🌸</span>
            <span className="break-words min-w-0">Comfort: {nook.comfortDetail}</span>
          </div>
        )}
      </div>
    </button>
  );
}
