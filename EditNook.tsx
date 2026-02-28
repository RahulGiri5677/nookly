import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { PageHeader } from "@/components/nook/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, MessageSquare, Accessibility, Info } from "lucide-react";

function EditCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/30 bg-secondary/20">
        <span className="text-primary">{icon}</span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
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
    "w-full bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary text-foreground text-sm placeholder:text-muted-foreground/60 py-2 transition-colors resize-none";
  if (multiline) {
    return (
      <textarea
        className={baseClass}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
    );
  }
  return (
    <input
      className={baseClass}
      value={value}
      onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
    />
  );
}

export default function EditNook() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: nook, isLoading } = useQuery({
    queryKey: ["nook", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nooks")
        .select("id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note, google_maps_link, category")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const hoursUntilStart = nook
    ? (new Date(nook.date_time).getTime() - Date.now()) / (1000 * 60 * 60)
    : Infinity;
  const isEditLocked = hoursUntilStart <= 24;

  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [venueNote, setVenueNote] = useState("");
  const [icebreaker, setIcebreaker] = useState("");
  const [wheelchairFriendly, setWheelchairFriendly] = useState(false);

  useEffect(() => {
    if (nook) {
      setGoogleMapsLink((nook as any).google_maps_link || "");
      setVenueNote(nook.venue_note || "");
      setIcebreaker(nook.icebreaker || "");
      setWheelchairFriendly(nook.wheelchair_friendly);
    }
  }, [nook]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data: freshNook } = await supabase
        .from("nooks")
        .select("date_time")
        .eq("id", id!)
        .maybeSingle();

      if (freshNook) {
        const hoursLeft = (new Date(freshNook.date_time).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursLeft <= 3) {
          throw new Error("Editing is locked within 3 hours of meetup start.");
        }
      }

      const trimmedMapsLink = googleMapsLink.trim();
      const validMapsLink =
        trimmedMapsLink &&
        (trimmedMapsLink.includes("maps.app.goo.gl") || trimmedMapsLink.includes("google.com/maps"))
          ? trimmedMapsLink
          : null;

      if (venueNote.trim() && venueNote.trim().length < 15) {
        throw new Error("Exact meeting spot must be at least 15 characters.");
      }

      const { error: updateError } = await supabase
        .from("nooks")
        .update({
          google_maps_link: validMapsLink,
          venue_note: venueNote.trim() || null,
          icebreaker: icebreaker.trim() || null,
          wheelchair_friendly: wheelchairFriendly,
        } as any)
        .eq("id", id!);

      if (updateError) throw updateError;

      const { data: members } = await supabase
        .from("nook_members")
        .select("user_id")
        .eq("nook_id", id!)
        .eq("status", "approved");

      if (members && members.length > 0) {
        const notifications = members
          .filter((m) => m.user_id !== user!.id)
          .map((m) => ({
            user_id: m.user_id,
            title: "Meeting details updated",
            message: `Meeting details were updated by the host for "${nook?.topic}".`,
            type: "update",
            nook_id: id!,
            nook_title: nook?.topic || null,
          }));

        if (notifications.length > 0) {
          await supabase.from("notifications").insert(notifications);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nook", id] });
      toast({ title: "Nook updated!" });
      navigate(`/nook/${id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <MobileLayout centered>
        <p className="text-muted-foreground">Loading…</p>
      </MobileLayout>
    );
  }

  if (!nook || nook.host_id !== user?.id) {
    return (
      <MobileLayout centered>
        <p className="text-muted-foreground">Not authorized.</p>
      </MobileLayout>
    );
  }

  if (isEditLocked) {
    return (
      <MobileLayout centered>
        <div className="text-center space-y-3 px-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Info className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">Meetup can no longer be edited</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Editing is locked within 24 hours of start time for participant stability 🌿
          </p>
          <Button variant="outline" onClick={() => navigate(`/nook/${id}`)} className="rounded-xl h-11">
            Back to Meetup
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const editHeader = (
    <PageHeader
      title="Refine your Nook"
      subtitle="Polish the details of what you've created."
    />
  );

  return (
    <MobileLayout header={editHeader}>
      <div className="animate-fade-in space-y-5">

        {/* Read-only core details */}
        <div className="bg-secondary/30 border border-border/30 rounded-2xl px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Core Details · Cannot be changed
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Topic</p>
              <p className="text-sm text-foreground font-medium">{nook.topic}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">City</p>
              <p className="text-sm text-foreground font-medium">{nook.city}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Venue</p>
              <p className="text-sm text-foreground">{nook.venue}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Date &amp; Time</p>
              <p className="text-sm text-foreground">{new Date(nook.date_time).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Editable: Maps link */}
        <EditCard icon={<MapPin className="w-4 h-4" />} title="Google Maps Link">
          <p className="text-xs text-muted-foreground">Optional — makes it easier to find the venue.</p>
          <UnderlineInput
            value={googleMapsLink}
            onChange={setGoogleMapsLink}
            placeholder="https://maps.app.goo.gl/..."
          />
          {googleMapsLink.trim() &&
            !googleMapsLink.includes("maps.app.goo.gl") &&
            !googleMapsLink.includes("google.com/maps") && (
              <p className="text-xs text-destructive">Only Google Maps links are accepted.</p>
            )}
        </EditCard>

        {/* Editable: Exact Spot */}
        <EditCard icon={<MapPin className="w-4 h-4" />} title="Exact Meeting Spot">
          <p className="text-xs text-muted-foreground">Help people find you once they arrive. Min. 15 characters.</p>
          <UnderlineInput
            value={venueNote}
            onChange={setVenueNote}
            placeholder="e.g., Near the fountain at the north entrance"
            multiline
            rows={2}
            maxLength={150}
          />
          {venueNote.trim().length > 0 && venueNote.trim().length < 15 && (
            <p className="text-xs text-destructive">Add a bit more detail.</p>
          )}
        </EditCard>

        {/* Editable: Icebreaker */}
        <EditCard icon={<MessageSquare className="w-4 h-4" />} title="Icebreaker Activity">
          <p className="text-xs text-muted-foreground">A gentle prompt to help everyone settle in.</p>
          <UnderlineInput
            value={icebreaker}
            onChange={setIcebreaker}
            placeholder='e.g., "Share your favourite book"'
            multiline
            rows={2}
            maxLength={120}
          />
        </EditCard>

        {/* Editable: Accessibility */}
        <EditCard icon={<Accessibility className="w-4 h-4" />} title="Accessibility">
          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="wheelchair-edit"
              checked={wheelchairFriendly}
              onCheckedChange={(c) => setWheelchairFriendly(c === true)}
            />
            <Label htmlFor="wheelchair-edit" className="text-sm font-normal cursor-pointer">
              Wheelchair friendly / open seating
            </Label>
          </div>
        </EditCard>

        {/* Notification note */}
        <p className="text-xs text-muted-foreground bg-secondary/40 rounded-xl px-4 py-3 text-center">
          Joined participants will be notified when you save changes.
        </p>

        {/* Save button */}
        <Button
          onClick={() => updateMutation.mutate()}
          className="w-full h-12 rounded-xl font-medium"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </MobileLayout>
  );
}
