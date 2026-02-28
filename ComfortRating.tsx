interface ComfortRatingProps {
  avgRating: number | null;
  totalMeetups: number;
}

export function ComfortRating({ avgRating, totalMeetups }: ComfortRatingProps) {
  if (avgRating === null || totalMeetups === 0) return null;

  return (
    <section className="bg-card rounded-2xl border border-border p-4 space-y-2">
      <h2 className="font-medium text-foreground text-sm">Comfort Rating</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">⭐ {avgRating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">/ 5</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Based on {totalMeetups} meetup{totalMeetups !== 1 ? "s" : ""}.
      </p>
    </section>
  );
}
