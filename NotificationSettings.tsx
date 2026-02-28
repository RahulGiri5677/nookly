import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { NookLogo } from "@/components/nook/NookLogo";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Moon } from "lucide-react";
import { PageHeader } from "@/components/nook/PageHeader";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Meetup notifications
  const [meetupConfirmed, setMeetupConfirmed] = useState(true);
  const [meetupReminder, setMeetupReminder] = useState(true);
  const [meetupChanges, setMeetupChanges] = useState(true);
  // Chat
  const [chatMessages, setChatMessages] = useState(true);
  // Feedback
  const [feedbackReminder, setFeedbackReminder] = useState(true);
  const [attendanceUpdates, setAttendanceUpdates] = useState(true);
  // Discovery
  const [newNearby, setNewNearby] = useState(false);
  const [weeklySuggestions, setWeeklySuggestions] = useState(false);
  // Delivery
  const [deliveryMethod, setDeliveryMethod] = useState("in_app");
  // Quiet hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("01:00");
  const [quietEnd, setQuietEnd] = useState("10:00");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.notification_prefs) {
      const p = profile.notification_prefs;
      setMeetupConfirmed(p.meetup_confirmed ?? true);
      setMeetupReminder(p.meetup_reminder ?? true);
      setMeetupChanges(p.meetup_changes ?? true);
      setChatMessages(p.chat_messages ?? true);
      setFeedbackReminder(p.feedback_reminder ?? true);
      setAttendanceUpdates(p.attendance_updates ?? true);
      setNewNearby(p.new_nearby ?? false);
      setWeeklySuggestions(p.weekly_suggestions ?? false);
      setDeliveryMethod(p.delivery_method || "in_app");
      setQuietHoursEnabled(p.quiet_hours_enabled ?? false);
      setQuietStart(p.quiet_start || "01:00");
      setQuietEnd(p.quiet_end || "10:00");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const prefs = {
        meetup_confirmed: meetupConfirmed,
        meetup_reminder: meetupReminder,
        meetup_cancelled: true, // always on
        meetup_changes: meetupChanges,
        chat_messages: chatMessages,
        feedback_reminder: feedbackReminder,
        attendance_updates: attendanceUpdates,
        new_nearby: newNearby,
        weekly_suggestions: weeklySuggestions,
        delivery_method: deliveryMethod,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_start: quietStart,
        quiet_end: quietEnd,
      };
      const { error } = await supabase
        .from("profiles" as any)
        .update({ notification_prefs: prefs } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Notification settings saved 🔔" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const header = <PageHeader title="Notification Settings" />;

  if (isLoading) {
    return (
      <MobileLayout header={header} centered>
        <p className="text-muted-foreground">Loading...</p>
      </MobileLayout>
    );
  }

  const deliveryOptions = [
    { value: "in_app", label: "In-app only" },
    { value: "email_and_app", label: "Email + In-app" },
  ];

  return (
    <MobileLayout header={header}>
      <div className="animate-fade-in space-y-6">

        {/* Meetup Notifications */}
        <section className="nook-section space-y-4">
          <h2 className="nook-section-title">Meetup Notifications</h2>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Meetup confirmed</span>
            <Switch checked={meetupConfirmed} onCheckedChange={setMeetupConfirmed} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Starting soon reminder</span>
            <Switch checked={meetupReminder} onCheckedChange={setMeetupReminder} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">Meetup cancelled</span>
              <p className="text-xs text-muted-foreground/70">Always enabled for safety</p>
            </div>
            <Switch checked={true} disabled />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time/location changes</span>
            <Switch checked={meetupChanges} onCheckedChange={setMeetupChanges} />
          </div>
        </section>

        {/* Chat */}
        <section className="nook-section space-y-4">
          <h2 className="nook-section-title">Chat Notifications</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">New messages</span>
            <Switch checked={chatMessages} onCheckedChange={setChatMessages} />
          </div>
        </section>

        {/* Feedback */}
        <section className="nook-section space-y-4">
          <h2 className="nook-section-title">Feedback & Attendance</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Attendance updates</span>
            <Switch checked={attendanceUpdates} onCheckedChange={setAttendanceUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Feedback reminders</span>
            <Switch checked={feedbackReminder} onCheckedChange={setFeedbackReminder} />
          </div>
        </section>

        {/* Discovery */}
        <section className="nook-section space-y-4">
          <h2 className="nook-section-title">Discovery <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">New meetups near you</span>
            <Switch checked={newNearby} onCheckedChange={setNewNearby} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Weekly suggestions</span>
            <Switch checked={weeklySuggestions} onCheckedChange={setWeeklySuggestions} />
          </div>
        </section>

        {/* Delivery */}
        <section className="nook-section space-y-3">
          <h2 className="nook-section-title">Delivery Method</h2>
          <div className="space-y-2">
            {deliveryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDeliveryMethod(opt.value)}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all duration-200 ${
                  deliveryMethod === opt.value
                    ? "bg-primary/10 border-primary/30 text-foreground font-medium"
                    : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/20 hover:bg-secondary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="nook-section space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-muted-foreground" />
            <h2 className="nook-section-title" style={{ marginBottom: 0 }}>Quiet Hours 🌙</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            No notifications during this time (except cancellations)
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Enable quiet hours</span>
            <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
          </div>
          {quietHoursEnabled && (
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        {/* Save */}
        <Button
          className="w-full h-12 rounded-xl"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Notification Settings
        </Button>

        <div className="pb-6" />
      </div>
    </MobileLayout>
  );
}
