import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const CALLBACK_WAIT_MS = 2500;

const hasAuthTokensInHash = (hash: string) =>
  hash.includes("access_token=") || hash.includes("refresh_token=");

export default function AuthCallback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finishAuth = async () => {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        window.history.replaceState({}, document.title, "/auth/callback");
      }

      if (hasAuthTokensInHash(hash) || new URLSearchParams(window.location.search).has("code")) {
        const startedAt = Date.now();
        while (!cancelled && Date.now() - startedAt < CALLBACK_WAIT_MS) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            navigate("/home", { replace: true });
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      if (!cancelled) {
        navigate(user ? "/home" : "/auth", { replace: true });
      }
    };

    void finishAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, user]);

  return <div style={{ textAlign: "center", paddingTop: "40vh" }}>Signing you in…</div>;
}

