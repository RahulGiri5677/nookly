import { format } from "date-fns";
import { NOOK_CATEGORIES } from "@/types/nook";
import { formatDurationHours } from "@/lib/utils";
import type { NookFormData } from "./RaiseNookForm";

interface NookPreviewProps {
  data: NookFormData;
}

const TOPIC_EMOJIS: Record<string, string> = {
  "Coffee & Conversation": "☕",
  "Walk & Talk": "🚶",
  "Books": "📚",
  "Art & Creativity": "🎨",
  "Music": "🎶",
  "Discussion": "💬",
  "Learning / Skill Share": "🧠",
};

export function NookPreview({ data }: NookPreviewProps) {
  const dateTime = data.date && data.time ? new Date(`${data.date}T${data.time}`) : null;
  const cat = NOOK_CATEGORIES.find((c) => c.value === data.category);
  const topicEmoji = TOPIC_EMOJIS[data.topic] || "🪺";

  const isWomenOnly = data.genderRestriction === "women_only";
  const isInclusive = isWomenOnly && data.inclusiveNonBinary;
  const womenBadgeLabel = isInclusive ? "🌸 Women & Non-binary" : "🌸 Women Only";
  const womenSubtext = isInclusive
    ? "A space created for women and non-binary participants."
    : "A space created with care for women.";

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>

      {/* Invite card */}
      <div className={`border rounded-2xl shadow-md overflow-hidden ${isWomenOnly ? "bg-[hsl(var(--women-card-bg))] border-[hsl(var(--women-card-border))]" : "bg-card border-border/50"}`}>
        {/* Card top accent strip */}
        <div className={`h-1 w-full ${isWomenOnly ? "bg-[hsl(var(--women-accent)/0.5)]" : "bg-primary/30"}`} />

        <div className="p-6 space-y-4">
          {/* Women-only badge */}
          {isWomenOnly && (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(var(--women-badge-bg))] border border-[hsl(var(--women-badge-border))] text-[hsl(var(--women-badge-text))]">
                {womenBadgeLabel}
              </span>
            </div>
          )}

          {/* Topic & category */}
          <div>
            <p className="text-xl font-semibold text-foreground leading-tight">
              {topicEmoji} {data.topic || "—"}
            </p>
            {cat && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {cat.emoji} {cat.label}
              </p>
            )}
            {isWomenOnly && (
              <p className="text-xs text-muted-foreground mt-1 italic">{womenSubtext}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/40" />

          {/* Details grid */}
          <div className="space-y-2.5">
            {data.city || data.venue ? (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">📍</span>
                <div>
                  <p className="text-sm text-foreground leading-snug">
                    {data.venue || data.city}
                  </p>
                  {data.city && data.venue && (
                    <p className="text-xs text-muted-foreground">{data.city}</p>
                  )}
                </div>
              </div>
            ) : null}

            {data.exactSpot && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">🎯</span>
                <p className="text-sm text-foreground">{data.exactSpot}</p>
              </div>
            )}

            {dateTime && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">🕒</span>
                <p className="text-sm text-foreground">
                  {format(dateTime, "EEE, MMM d 'at' h:mm a")}
                  {data.durationMinutes && (
                    <span className="text-muted-foreground">
                      {" "}· {formatDurationHours(parseInt(data.durationMinutes) || 60)}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">👥</span>
              <p className="text-sm text-foreground">
                {cat ? `${cat.label} (4–${data.maxPeople})` : `Up to ${data.maxPeople} people`}
              </p>
            </div>

            {data.comfortVibes.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">🌸</span>
                <p className="text-sm text-foreground">{data.comfortVibes.join(" · ")}</p>
              </div>
            )}

            {data.genderRestriction === "women_only" && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">🌸</span>
                <p className="text-sm text-foreground">
                  {data.inclusiveNonBinary ? "Women & Non-binary" : "Women only"}
                </p>
              </div>
            )}

            {data.icebreaker && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">💬</span>
                <p className="text-sm text-foreground">{data.icebreaker}</p>
              </div>
            )}
          </div>

          {/* Accessibility tags */}
          {(data.wheelchairFriendly || data.groundFloorAccess) && (
            <>
              <div className="border-t border-border/40" />
              <div className="flex flex-wrap gap-2">
                {data.wheelchairFriendly && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground">
                    ♿ Wheelchair friendly
                  </span>
                )}
                {data.groundFloorAccess && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground">
                    🏢 Ground floor
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Card footer */}
        <div className="px-6 py-3 bg-secondary/20 border-t border-border/30">
          <p className="text-xs text-muted-foreground/60 text-center tracking-wide">Nook · Small, safe, intentional</p>
        </div>
      </div>
    </div>
  );
}
