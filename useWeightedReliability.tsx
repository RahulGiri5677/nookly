import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BadgeTierResult {
  tier: "new" | "growing" | "consistent" | "reliable";
  total_positive: number;
}

/**
 * Fetches the user's badge tier using the server-computed weighted reliability
 * formula: recent_ratio (180d) × 0.7 + lifetime_ratio × 0.3.
 *
 * Results are cached for 5 minutes to avoid heavy recalculation on every render.
 * The raw weighted ratio is intentionally not exposed — only the tier label.
 */
export function useWeightedReliability(userId: string | undefined) {
  return useQuery<BadgeTierResult>({
    queryKey: ["badge-tier", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_badge_tier" as any, {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as BadgeTierResult;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5-minute cache
  });
}
