interface ParticipationStyleProps {
  tags: string[];
}

// Map common feedback tags to soft participation style labels
const TAG_TO_STYLE: Record<string, string> = {
  Friendly: "Warm presence",
  Respectful: "Calm participant",
  "Good listener": "Listener-friendly",
  Punctual: "Punctual",
  Welcoming: "Warm presence",
  Inclusive: "Inclusive energy",
};

export function ParticipationStyle({ tags }: ParticipationStyleProps) {
  if (!tags || tags.length === 0) return null;

  // Count occurrences, pick top 2
  const counts: Record<string, number> = {};
  for (const tag of tags) {
    const style = TAG_TO_STYLE[tag];
    if (style) {
      counts[style] = (counts[style] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label]) => label);

  if (sorted.length === 0) return null;

  return (
    <section className="bg-card rounded-2xl border border-border p-4 space-y-2">
      <h2 className="font-medium text-foreground text-sm">Participation Style</h2>
      <div className="flex flex-wrap gap-2">
        {sorted.map((label) => (
          <span
            key={label}
            className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full"
          >
            🧘 {label}
          </span>
        ))}
      </div>
    </section>
  );
}
