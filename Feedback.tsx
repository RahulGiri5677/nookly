import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NookLogo } from "@/components/nook/NookLogo";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { Star, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/nook/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const RATING_LABELS = ["", "😕 Not great", "🙂 Okay", "😊 Good", "🌟 Really nice", "💛 Amazing"];
const COMFORT_OPTIONS = [
  { value: "comfortable", label: "Yes, completely 🌙" },
  { value: "mostly", label: "Mostly yes 🙂" },
  { value: "not", label: "Not really 😕" },
];
const TAGS = [
  "Friendly",
  "Respectful",
  "Well-organized",
  "Easy conversation",
  "Felt awkward",
  "Host didn't show up",
  "Someone was rude",
  "Something felt unsafe",
];

export default function Feedback() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comfort, setComfort] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: nook } = useQuery({
    queryKey: ["nook", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nooks")
        .select("id, topic, host_id, date_time, duration_minutes, min_people, max_people, current_people, wheelchair_friendly, created_at, updated_at, cancelled_at, cancelled_by, city, venue, status, icebreaker, venue_note")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check if already submitted
  const { data: existingFeedback } = useQuery({
    queryKey: ["feedback-check", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("feedback" as any)
        .select("id")
        .eq("nook_id", id!)
        .eq("from_user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const trimmedComment = comment.trim() || null;

      // ── AI moderation check (server-side, optional) ───────────────────────
      // Runs if there is a comment. Fails silently — never blocks on AI error.
      if (trimmedComment) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const token = session?.session?.access_token;
          if (token) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
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
                  body: JSON.stringify({ type: "moderation_check", comment: trimmedComment }),
                  signal: controller.signal,
                }
              );
              if (res.ok) {
                const mod = await res.json();
                if (mod?.severity === "high") {
                  throw new Error("Let's keep it kind 🌿 — try rephrasing that in a respectful way.");
                }
                // "mild": stored normally, already flagged server-side in moderation_logs
              }
            } finally {
              clearTimeout(timeout);
            }
          }
        } catch (e) {
          // Re-throw only user-facing errors; swallow AI infrastructure failures
          if (e instanceof Error && e.message.startsWith("Let's keep")) throw e;
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      const { error } = await supabase.from("feedback" as any).insert({
        nook_id: id!,
        nook_title: nook?.topic || "",
        from_user_id: user!.id,
        to_user_id: nook?.host_id,
        role: "user-to-host",
        rating,
        comfort_level: comfort,
        tags: selectedTags,
        comment: trimmedComment,
        is_report: false,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const header = <PageHeader title="Meetup Feedback" subtitle="Your feedback helps keep Nook kind and safe." />;

  if (submitted) {
    return (
      <MobileLayout header={header} centered>
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-5xl">✨</div>
          <h1 className="text-2xl font-semibold text-foreground">Thank you</h1>
          <p className="text-muted-foreground text-sm">
            Your feedback helps keep Nook kind and safe.
          </p>
          <Button onClick={() => navigate("/home")} className="rounded-xl h-12 w-full mt-4">
            Back to Home
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (existingFeedback) {
    return (
      <MobileLayout header={header} centered>
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-5xl">✨</div>
          <h1 className="text-2xl font-semibold text-foreground">Already submitted</h1>
          <p className="text-muted-foreground text-sm">
            You've already left feedback for this meetup.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl h-12 w-full mt-4">
            Go Back
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout header={header}>
      <div className="animate-fade-in space-y-6">

        {/* Rating */}
        <div className="space-y-3">
          <h2 className="font-medium text-foreground">Overall, how was the experience?</h2>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    n <= rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {RATING_LABELS[rating]}
            </p>
          )}
        </div>

        {/* Comfort */}
        <div className="space-y-3">
          <h2 className="font-medium text-foreground">Did you feel comfortable during this meetup?</h2>
          <div className="space-y-2">
            {COMFORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setComfort(opt.value)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  comfort === opt.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <h2 className="font-medium text-foreground">What best describes the meetup?</h2>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedTags.includes(tag)
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-3">
          <h2 className="font-medium text-foreground">Want to share anything else? (Optional)</h2>
          <Textarea
            placeholder="Something you liked… or something we can improve."
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            className="rounded-xl resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">{comment.length}/200</p>
        </div>

        {/* Report */}
        <button
          onClick={() => {
            setSelectedTags((prev) =>
              prev.includes("Something felt unsafe")
                ? prev
                : [...prev, "Something felt unsafe"]
            );
            toast({
              title: "⚠️ Report flagged",
              description: "Your feedback will be treated as a private report.",
            });
          }}
          className="flex items-center gap-2 text-sm text-destructive hover:underline"
        >
          <AlertTriangle className="w-4 h-4" />
          Something went wrong? Report this meetup privately
        </button>

        <Button
          onClick={() => submitMutation.mutate()}
          className="w-full h-12 rounded-xl"
          disabled={rating === 0 || !comfort || submitMutation.isPending}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </MobileLayout>
  );
}
