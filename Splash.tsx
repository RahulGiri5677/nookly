import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const { hash, search, origin } = window.location;
    const hasTokenHash = hash.includes("access_token=") || hash.includes("refresh_token=");
    const hasCodeQuery = new URLSearchParams(search).has("code");

    if (hasTokenHash || hasCodeQuery) {
      window.location.replace(`${origin}/auth/callback${search}${hash}`);
      return;
    }

    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #F6F4EE 0%, #FAFAF8 55%, #FFFFFF 100%)",
      }}
    >
      {/* ── Floating blur shapes ──────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Top-left warm blob */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, #E8D5C4 0%, transparent 70%)",
            filter: "blur(48px)",
          }}
        />
        {/* Top-right cool blob */}
        <div
          className="absolute -top-12 right-0 w-56 h-56 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #C8D8C8 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* Center warm glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #F0E8DC 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        {/* Bottom-right sage blob */}
        <div
          className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, #B8C8B4 0%, transparent 70%)",
            filter: "blur(44px)",
          }}
        />
      </div>

      {/* ── Top spacer ───────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Hero content ─────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center px-8 w-full max-w-sm mx-auto">

        {/* Welcome label — fades in first */}
        <p
          className="text-xs tracking-widest uppercase mb-4 opacity-0"
          style={{
            color: "#A89070",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.18em",
            animation: "splashFadeUp 0.5s ease-out 0.05s forwards",
          }}
        >
          Welcome to
        </p>

        {/* Brand name — fades in second */}
        <h1
          className="mb-5 opacity-0"
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "clamp(3rem, 14vw, 4.5rem)",
            fontWeight: 600,
            lineHeight: 1.05,
            color: "#2C2420",
            letterSpacing: "-0.01em",
            animation: "splashFadeUp 0.55s ease-out 0.15s forwards",
          }}
        >
          Nook
        </h1>

        {/* Divider */}
        <div
          className="w-8 h-px mb-6 opacity-0"
          style={{
            background: "#C8B49A",
            animation: "splashFadeUp 0.45s ease-out 0.28s forwards",
          }}
        />

        {/* Primary tagline — fades in third */}
        <p
          className="text-center mb-3 opacity-0"
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "clamp(1.1rem, 4.5vw, 1.25rem)",
            fontWeight: 400,
            lineHeight: 1.55,
            color: "#4A3C34",
            animation: "splashFadeUp 0.55s ease-out 0.35s forwards",
          }}
        >
          Where strangers begin to feel familiar.
        </p>

        {/* Secondary line — fades in fourth */}
        <p
          className="text-center mb-12 opacity-0"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(0.825rem, 3.5vw, 0.9rem)",
            fontWeight: 400,
            lineHeight: 1.6,
            color: "#8C7B6E",
            animation: "splashFadeUp 0.55s ease-out 0.45s forwards",
          }}
        >
          A small, safe space for real conversations.
        </p>

        {/* CTA button — fades in last */}
        <button
          onClick={() => navigate("/auth")}
          className="w-full opacity-0"
          style={{
            background: "#2E7D6B",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "28px",
            height: "54px",
            fontSize: "1rem",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(46, 125, 107, 0.28), 0 1px 4px rgba(46, 125, 107, 0.16)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            animation: "splashFadeUp 0.55s ease-out 0.6s forwards",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 2px 12px rgba(46, 125, 107, 0.22)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 24px rgba(46, 125, 107, 0.28), 0 1px 4px rgba(46, 125, 107, 0.16)";
          }}
          onTouchStart={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
          }}
          onTouchEnd={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          Step Inside
        </button>
      </main>

      {/* ── Bottom spacer + footer ────────────────────────── */}
      <div className="flex-1 flex items-end pb-8 w-full justify-center">
        <p
          className="text-center opacity-0"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.7rem",
            color: "#B8A898",
            letterSpacing: "0.06em",
            animation: "splashFadeUp 0.5s ease-out 0.75s forwards",
          }}
        >
          Built for calm, meaningful circles.
        </p>
      </div>

      {/* ── Keyframe injection ────────────────────────────── */}
      <style>{`
        @keyframes splashFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
