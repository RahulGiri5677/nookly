import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EligibilityResult {
  eligible: boolean;
  can_host: boolean;
  level: number;
  message?: string;
  nudge?: string;
  restricted_until?: string;
  host_message?: string;
}

export function useJoinEligibility(userId: string | undefined) {
  return useQuery({
    queryKey: ["join-eligibility", userId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("check_join_eligibility", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as EligibilityResult;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHostEligibility(userId: string | undefined) {
  return useQuery({
    queryKey: ["host-eligibility", userId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("check_host_eligibility", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as EligibilityResult;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
