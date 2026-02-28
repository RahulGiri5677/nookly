import { useWeightedReliability } from "@/hooks/useWeightedReliability";

interface CredibilityBadgeProps {
  userId: string;
}

const TIER_CONFIG = {
  reliable:   { label: "Reliable",   emoji: "⭐" },
  consistent: { label: "Consistent", emoji: "🌿" },
  growing:    { label: "Growing",    emoji: "🌱" },
  new:        { label: "New",        emoji: "🤍" },
} as const;

/**
 * Badge tier is determined by a server-computed weighted reliability ratio:
 *   recent_ratio (last 180 days) × 0.7 + lifetime_ratio × 0.3
 *
 * This intentionally reflects recent consistency more than historical volume.
 * Formula and weights are internal-only — never shown to users.
 */
export function CredibilityBadge({ userId }: CredibilityBadgeProps) {
  const { data } = useWeightedReliability(userId);

  const tier = data?.tier ?? "new";
  const { label, emoji } = TIER_CONFIG[tier];

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
      {emoji} {label}
    </div>
  );
}

// Keep computeBadge export for any external callers (no-op fallback)
export function computeBadge(
  _hosted: number,
  _attended: number,
  _noShows: number,
  _comfort?: number
) {
  return { label: "New", emoji: "🤍", level: 1 };
}
