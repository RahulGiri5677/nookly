import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { Mail, Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import { BackHeader } from "@/components/nook/BackHeader";
import { PageHeader } from "@/components/nook/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { AppFooter } from "@/components/nook/AppFooter";

const RESEND_MAGIC_KEY = "nook_resend_magic_ts";
const MAGIC_COOLDOWN = 60;
const DOMAIN = "https://nookly.me/";

function useCountdown(storageKey: string, cooldownSeconds: number) {
  const getRemaining = useCallback(() => {
    const ts = localStorage.getItem(storageKey);
    if (!ts) return 0;
    const elapsed = Math.floor((Date.now() - parseInt(ts)) / 1000);
    return Math.max(0, cooldownSeconds - elapsed);
  }, [storageKey, cooldownSeconds]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining, getRemaining]);

  const trigger = () => {
    localStorage.setItem(storageKey, Date.now().toString());
    setRemaining(cooldownSeconds);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return { remaining, trigger, formatted: formatTime(remaining) };
}

// Shared Google & Apple SVG icons
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.37.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4zm-3.1-17.52c.06 2.3-2.08 4.22-4.35 4.02-.3-2.16 1.89-4.33 4.35-4.02z" />
  </svg>
);

function AuthButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 flex items-center gap-3 px-4 rounded-2xl border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, sendMagicLink } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<"main" | "email">("main");
  const [emailTab, setEmailTab] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const magicCountdown = useCountdown(RESEND_MAGIC_KEY, MAGIC_COOLDOWN);

  useEffect(() => {
    if (!loading && user) navigate("/home", { replace: true });
  }, [loading, user, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: DOMAIN });
    setIsLoading(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: DOMAIN });
    setIsLoading(false);
    if (error) toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (magicCountdown.remaining > 0 || !email.trim()) return;
    setIsLoading(true);
    const { error } = await sendMagicLink(email);
    setIsLoading(false);
    if (error) {
      toast({
        title: "Hmm, that didn't work",
        description: "Something felt off. Try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    magicCountdown.trigger();
    setMagicLinkSent(true);
    toast({ title: "Check your inbox", description: "We sent a Magic Link. It expires in 10 minutes." });
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast({
        title: "Hmm, that didn't work",
        description: "Check your email and password and try again.",
        variant: "destructive",
      });
      return;
    }
    navigate("/home");
  };

  if (loading) return null;

  const emailViewHeader =
    view === "email" ? (
      <PageHeader
        title="Continue with Email"
        onBack={() => {
          setView("main");
          setMagicLinkSent(false);
        }}
      />
    ) : undefined;

  return (
    <MobileLayout centered header={emailViewHeader} footer={<AppFooter />}>
      <div className="w-full max-w-sm px-5 animate-fade-in">
        {view === "main" ? (
          /* ── MAIN VIEW ── */
          <div className="space-y-0">
            {/* Branding */}
            <div className="text-center mb-10">
              <img
                src="/nook-avatar.jpg"
                alt="Nook"
                className="w-16 h-16 rounded-full object-cover mx-auto mb-4 shadow-md"
              />
              <h1 className="text-2xl font-semibold text-foreground mb-1.5">Welcome to Nook</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Small, safe meetups for real conversations.
              </p>
            </div>

            {/* Social buttons */}
            <div className="space-y-3 mb-6">
              <AuthButton
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                icon={<GoogleIcon />}
                label="Continue with Google"
              />
              <AuthButton
                onClick={handleAppleSignIn}
                disabled={isLoading}
                icon={<AppleIcon />}
                label="Continue with Apple"
              />
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground tracking-wider uppercase">or</span>
              </div>
            </div>

            {/* Email option */}
            <AuthButton
              onClick={() => setView("email")}
              icon={<Mail className="w-5 h-5 text-muted-foreground shrink-0" />}
              label="Continue with Email"
            />

            {/* Create account */}
            <div className="text-center mt-8 pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                New here?{" "}
                <button
                  onClick={() => navigate("/auth/create")}
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* ── EMAIL VIEW ── */
          <div className="animate-fade-in">
            {/* Subheading */}
            <div className="mb-7">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {emailTab === "magic"
                  ? "Enter your email to receive your Magic Link. ✨"
                  : "Enter your email and password to sign in."}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-muted p-1 mb-6">
              <button
                onClick={() => {
                  setEmailTab("magic");
                  setMagicLinkSent(false);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  emailTab === "magic"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Magic Link
              </button>
              <button
                onClick={() => setEmailTab("password")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  emailTab === "password"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Password
              </button>
            </div>

            {/* Form card */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              {emailTab === "magic" ? (
                magicLinkSent ? (
                  <div className="text-center space-y-5 py-2">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Check your inbox</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        We sent a Magic Link to <strong className="text-foreground">{email}</strong>. It expires in 10
                        minutes.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleMagicLink}
                      disabled={magicCountdown.remaining > 0 || isLoading}
                      className="w-full h-11 rounded-xl text-sm"
                    >
                      {magicCountdown.remaining > 0 ? `Resend in ${magicCountdown.formatted}` : "Resend Magic Link"}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email" className="text-xs font-medium">
                        Email address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl text-sm font-medium"
                      disabled={isLoading || !email.trim()}
                    >
                      {isLoading ? "Sending…" : "Send Magic Link"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      We'll send a private Magic Link to your inbox.
                    </p>
                  </form>
                )
              ) : (
                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pw-email" className="text-xs font-medium">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="pw-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pw-password" className="text-xs font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="pw-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-medium"
                    disabled={isLoading || !email.trim() || !password.trim()}
                  >
                    {isLoading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              )}
            </div>

            {/* Create account */}
            <div className="text-center mt-6 pt-5 border-t border-border">
              <p className="text-sm text-muted-foreground">
                New here?{" "}
                <button
                  onClick={() => navigate("/auth/create")}
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed opacity-60">
          By continuing, you agree to keep Nook kind, respectful, and safe.
        </p>
      </div>
    </MobileLayout>
  );
}
