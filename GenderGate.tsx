import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { NookLogo } from "./NookLogo";

const GENDER_OPTIONS = [
  { value: "Woman", label: "Woman", emoji: "🌸" },
  { value: "Man", label: "Man", emoji: "🌿" },
  { value: "Non-binary", label: "Non-binary", emoji: "🌙" },
  { value: "Prefer not to say", label: "Prefer not to say", emoji: "✨" },
];

interface GenderGateProps {
  onComplete: () => void;
}

export function GenderGate({ onComplete }: GenderGateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles" as any)
      .update({ gender: selected } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl border border-border/50 p-7 animate-fade-in">
        <div className="text-center mb-7">
          <NookLogo size="sm" className="mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">One small thing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We ask this only to respect gathering preferences and keep spaces balanced.
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            This is never shown publicly.
          </p>
        </div>

        <p className="text-sm font-medium text-foreground mb-4">How do you identify?</p>

        <div className="space-y-2.5 mb-7">
          {GENDER_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left transition-all duration-200",
                  isSelected
                    ? "border-primary/50 bg-primary/8 shadow-sm"
                    : "border-border/40 bg-secondary/20 hover:bg-secondary/50"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                  isSelected ? "border-primary" : "border-border"
                )}>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                </span>
                <span className="text-lg shrink-0">{opt.emoji}</span>
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={!selected || saving}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-md"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
