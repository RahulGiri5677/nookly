import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  NOOK_TOPICS,
  NOOK_RULES,
  NOOK_CATEGORIES,
  COMFORT_VIBE_OPTIONS,
  type NookTopic,
  type NookCategory,
} from "@/types/nook";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NookFormData {
  topic: NookTopic | "";
  category: NookCategory | "";
  comfortVibes: string[];
  city: string;
  venue: string;
  exactSpot: string;
  googleMapsLink: string;
  date: string;
  time: string;
  durationMinutes: string;
  maxPeople: string;
  icebreaker: string;
  wheelchairFriendly: boolean;
  groundFloorAccess: boolean;
  agreedToRules: boolean;
  genderRestriction: "open" | "women_only";
  inclusiveNonBinary: boolean;
}

interface RaiseNookFormProps {
  data: NookFormData;
  onChange: (data: NookFormData) => void;
  /** When provided, only renders the section(s) for that step index (0-4). Omit to render all sections. */
  visibleStep?: number;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const DURATION_OPTIONS = [
  { value: "30", label: "30m" },
  { value: "60", label: "1h" },
  { value: "90", label: "1.5h" },
  { value: "120", label: "2h" },
  { value: "180", label: "3h" },
  { value: "240", label: "4h" },
  { value: "300", label: "5h" },
];

const TOPIC_TILES: { value: NookTopic; emoji: string; label: string }[] = [
  { value: "Coffee & Conversation", emoji: "☕", label: "Coffee & Conversation" },
  { value: "Walk & Talk", emoji: "🚶", label: "Walk & Talk" },
  { value: "Books", emoji: "📚", label: "Books & Ideas" },
  { value: "Art & Creativity", emoji: "🎨", label: "Art & Creativity" },
  { value: "Music", emoji: "🎶", label: "Music Moments" },
  { value: "Discussion", emoji: "💬", label: "Open Discussion" },
  { value: "Learning / Skill Share", emoji: "🧠", label: "Learn & Grow" },
];

const COMFORT_EMOJIS: Record<string, string> = {
  "Quiet space": "🌙",
  "Open seating": "☀️",
  "Cozy café": "☕",
  "Outdoor": "🌿",
  "Library vibe": "📚",
};

function isValidMapsLink(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("maps.app.goo.gl") || u.hostname.includes("google.com");
  } catch {
    return false;
  }
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card rounded-2xl p-5 shadow-sm border border-border/40", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground mb-1.5">{children}</p>;
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{children}</p>;
}

function UnderlineInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 2,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  const baseClass =
    "w-full bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary text-foreground text-sm placeholder:text-muted-foreground/60 py-2 transition-colors resize-none max-w-full";
  const handleChange = (raw: string) => {
    onChange(maxLength ? raw.slice(0, maxLength) : raw);
  };
  const counter = maxLength ? (
    <p className={`text-xs mt-1 text-right tabular-nums ${value.length >= maxLength ? "text-destructive/70" : "text-muted-foreground/50"}`}>
      {value.length}/{maxLength}
    </p>
  ) : null;
  if (multiline) {
    return (
      <>
        <textarea
          className={baseClass}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
        />
        {counter}
      </>
    );
  }
  return (
    <>
      <input
        className={baseClass}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {counter}
    </>
  );
}

// ─── AI helper: call ai-nook edge function ────────────────────────────────────
async function callAiNook(type: string, payload: Record<string, string>) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-nook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ type, ...payload }),
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // fail silently
  } finally {
    clearTimeout(timeout);
  }
}

const INSPIRATION_CHIPS = [
  "Play board games",
  "Icebreaker question round",
  "Short storytelling circle",
  "Share favourite songs",
  "Group sketching or doodling",
  "Card games",
  "Two truths and a lie",
  "Quick mindfulness breathing",
  "Small group pair conversations",
  "Coffee & conversation round",
];

