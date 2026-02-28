import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { NavTabBar } from "@/components/nook/NavTabBar";
import { NookCard } from "@/components/nook/NookCard";
import { PageHeader } from "@/components/nook/PageHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, CalendarIcon, X } from "lucide-react";
import type { Nook } from "@/types/nook";
import { isNookVisibleInExplore } from "@/lib/nookVisibility";
import { NookLogo } from "@/components/nook/NookLogo";

type GenderFilter = "all" | "women_only";

export default function ExploreNooks() {
  const navigate = useNavigate();
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");

  const { data: nooks = [], isLoading } = useQuery({
    queryKey: ["nooks"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("nooks")
        .select("id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note, gender_restriction, inclusive_non_binary")
        .order("date_time", { ascending: true });
      if (error) throw error;
      return (data || []).map((n: any): Nook & { gender_restriction?: string; inclusive_non_binary?: boolean } => ({
        id: n.id,
        topic: n.topic as Nook["topic"],
        city: n.city,
        venue: n.venue,
        dateTime: new Date(n.date_time),
        durationMinutes: n.duration_minutes || 60,
        minPeople: n.min_people,
        maxPeople: n.max_people,
        currentPeople: n.current_people,
        status: n.status as Nook["status"],
        createdAt: new Date(n.created_at),
        hostId: n.host_id,
        gender_restriction: n.gender_restriction,
        inclusive_non_binary: n.inclusive_non_binary ?? false,
      }));
    },
  });

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  const visibleNooks = nooks.filter((n) => {
    if (!isNookVisibleInExplore(n)) return false;
    if (genderFilter === "women_only" && (n as any).gender_restriction !== "women_only") return false;
    return true;
  });

  const cities  = [...new Set(visibleNooks.map((n) => String(n.city)))].sort();
  const topics  = [...new Set(visibleNooks.map((n) => String(n.topic)))].sort();

  const filteredNooks = visibleNooks.filter((n) => {
    if (cityFilter  !== "all" && n.city  !== cityFilter)  return false;
    if (topicFilter !== "all" && n.topic !== topicFilter) return false;
    if (dateFilter) {
      const d = startOfDay(n.dateTime);
      const sel = startOfDay(dateFilter);
      if (d.getTime() !== sel.getTime()) return false;
    }
    return true;
  });

  const header = <PageHeader title="Explore Nooks 🌿" subtitle="Find a small circle near you." />;

  const isWomenMode = genderFilter === "women_only";

  return (
    <MobileLayout header={header} footer={<NavTabBar />}>
      <div className={cn(
        "animate-fade-in transition-colors duration-300",
        isWomenMode && "bg-[hsl(var(--women-card-bg)/0.35)] -mx-4 px-4 rounded-2xl"
      )}>

        {/* Gender toggle — pill style */}
        <div className="flex gap-2 mb-5">
          {([
            { value: "all" as GenderFilter, label: "All Nooks" },
            { value: "women_only" as GenderFilter, label: "🌸 Women Only" },
          ] as const).map((opt) => {
            const active = genderFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setGenderFilter(opt.value)}
                className={cn(
                  "nook-chip flex-1 justify-center",
                  active
                    ? opt.value === "women_only"
                      ? "bg-[hsl(var(--women-badge-bg))] text-[hsl(var(--women-badge-text))] border-[hsl(var(--women-badge-border))]"
                      : "nook-chip-active"
                    : "nook-chip-inactive"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Filters row */}
        <div className="space-y-3 mb-7">
          <div className="flex gap-2">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-10 rounded-xl flex-1 border-border/70 text-sm">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={String(city)} value={String(city)}>{String(city)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="h-10 rounded-xl flex-1 border-border/70 text-sm">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={String(topic)} value={String(topic)}>{String(topic)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 items-center">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 rounded-xl flex-1 justify-start text-left font-normal border-border/70 text-sm",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={(date) => { setDateFilter(date); setCalendarOpen(false); }}
                  disabled={(date) => {
                    const d = startOfDay(date);
                    return d < today || d > maxDate;
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {dateFilter && (
              <button
                onClick={() => setDateFilter(undefined)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-muted-foreground"
                aria-label="Clear date"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="nook-empty space-y-2">
            <div className="w-8 h-8 rounded-full bg-muted/60 mx-auto animate-pulse" />
            <p className="text-muted-foreground text-sm">Finding Nooks near you…</p>
          </div>
        ) : filteredNooks.length > 0 ? (
          <div className="space-y-4 pb-6">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pl-1">
              {filteredNooks.length} {filteredNooks.length === 1 ? "nook" : "nooks"} found
            </p>
            {filteredNooks.map((nook) => (
              <NookCard
                key={nook.id}
                nook={nook}
                onClick={() => navigate(`/nook/${nook.id}`)}
                className={nook.status === "cancelled" ? "opacity-40" : ""}
              />
            ))}
          </div>
        ) : (
          <div className="nook-empty space-y-4">
            <span className="text-4xl block">🌿</span>
            <p className="text-muted-foreground text-sm">No upcoming Nooks right now.</p>
            <Button
              variant="outline"
              onClick={() => navigate("/raise")}
              className="gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Raise one when you feel ready
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
