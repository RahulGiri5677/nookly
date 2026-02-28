import { MapPin, Users, MessageCircle } from "lucide-react";

const signals = [
  { icon: MapPin, text: "Public place" },
  { icon: Users, text: "Small group" },
  { icon: MessageCircle, text: "No pressure to speak" },
];

export function ComfortSignals() {
  return (
    <div className="flex flex-wrap gap-3">
      {signals.map((signal, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-2 bg-accent/50 rounded-lg text-sm text-accent-foreground"
        >
          <signal.icon className="w-4 h-4" />
          <span>{signal.text}</span>
        </div>
      ))}
    </div>
  );
}