function InspirationChips({ onSelect }: { onSelect: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
      >
        <span className="text-[10px] transition-transform duration-200" style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
        <span>✨ Need inspiration?</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
          {INSPIRATION_CHIPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onSelect(s); setOpen(false); }}
              className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95 transition-all duration-150"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RaiseNookForm({ data, onChange, visibleStep }: RaiseNookFormProps) {
  const show = (s: number) => visibleStep === undefined || visibleStep === s;
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  // Track whether hour has been picked (so we know to auto-close after minute)
  const [hourPicked, setHourPicked] = useState(false);

  // ── AI state ──────────────────────────────────────────────────────────────
  const [icebreakerSuggestions, setIcebreakerSuggestions] = useState<string[]>([]);
  const [icebreakerLoading, setIcebreakerLoading] = useState(false);
  const [topicRefinement, setTopicRefinement] = useState<{
    title: string; description: string; category: string;
  } | null>(null);
  const [topicRefLoading, setTopicRefLoading] = useState(false);

  const icebreakerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topicDebounce      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWomenOnly = data.genderRestriction === "women_only";

  // ── Debounced AI: icebreaker suggestions on topic change ─────────────────
  useEffect(() => {
    const topic = data.topic;
    if (!topic || topic.length < 3) { setIcebreakerSuggestions([]); return; }
    if (icebreakerDebounce.current) clearTimeout(icebreakerDebounce.current);
    icebreakerDebounce.current = setTimeout(async () => {
      setIcebreakerLoading(true);
      const result = await callAiNook("icebreaker_suggestions", { topic });
      setIcebreakerSuggestions(result?.suggestions ?? []);
      setIcebreakerLoading(false);
    }, 600);
    return () => { if (icebreakerDebounce.current) clearTimeout(icebreakerDebounce.current); };
  }, [data.topic]);

  const update = <K extends keyof NookFormData>(key: K, value: NookFormData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateMultiple = (updates: Partial<NookFormData>) => {
    onChange({ ...data, ...updates });
  };

  const toggleComfortVibe = (vibe: string) => {
    const current = data.comfortVibes;
    if (current.includes(vibe)) {
      update("comfortVibes", current.filter((v) => v !== vibe));
    } else if (current.length < 2) {
      update("comfortVibes", [...current, vibe]);
    }
  };

  const timeParts = data.time ? data.time.split(":").map(Number) : [null, null];
  const currentHour24 = timeParts[0];
  const currentMinute = timeParts[1];
  const currentAmPm = currentHour24 !== null ? (currentHour24 >= 12 ? "PM" : "AM") : "AM";
  const currentHour12 = currentHour24 !== null ? (currentHour24 % 12 || 12) : null;

  const setTimeParts = (hour12: number, minute: number, amPm: string, closeAfter = false) => {
    let hour24 = hour12 % 12;
    if (amPm === "PM") hour24 += 12;
    const timeStr = `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    update("time", timeStr);
    if (closeAfter) {
      setTimeOpen(false);
      setHourPicked(false);
    }
  };

  const handleHourClick = (h: number) => {
    setTimeParts(h, currentMinute ?? 0, currentAmPm);
    setHourPicked(true);
  };

  const handleMinuteClick = (m: number) => {
    setTimeParts(currentHour12 ?? 12, m, currentAmPm, true);
  };

  const selectedDate = data.date ? new Date(data.date + "T00:00:00") : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      update("date", `${year}-${month}-${day}`);
      setCalendarOpen(false);
    }
  };

  const timeDisplay =
    currentHour12 !== null && currentMinute !== null
      ? `${currentHour12}:${currentMinute.toString().padStart(2, "0")} ${currentAmPm}`
      : null;

  return (
    <div className="space-y-5">

      {/* ─── SECTION 1: About this Nook ─── */}
      {show(0) && <SectionCard className={isWomenOnly ? "border-[hsl(var(--women-card-border))] bg-[hsl(var(--women-card-bg))]" : ""}>
        <SectionTitle>About this Nook</SectionTitle>

        {/* Meetup type cards */}
        <FieldLabel>What kind of gathering do you imagine?</FieldLabel>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {NOOK_CATEGORIES.map((cat) => {
            const isSelected = data.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() =>
                  updateMultiple({ category: cat.value, maxPeople: cat.maxPeople.toString() })
                }
                className={cn(
                  "text-left p-4 rounded-xl border transition-all duration-200",
                  isSelected
                    ? isWomenOnly
                      ? "border-[hsl(var(--women-card-border))] bg-[hsl(var(--women-card-bg))] shadow-sm"
                      : "border-primary/50 bg-primary/8 shadow-sm"
                    : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                )}
              >
                <p className="text-base mb-1">{cat.emoji}</p>
                <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.value === "small_circle" ? "4–8 people" : "9–15 people"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {cat.value === "small_circle"
                    ? "Calm, intimate conversations"
                    : "Slightly larger, still structured"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Group size pills — shown after category selection */}
        {data.category && (
          <div className="mb-5">
            <FieldLabel>How many people feels right?</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const min = data.category === "community" ? 9 : 4;
                const max = data.category === "community" ? 15 : 8;
                return Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update("maxPeople", n.toString())}
                    className={cn(
                      "w-10 h-10 rounded-full text-sm border transition-all duration-150 font-medium",
                      data.maxPeople === n.toString()
                        ? isWomenOnly
                          ? "bg-[hsl(var(--women-accent)/0.7)] text-foreground border-[hsl(var(--women-card-border))] shadow-sm"
                          : "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {n}
                  </button>
                ));
              })()}
            </div>
            <HelperText>Minimum 4 people needed for it to come alive.</HelperText>
          </div>
        )}

        {/* Participation setting */}
        <FieldLabel>Who is this space for?</FieldLabel>
        <div className="space-y-2 mb-4">
          {[
            { value: "open" as const, label: "Open to everyone", desc: "Anyone from the community can join" },
            { value: "women_only" as const, label: "🌸 Women only", desc: "A space created for women" },
          ].map((opt) => {
            const isSelected = data.genderRestriction === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("genderRestriction", opt.value)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200",
                  isSelected
                    ? opt.value === "women_only"
                      ? "border-[hsl(var(--women-card-border))] bg-[hsl(var(--women-card-bg))] shadow-sm"
                      : "border-primary/40 bg-primary/8 shadow-sm"
                    : "border-border/40 bg-secondary/20 hover:bg-secondary/50"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                  isSelected
                    ? opt.value === "women_only" ? "border-[hsl(var(--women-accent))]" : "border-primary"
                    : "border-border"
                )}>
                  {isSelected && (
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      opt.value === "women_only" ? "bg-[hsl(var(--women-accent))]" : "bg-primary"
                    )} />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Women-only inclusive NB checkbox */}
        {isWomenOnly && (
          <div className="mb-4 px-4 py-3.5 rounded-xl bg-[hsl(var(--women-card-bg))] border border-[hsl(var(--women-card-border))] space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This gathering is created for women. You may optionally include non-binary participants.
            </p>
            <button
              type="button"
              onClick={() => update("inclusiveNonBinary", !data.inclusiveNonBinary)}
              className={cn(
                "flex items-center gap-3 w-full text-left transition-colors"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                data.inclusiveNonBinary
                  ? "bg-[hsl(var(--women-accent)/0.7)] border-[hsl(var(--women-accent))]"
                  : "border-border"
              )}>
                {data.inclusiveNonBinary && (
                  <svg className="w-3 h-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-foreground">Inclusive of non-binary participants</span>
            </button>
          </div>
        )}

        {/* Topic tiles */}
        <FieldLabel>Topic</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {TOPIC_TILES.map((tile) => {
            const isSelected = data.topic === tile.value;
            return (
              <button
                key={tile.value}
                type="button"
                onClick={() => update("topic", tile.value)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150",
                  isSelected
                    ? isWomenOnly
                      ? "bg-[hsl(var(--women-card-bg))] border border-[hsl(var(--women-card-border))] text-foreground font-medium"
                      : "bg-primary/10 border border-primary/30 text-foreground font-medium"
                    : "bg-secondary/40 border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <span className="text-base shrink-0">{tile.emoji}</span>
                <span className="leading-tight">{tile.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── AI Topic Refinement (optional, non-blocking) ── */}
        {topicRefLoading && (
          <p className="text-xs text-muted-foreground animate-pulse mt-3">🌿 Thinking of a refined idea…</p>
        )}
        {topicRefinement && !topicRefLoading && (
          <div className="mt-3 p-4 rounded-xl bg-secondary/40 border border-border/40 space-y-2">
            <p className="text-xs text-muted-foreground">🌿 Refined idea:</p>
            <p className="text-sm font-medium text-foreground">{topicRefinement.title}</p>
            <p className="text-xs text-muted-foreground italic">"{topicRefinement.description}"</p>
            <p className="text-xs text-muted-foreground">Suggested: {topicRefinement.category}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...data,
                    topic: topicRefinement.title as any,
                    category: topicRefinement.category.toLowerCase() as any,
                  });
                  setTopicRefinement(null);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                Use this
              </button>
              <button
                type="button"
                onClick={() => setTopicRefinement(null)}
                className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep mine
              </button>
            </div>
          </div>
        )}
      </SectionCard>}

      {/* ─── SECTION 2: Location ─── */}
      {show(1) && <SectionCard>
        <SectionTitle>Where shall we meet?</SectionTitle>

        <div className="space-y-5">
          <div>
            <FieldLabel>City</FieldLabel>
            <UnderlineInput
              value={data.city}
              onChange={(v) => update("city", v)}
              placeholder="e.g., Mumbai"
              maxLength={60}
            />
          </div>

          <div>
            <FieldLabel>Full address</FieldLabel>
            <UnderlineInput
              value={data.venue}
              onChange={(v) => update("venue", v)}
              placeholder="e.g., Third Wave Coffee, Churchgate"
              multiline
              rows={2}
              maxLength={150}
            />
            <HelperText>Public places only — no private homes or residences.</HelperText>
          </div>

          <div>
            <FieldLabel>Google Maps link <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            <UnderlineInput
              value={data.googleMapsLink}
              onChange={(v) => update("googleMapsLink", v)}
              placeholder="https://maps.app.goo.gl/..."
            />
            {data.googleMapsLink.trim() && !isValidMapsLink(data.googleMapsLink.trim()) && (
              <HelperText>Paste a valid Google Maps link (maps.app.goo.gl or google.com/maps).</HelperText>
            )}
          </div>

          <div className="bg-secondary/40 rounded-xl p-4">
            <FieldLabel>Where exactly should we gather?</FieldLabel>
            <UnderlineInput
              value={data.exactSpot}
              onChange={(v) => update("exactSpot", v)}
              placeholder="e.g., 2nd floor, left corner near the glass railing"
              multiline
              rows={2}
              maxLength={150}
            />
            <HelperText>So everyone can meet up easily, without confusion.</HelperText>
            {data.exactSpot.length > 0 && data.exactSpot.length < 15 && (
              <p className="text-xs text-muted-foreground mt-1">
                Add a little more detail — at least 15 characters.
              </p>
            )}
          </div>
        </div>
      </SectionCard>}

      {/* ─── SECTION 3: When ─── */}
      {show(2) && <SectionCard>
        <SectionTitle>When</SectionTitle>

        <div className="flex gap-2 mb-4 flex-wrap">
          {/* Date picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-colors",
                  data.date
                    ? "border-primary/40 bg-primary/8 text-foreground"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {selectedDate ? format(selectedDate, "MMM d, EEE") : "Select date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 7);
                  return date < today || date > maxDate;
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Time picker — auto-closes after minute selection */}
          <Popover open={timeOpen} onOpenChange={(open) => { setTimeOpen(open); if (!open) setHourPicked(false); }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-colors",
                  timeDisplay
                    ? "border-primary/40 bg-primary/8 text-foreground"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {timeDisplay ? `⏰ ${timeDisplay}` : "Select time"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                {!hourPicked ? (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pick an hour</p>
                    <div className="grid grid-cols-6 gap-1">
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleHourClick(h)}
                          className={cn(
                            "py-1.5 rounded-lg text-sm transition-colors",
                            currentHour12 === h
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-secondary text-muted-foreground"
                          )}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      {["AM", "PM"].map((ap) => (
                        <button
                          key={ap}
                          type="button"
                          onClick={() => setTimeParts(currentHour12 ?? 12, currentMinute ?? 0, ap)}
                          className={cn(
                            "flex-1 py-1.5 text-sm transition-colors",
                            currentAmPm === ap
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-secondary"
                          )}
                        >
                          {ap}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pick the minutes</p>
                    <div className="grid grid-cols-6 gap-1">
                      {MINUTES.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMinuteClick(m)}
                          className={cn(
                            "py-1.5 rounded-lg text-sm transition-colors",
                            currentMinute === m
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-secondary text-muted-foreground"
                          )}
                        >
                          {m.toString().padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setHourPicked(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Back to hour
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Duration */}
        <FieldLabel>How long will this feel right?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => update("durationMinutes", d.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm border transition-all duration-150",
                data.durationMinutes === d.value
                  ? "bg-primary text-primary-foreground border-primary font-medium"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </SectionCard>}

      {/* ─── SECTION 4: How it will feel ─── */}
      {show(3) && <SectionCard>
        <SectionTitle>How will it feel?</SectionTitle>

        <div className="space-y-5">
          <div>
            <FieldLabel>Pick something simple that helps everyone feel relaxed and comfortable.</FieldLabel>
            <UnderlineInput
              value={data.icebreaker}
              onChange={(v) => update("icebreaker", v)}
              placeholder='e.g., "Share your favourite book"'
              multiline
              rows={2}
              maxLength={120}
            />
            <HelperText>Start with something light to help everyone warm up naturally.</HelperText>

            {/* ── Inspiration Chips (collapsible) ── */}
            <InspirationChips onSelect={(s) => update("icebreaker", s)} />
          </div>

          <div>
            <FieldLabel>Comfort vibe <span className="text-muted-foreground font-normal">(pick up to 2)</span></FieldLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {COMFORT_VIBE_OPTIONS.map((vibe) => {
                const selected = data.comfortVibes.includes(vibe);
                const maxed = !selected && data.comfortVibes.length >= 2;
                return (
                  <button
                    key={vibe}
                    type="button"
                    disabled={maxed}
                    onClick={() => toggleComfortVibe(vibe)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm border transition-all duration-150",
                      selected
                        ? "bg-accent/60 border-accent text-foreground font-medium"
                        : maxed
                        ? "border-border/30 text-muted-foreground/40 cursor-not-allowed"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <span>{COMFORT_EMOJIS[vibe] || ""}</span>
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <FieldLabel>Accessibility <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground/80">Wheelchair friendly</p>
                <Switch
                  checked={data.wheelchairFriendly}
                  onCheckedChange={(v) => update("wheelchairFriendly", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground/80">Ground floor access</p>
                <Switch
                  checked={data.groundFloorAccess}
                  onCheckedChange={(v) => update("groundFloorAccess", v)}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>}

      {/* ─── SECTION 5: Important to Know (collapsible) ─── */}
      {show(3) && <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-card border border-border/40 shadow-sm text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            <span className="font-medium">Important to know</span>
            {infoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1 px-5 py-4 bg-card rounded-2xl border border-border/40 shadow-sm space-y-2">
            {[
              "It comes alive once 4 people join.",
              "If it doesn't reach 4, it quietly fades away.",
              "If you can't make it, the system may gently reassign the host role.",
            ].map((item, i) => (
              <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">·</span>
                {item}
              </p>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>}

      {/* ─── SECTION 6: Guidelines & Agreement ─── */}
      {show(4) && <SectionCard>
        <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">Guidelines</p>
        <div className="space-y-1.5 mb-4">
          {NOOK_RULES.map((rule, i) => (
            <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">·</span>
              {rule}
            </p>
          ))}
        </div>

        <button
          type="button"
          onClick={() => update("agreedToRules", !data.agreedToRules)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150",
            data.agreedToRules
              ? "bg-primary/10 border-primary/30 text-foreground"
              : "border-border/50 bg-secondary/30 text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
              data.agreedToRules ? "bg-primary border-primary" : "border-border"
            )}
          >
            {data.agreedToRules && (
              <svg
                className="w-3 h-3 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <span className="text-sm">I agree to Nook's guidelines</span>
        </button>
      </SectionCard>}
    </div>
  );
}
