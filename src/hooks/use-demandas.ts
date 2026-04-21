import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Demanda } from "@/lib/types";
import { addDays, format } from "date-fns";

export function useDemandas() {
  return useQuery({
    queryKey: ["demandas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandas")
        .select("*")
        .order("data_notificacao", { ascending: true });
      if (error) throw error;
      return data as unknown as Demanda[];
    },
  });
}

export function useCreateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (demanda: Omit<Demanda, "id" | "created_at" | "updated_at" | "status" | "webhook_url">) => {
      const { data, error } = await supabase
        .from("demandas")
        .insert(demanda as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useUpdateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Demanda> & { id: string }) => {
      const { error } = await supabase
        .from("demandas")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useDeleteDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("demandas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useRenovarDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (demanda: Demanda) => {
      const novaData = demanda.sazonal && demanda.intervalo_dias
        ? format(addDays(new Date(), demanda.intervalo_dias), "yyyy-MM-dd")
        : format(addDays(new Date(), 30), "yyyy-MM-dd");
      const { error } = await supabase
        .from("demandas")
        .update({ data_notificacao: novaData, status: "pendente", updated_at: new Date().toISOString() } as any)
        .eq("id", demanda.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useLembrarAmanhaDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const amanha = format(addDays(new Date(), 1), "yyyy-MM-dd");
      const { error } = await supabase
        .from("demandas")
        .update({ data_notificacao: amanha, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useMoveDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, coluna_id, ordem }: { id: string; coluna_id: string; ordem: number }) => {
      const { error } = await supabase
        .from("demandas")
        .update({ coluna_id, ordem, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useReorderDemandas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; coluna_id: string; ordem: number }[]) => {
      await Promise.all(
        items.map((it) =>
          supabase
            .from("demandas")
            .update({ coluna_id: it.coluna_id, ordem: it.ordem } as any)
            .eq("id", it.id)
        )
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useAprovarDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("demandas")
        .update({ status: "aprovada", updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}
