import { useEffect, useRef, useState } from "react";

interface MeetupStatsProps {
  joined: number;
  attended: number;
  noShows: number;
  hosted: number;
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const end = value;
    const diff = end - start;
    if (diff === 0) return;
    const steps = Math.min(Math.abs(diff), 20);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(start + (diff * step) / steps));
      if (step >= steps) {
        clearInterval(timer);
        prev.current = end;
      }
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span
      key={value}
      className="text-lg font-semibold text-foreground transition-all duration-300"
    >
      {display}
    </span>
  );
}

export function MeetupStats({ joined, attended, noShows, hosted }: MeetupStatsProps) {
  const stats = [
    { value: hosted, label: "Nooks Hosted" },
    { value: joined, label: "Nooks Joined" },
    { value: attended, label: "Nooks Attended" },
    { value: noShows, label: "No-Shows" },
  ];

  return (
    <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <h2 className="font-medium text-foreground text-sm">Meetup Summary</h2>
      <div className="grid grid-cols-2 gap-3 text-center">
        {stats.map(({ value, label }) => (
          <div key={label} className="space-y-1 bg-secondary/30 rounded-xl py-3 px-2">
            <AnimatedCount value={value} />
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
