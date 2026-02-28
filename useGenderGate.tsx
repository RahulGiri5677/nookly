import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns true when the logged-in user is missing a gender in their profile.
 * The gate should be shown until the user selects one.
 */
export function useGenderGate() {
  const { user, loading } = useAuth();
  const [needsGender, setNeedsGender] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      if (!loading) setChecked(true);
      return;
    }

    let cancelled = false;
    supabase
      .from("profiles" as any)
      .select("gender")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        const gender = (data as any)?.gender;
        setNeedsGender(!gender || gender.trim() === "");
        setChecked(true);
      });

    return () => { cancelled = true; };
  }, [user, loading]);

  const dismiss = () => setNeedsGender(false);

  return { needsGender: checked && needsGender, dismiss };
}
