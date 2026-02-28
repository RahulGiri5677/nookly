import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { PageHeader } from "@/components/nook/PageHeader";
import { hapticLight, hapticMedium } from "@/lib/haptics";

const INTEREST_OPTIONS = [
  "Music", "Movies", "Poetry", "Walking", "Cafés", "Tech", "Art", "Books",
];

const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Prefer not to say"];
const MEETUP_PREF_OPTIONS = ["Small group", "Public places only", "Online first"];

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", country: "India" },
  { code: "+1", flag: "🇺🇸", country: "US" },
  { code: "+44", flag: "🇬🇧", country: "UK" },
  { code: "+971", flag: "🇦🇪", country: "UAE" },
  { code: "+65", flag: "🇸🇬", country: "SG" },
  { code: "+61", flag: "🇦🇺", country: "AU" },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeSent, setEmailChangeSent] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [meetupPreference, setMeetupPreference] = useState("");
  const [showFullName, setShowFullName] = useState(true);
  const [showGender, setShowGender] = useState(true);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

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
      setFullName(profile.full_name || "");
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setDob(profile.dob || "");
      setGender(profile.gender || "");
      setCity(profile.city || "");
      setInterests(profile.interests || []);
      setMeetupPreference(profile.meetup_preference || "");
      setShowFullName(profile.show_full_name ?? true);
      setShowGender(profile.show_gender ?? true);
      setPhotoUrl(profile.profile_photo_url || "");

      // Parse phone with country code
      const rawPhone = profile.phone || "";
      const matched = COUNTRY_CODES.find((c) => rawPhone.startsWith(c.code));
      if (matched) {
        setCountryCode(matched.code);
        setPhone(rawPhone.slice(matched.code.length).trim());
      } else {
        setPhone(rawPhone);
      }
    }
  }, [profile]);

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }

    // Show immediate local preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);
    hapticLight();

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);

      // Replace blob URL with real public URL and invalidate all profile caches
      URL.revokeObjectURL(previewUrl);
      const freshUrl = urlData.publicUrl + "?t=" + Date.now();
      setPhotoUrl(freshUrl);
      // Persist to DB immediately so side menu + profile page pick it up
      await supabase
        .from("profiles" as any)
        .update({ profile_photo_url: freshUrl } as any)
        .eq("user_id", user!.id);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["side-drawer-profile"] });
    } catch (err: any) {
      URL.revokeObjectURL(previewUrl);
      setPhotoUrl(""); // revert preview on error
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!gender) {
        throw new Error("Please select your gender — it helps keep meetups balanced and safe.");
      }

      if (dob) {
        const age = Math.floor(
          (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        if (age < 18) {
          throw new Error("You must be 18 or older to use Nook");
        }
      }

      if (bio.length > 150) {
        throw new Error("Bio must be 150 characters or less");
      }

      const fullPhone = phone.replace(/\D/g, "");
      const storedPhone = fullPhone ? `${countryCode}${fullPhone}` : null;

      const { error } = await supabase
        .from("profiles" as any)
        .update({
          full_name: fullName.trim() || null,
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          dob: dob || null,
          gender: gender || null,
          city: city.trim() || null,
          phone: storedPhone,
          interests,
          meetup_preference: meetupPreference || null,
          profile_photo_url: photoUrl || null,
          show_full_name: showFullName,
          show_gender: showGender,
        } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["side-drawer-profile"] });
      toast({ title: "Profile updated ✨" });
      navigate("/profile");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const handleEmailChange = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    if (trimmed === user?.email) {
      setEmailError("This is already your current email.");
      return;
    }
    setEmailChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setNewEmail(trimmed);
      setEmailChangeSent(true);
      toast({ title: "Verification sent", description: "Check your new email inbox and click the link to confirm the change." });
    } catch (err: any) {
      setEmailError(err.message || "Could not send verification.");
    } finally {
      setEmailChanging(false);
    }
  };

  const header = <PageHeader title="Edit Profile" subtitle="Update your details and preferences." />;

  if (isLoading) {
    return (
      <MobileLayout header={header} centered>
        <p className="text-muted-foreground">Loading...</p>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout header={header}>
      <div className="animate-fade-in space-y-6">

        {/* Photo */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => { hapticMedium(); setShowPhotoMenu(true); }}
            className="relative group active:scale-[0.97] transition-transform"
            disabled={uploading}
            aria-label="Change profile photo"
          >
            {photoUrl ? (
              <img
                src={photoUrl.startsWith("blob:") ? photoUrl : `${photoUrl.split("?")[0]}?t=${profile?.updated_at ? new Date(profile.updated_at).getTime() : Date.now()}`}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-border shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border shadow-md">
                <span className="text-4xl">👤</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
              {uploading ? (
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              ) : (
                <span className="text-sm">📸</span>
              )}
            </div>
          </button>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoUpload} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        {/* Photo action sheet modal */}
        {showPhotoMenu && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowPhotoMenu(false)}
          >
            <div
              className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 pb-2 border-b border-border/50">
                <p className="text-sm font-semibold text-foreground text-center">Profile Photo</p>
                <p className="text-xs text-muted-foreground text-center mt-0.5">Max 5MB · Images only</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { hapticLight(); setShowPhotoMenu(false); setTimeout(() => cameraInputRef.current?.click(), 100); }}
                  className="w-full text-left text-sm p-3.5 rounded-xl hover:bg-secondary active:scale-[0.98] transition-all flex items-center gap-3 font-medium"
                >
                  <span className="text-xl">📷</span>
                  <span>Take Photo</span>
                </button>
                <button
                  onClick={() => { hapticLight(); setShowPhotoMenu(false); setTimeout(() => fileInputRef.current?.click(), 100); }}
                  className="w-full text-left text-sm p-3.5 rounded-xl hover:bg-secondary active:scale-[0.98] transition-all flex items-center gap-3 font-medium"
                >
                  <span className="text-xl">🖼</span>
                  <span>Choose From Gallery</span>
                </button>
                {photoUrl && (
                  <button
                    onClick={() => { hapticLight(); setShowPhotoMenu(false); handleRemovePhoto(); }}
                    className="w-full text-left text-sm p-3.5 rounded-xl hover:bg-destructive/10 active:scale-[0.98] transition-all flex items-center gap-3 text-destructive font-medium"
                  >
                    <span className="text-xl">🗑</span>
                    <span>Remove Photo</span>
                  </button>
                )}
                <div className="pt-1 pb-1">
                  <div className="h-px bg-border/50 mx-2" />
                </div>
                <button
                  onClick={() => { hapticLight(); setShowPhotoMenu(false); }}
                  className="w-full text-sm p-3.5 rounded-xl hover:bg-secondary active:scale-[0.98] transition-all text-center font-medium text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Personal Details */}
        <section className="nook-section space-y-4">
          <h2 className="nook-section-title">Personal Details</h2>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              maxLength={100}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Rahul G."
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Email</label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
            <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                Change email
              </p>
              {emailChangeSent ? (
                <p className="text-xs text-muted-foreground">
                  ✅ Verification link sent to <strong>{newEmail}</strong>. Click the link in your inbox to confirm the change.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="New email address"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      className={`h-9 text-sm ${emailError ? "border-destructive" : ""}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEmailChange}
                      disabled={emailChanging || !newEmail.trim()}
                      className="shrink-0 h-9"
                    >
                      {emailChanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send link"}
                    </Button>
                  </div>
                  {emailError && (
                    <p className="text-xs text-muted-foreground">{emailError}</p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">A verification link will be sent to your new email. Your data is preserved.</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date of Birth</label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]}
            />
            {dob && (
              <p className="text-xs text-muted-foreground">
                Age: {Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Gender <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">(used for join eligibility, never shown publicly)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? "" : g)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    gender === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {!gender && (
              <p className="text-xs text-muted-foreground mt-1">Please select one — this helps us keep meetups balanced and safe.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">City</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
              maxLength={100}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Bio ({bio.length}/150) — What brings you to Nook?
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Soft conversations and calm vibes 🌿"
              rows={3}
              maxLength={150}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Phone (optional, never shown publicly)
            </label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(digits);
                }}
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
              />
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="nook-section space-y-3">
          <h2 className="nook-section-title">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleInterest(tag)}
                className={`nook-chip ${
                  interests.includes(tag) ? "nook-chip-active" : "nook-chip-inactive"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Meetup Preference */}
        <section className="nook-section space-y-3">
          <h2 className="nook-section-title">Preferred Meetup Style <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <div className="flex flex-wrap gap-2">
            {MEETUP_PREF_OPTIONS.map((pref) => (
              <button
                key={pref}
                onClick={() =>
                  setMeetupPreference(meetupPreference === pref ? "" : pref)
                }
                className={`nook-chip ${
                  meetupPreference === pref ? "nook-chip-active" : "nook-chip-inactive"
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="nook-section space-y-4">
          <h2 className="nook-section-title">Privacy Settings</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show full name to others</span>
            <Switch checked={showFullName} onCheckedChange={setShowFullName} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show gender on profile</span>
            <Switch checked={showGender} onCheckedChange={setShowGender} />
          </div>
        </section>

        {/* Save */}
        <Button
          className="w-full"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Profile
        </Button>

        <div className="pb-6" />
      </div>
    </MobileLayout>
  );
}
