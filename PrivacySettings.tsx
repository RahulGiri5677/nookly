import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { NookLogo } from "@/components/nook/NookLogo";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/nook/PageHeader";

export default function PrivacySettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showFullName, setShowFullName] = useState(true);
  const [showGender, setShowGender] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [photoVisibility, setPhotoVisibility] = useState("public");
  const [locationVisibility, setLocationVisibility] = useState("city");

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
    if (profile) {
      setShowFullName(profile.show_full_name ?? true);
      setShowGender(profile.show_gender ?? true);
      setShowAge(profile.show_age ?? true);
      setPhotoVisibility(profile.photo_visibility || "public");
      setLocationVisibility(profile.location_visibility || "city");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles" as any)
        .update({
          show_full_name: showFullName,
          show_gender: showGender,
          show_age: showAge,
          photo_visibility: photoVisibility,
          location_visibility: locationVisibility,
        } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Privacy settings saved 🛡" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const header = <PageHeader title="Privacy Settings" />;

  if (isLoading) {
    return (
      <MobileLayout header={header} centered>
        <p className="text-muted-foreground">Loading...</p>
      </MobileLayout>
    );
  }

  const photoOptions = [
    { value: "public", label: "Everyone" },
    { value: "confirmed_only", label: "Confirmed meetup participants only" },
    { value: "hidden", label: "Hide completely (show avatar)" },
  ];

  const locationOptions = [
    { value: "city", label: "Show city only" },
    { value: "hidden", label: "Hide location completely" },
  ];

  return (
    <MobileLayout header={header}>
      <div className="animate-fade-in space-y-6">

        {/* Identity Visibility */}
        <section className="nook-section space-y-4">
          <h2 className="nook-section-title">Identity Visibility</h2>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show my full name</span>
            <Switch checked={showFullName} onCheckedChange={setShowFullName} />
          </div>
          {!showFullName && (
            <p className="text-xs text-muted-foreground pl-1">
              Others will see your display name or initials only
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show gender on profile</span>
            <Switch checked={showGender} onCheckedChange={setShowGender} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show age publicly</span>
            <Switch checked={showAge} onCheckedChange={setShowAge} />
          </div>
        </section>

        {/* Photo Privacy */}
        <section className="nook-section space-y-3">
          <h2 className="nook-section-title">Profile Photo Privacy</h2>
          <p className="text-xs text-muted-foreground">Who can see your profile photo?</p>
          <div className="space-y-2">
            {photoOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPhotoVisibility(opt.value)}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all duration-200 ${
                  photoVisibility === opt.value
                    ? "bg-primary/10 border-primary/30 text-foreground font-medium"
                    : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/20 hover:bg-secondary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Location Privacy */}
        <section className="nook-section space-y-3">
          <h2 className="nook-section-title">Location Privacy</h2>
          <div className="space-y-2">
            {locationOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocationVisibility(opt.value)}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all duration-200 ${
                  locationVisibility === opt.value
                    ? "bg-primary/10 border-primary/30 text-foreground font-medium"
                    : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/20 hover:bg-secondary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Legal & Policies */}
        <section className="nook-section space-y-1">
          <h2 className="nook-section-title flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Legal & Policies
          </h2>
          <button
            onClick={() => navigate("/privacy")}
            className="w-full flex items-center justify-between p-3 rounded-xl text-sm text-muted-foreground hover:bg-secondary/40 transition-colors"
          >
            Privacy Policy
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => navigate("/terms")}
            className="w-full flex items-center justify-between p-3 rounded-xl text-sm text-muted-foreground hover:bg-secondary/40 transition-colors"
          >
            Terms of Service
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </section>

        {/* Save */}
        <Button
          className="w-full h-12 rounded-xl"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Privacy Settings
        </Button>

        <div className="pb-6" />
      </div>
    </MobileLayout>
  );
}
