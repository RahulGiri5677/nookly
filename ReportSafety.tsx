import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { NookLogo } from "@/components/nook/NookLogo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/nook/PageHeader";
import { format } from "date-fns";

const CATEGORIES = [
  "Someone was rude or disrespectful",
  "I felt uncomfortable",
  "Harassment or inappropriate behavior",
  "The meetup felt unsafe",
  "Scam or suspicious activity",
  "Other",
];

const ACTION_OPTIONS = [
  "Just informing Nook",
  "Please review this user",
  "Block this person for me",
  "I want support from the Nook team",
];

export default function ReportSafety() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [category, setCategory] = useState("");
  const [meetupId, setMeetupId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [actionRequested, setActionRequested] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch user's past nooks for the optional meetup selector
  const { data: pastNooks = [] } = useQuery({
    queryKey: ["report-nooks", user?.id],
    queryFn: async () => {
      const { data: memberRows } = await supabase
        .from("nook_members")
        .select("nook_id")
        .eq("user_id", user!.id)
        .eq("status", "approved");
      const joinedIds = (memberRows || []).map((m) => m.nook_id);

      const { data: hosted } = await supabase
        .from("nooks")
        .select("id, topic, date_time")
        .eq("host_id", user!.id)
        .order("date_time", { ascending: false })
        .limit(20);

      let joined: any[] = [];
      if (joinedIds.length > 0) {
        const { data } = await supabase
          .from("nooks")
          .select("id, topic, date_time")
          .in("id", joinedIds)
          .order("date_time", { ascending: false })
          .limit(20);
        joined = data || [];
      }

      const all = [...(hosted || []), ...joined];
      return Array.from(new Map(all.map((n) => [n.id, n])).values());
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Please select what happened");

      const { error } = await supabase.from("reports" as any).insert({
        reporter_user_id: user!.id,
        nook_id: meetupId,
        category,
        description: description.trim() || null,
        action_requested: actionRequested || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const header = <PageHeader title="Report a Safety Issue" subtitle="Your report is completely private 🔒" />;

  if (submitted) {
    return (
      <MobileLayout header={header} centered>
        <div className="text-center space-y-4 animate-fade-in">
          <span className="text-5xl">✨</span>
          <h1 className="text-xl font-semibold text-foreground">Thank you!</h1>
          <p className="text-sm text-muted-foreground">
            Your report is private, and our team will review it soon.
          </p>
          <Button variant="outline" onClick={() => navigate("/profile")}>
            Back to Profile
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout header={header}>
      <div className="animate-fade-in space-y-6">

        {/* Step 1: Category */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">What happened? *</h2>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`w-full text-left text-sm p-3 rounded-xl border transition-colors ${
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Meetup */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Which meetup? (optional)</h2>
          <div className="space-y-2">
            <button
              onClick={() => setMeetupId(null)}
              className={`w-full text-left text-sm p-3 rounded-xl border transition-colors ${
                meetupId === null
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              Not related to a meetup
            </button>
            {pastNooks.map((n: any) => (
              <button
                key={n.id}
                onClick={() => setMeetupId(n.id)}
                className={`w-full text-left text-sm p-3 rounded-xl border transition-colors ${
                  meetupId === n.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/30"
                }`}
              >
                {n.topic} — {format(new Date(n.date_time), "MMM d, yyyy")}
              </button>
            ))}
          </div>
        </section>

        {/* Step 3: Details */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Share more details (optional)</h2>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Tell us what happened (only what you feel comfortable sharing)."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
        </section>

        {/* Step 4: Action */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">What would you like us to do? (optional)</h2>
          <div className="space-y-2">
            {ACTION_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => setActionRequested(actionRequested === a ? "" : a)}
                className={`w-full text-left text-sm p-3 rounded-xl border transition-colors ${
                  actionRequested === a
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/30"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        <Button
          className="w-full"
          onClick={() => submitMutation.mutate()}
          disabled={!category || submitMutation.isPending}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Report"}
        </Button>

        <div className="pb-6" />
      </div>
    </MobileLayout>
  );
}
