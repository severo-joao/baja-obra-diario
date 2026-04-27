import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileLite {
  id: string;
  email: string;
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .order("email", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
  });
}
