import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DemandaComment } from "@/lib/types";

export function useDemandaComments(demandaId: string | null) {
  return useQuery({
    queryKey: ["demanda_comments", demandaId],
    enabled: !!demandaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demanda_comments")
        .select("*")
        .eq("demanda_id", demandaId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DemandaComment[];
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ demandaId, texto }: { demandaId: string; texto: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("demanda_comments").insert({
        demanda_id: demandaId,
        texto,
        autor_id: user?.id ?? null,
        autor_email: user?.email ?? "",
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["demanda_comments", vars.demandaId] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, demandaId }: { id: string; demandaId: string }) => {
      const { error } = await supabase.from("demanda_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["demanda_comments", vars.demandaId] }),
  });
}
