import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/nook/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useHostEligibility } from "@/hooks/useJoinEligibility";
import { RaiseNookForm, type NookFormData } from "@/components/nook/RaiseNookForm";
import { NookPreview } from "@/components/nook/NookPreview";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { hapticMedium, hapticSuccess, hapticError } from "@/lib/haptics";

const INITIAL_FORM: NookFormData = {
  topic: "",
  category: "",
  comfortVibes: [],
  city: "",
  venue: "",
  exactSpot: "",
  googleMapsLink: "",
  date: "",
  time: "",
  durationMinutes: "60",
  maxPeople: "6",
  icebreaker: "",
  wheelchairFriendly: false,
  groundFloorAccess: false,
  agreedToRules: false,
  genderRestriction: "open",
  inclusiveNonBinary: false,
};

const STEPS = [
  { label: "About", emoji: "🪷" },
  { label: "Location", emoji: "📍" },
  { label: "When", emoji: "🕒" },
  { label: "Vibe", emoji: "✨" },
  { label: "Rules", emoji: "📋" },
  { label: "Review", emoji: "🌙" },
];

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "w-5 h-1.5 bg-primary"
              : i < current
              ? "w-1.5 h-1.5 bg-primary/40"
              : "w-1.5 h-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

export default function RaiseNook() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: hostEligibility } = useHostEligibility(user?.id);
  const [form, setForm] = useState<NookFormData>(INITIAL_FORM);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = STEPS.length;
  const isReview = step === totalSteps - 1;

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!form.category) return "Please choose a meetup type.";
      if (!form.topic) return "Please select a topic.";
    }
    if (s === 1) {
      if (!form.city.trim()) return "Please enter a city.";
      if (!form.venue.trim()) return "Please enter the full address.";
      if (!form.exactSpot.trim()) return "Please describe the exact meeting spot.";
      if (form.exactSpot.trim().length < 15) return "Exact meeting spot must be at least 15 characters.";
    }
    if (s === 2) {
      if (!form.date || !form.time) return "Please choose a date and time.";
      const dateTime = new Date(`${form.date}T${form.time}`);
      const diffMs = dateTime.getTime() - Date.now();
      if (diffMs < 5 * 60 * 60 * 1000) return "Nooks must be scheduled at least 5 hours in advance.";
      if (diffMs > 7 * 24 * 60 * 60 * 1000) return "Nooks cannot be scheduled more than 7 days ahead.";
    }
    if (s === 3) {
      if (!form.icebreaker.trim()) return "Please describe an icebreaker activity.";
    }
    if (s === 4) {
      if (!form.agreedToRules) return "Please agree to Nook's guidelines.";
    }
    return null;
  };

  const validateAll = (): string | null => {
    for (let i = 0; i < totalSteps - 1; i++) {
      const err = validateStep(i);
      if (err) return err;
    }
    const duration = parseInt(form.durationMinutes);
    if (isNaN(duration) || duration < 30 || duration > 300) return "Please select a valid duration.";
    return null;
  };

  const goNext = () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (isReview) return;
    const err = validateStep(step);
    if (err) {
      hapticError();
      toast({ title: "One moment", description: err, variant: "destructive" });
      return;
    }
    hapticMedium();
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) {
      navigate(-1);
      return;
    }
    hapticMedium();
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (hostEligibility && !hostEligibility.can_host) {
      toast({
        title: "Hosting restricted",
        description: hostEligibility.host_message || hostEligibility.message || "You're temporarily restricted from hosting.",
      });
      return;
    }
    const err = validateAll();
    if (err) {
      toast({ title: "One moment", description: err, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const dateTime = new Date(`${form.date}T${form.time}`);
    const trimmedMapsLink = form.googleMapsLink.trim();
    const validMapsLink =
      trimmedMapsLink &&
      (trimmedMapsLink.includes("maps.app.goo.gl") || trimmedMapsLink.includes("google.com/maps"))
        ? trimmedMapsLink
        : null;
    const nookCode = `NK-${Math.floor(100 + Math.random() * 900)}`;

    const { error } = await supabase.from("nooks").insert({
      host_id: user.id,
      topic: form.topic,
      city: form.city.trim(),
      venue: form.venue.trim(),
      date_time: dateTime.toISOString(),
      duration_minutes: parseInt(form.durationMinutes),
      max_people: parseInt(form.maxPeople),
      icebreaker: form.icebreaker.trim(),
      venue_note: form.exactSpot.trim(),
      wheelchair_friendly: form.wheelchairFriendly,
      category: form.category as any,
      comfort_detail: (form.comfortVibes.length > 0 ? form.comfortVibes.join(", ") : null) as any,
      google_maps_link: validMapsLink,
      nook_code: nookCode,
      gender_restriction: form.genderRestriction,
      inclusive_non_binary: form.genderRestriction === "women_only" ? form.inclusiveNonBinary : false,
    } as any);

    setIsSubmitting(false);

    if (error) {
      hapticError();
      toast({ title: "Hmm, something went quiet", description: error.message, variant: "destructive" });
      return;
    }

    hapticSuccess();
    toast({ title: "Your Nook is live 🌙", description: "It's out there now. Let's see who joins your little circle ✨" });
    navigate("/explore");
  };

  const header = (
    <PageHeader
      onBack={goBack}
      right={
        <div className="flex flex-col items-end gap-1 pr-1">
          <span className="text-xs text-muted-foreground">Step {step + 1} of {totalSteps}</span>
          <StepDots current={step} total={totalSteps} />
        </div>
      }
    />
  );

  const footer = (
    <div className="flex items-center gap-3 py-1">
      {step > 0 && (
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 px-4 h-12 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors border border-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
      {isReview ? (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-md"
        >
          {isSubmitting ? "Raising your Nook…" : "Raise My Nook 🌙"}
        </button>
      ) : (
        <button
          onClick={goNext}
          className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <MobileLayout header={header} footer={footer}>
      <div className="animate-fade-in">
        {/* Step title */}
        <div className="text-center mb-6 pt-1">
          <p className="text-3xl mb-2">{STEPS[step].emoji}</p>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {isReview ? "Almost there" : STEPS[step].label}
          </h1>
          {isReview && (
            <p className="text-sm text-muted-foreground mt-1">
              Take a moment to review before raising it.
            </p>
          )}
        </div>

        {isReview ? (
          <NookPreview data={form} />
        ) : (
          <RaiseNookForm data={form} onChange={setForm} visibleStep={step} />
        )}
      </div>
    </MobileLayout>
  );
}
