import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
  active: boolean;
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["api_keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ApiKey[];
    },
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("api_keys" as any)
        .insert({ name, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ApiKey;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}

export function useToggleApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("api_keys" as any)
        .update({ active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("api_keys" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}
