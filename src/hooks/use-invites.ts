import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Invite {
  id: string;
  email: string;
  invited_by: string;
  status: string;
  created_at: string;
}

export function useInvites() {
  return useQuery({
    queryKey: ["invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invite[];
    },
  });
}
