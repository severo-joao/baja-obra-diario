import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { KanbanColumn } from "@/lib/types";

export function useKanbanColumns() {
  return useQuery({
    queryKey: ["kanban_columns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_columns")
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as KanbanColumn[];
    },
  });
}

export function useCreateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { titulo: string; cor?: string; ordem: number }) => {
      const { data, error } = await supabase
        .from("kanban_columns")
        .insert({ titulo: input.titulo, cor: input.cor ?? "#94a3b8", ordem: input.ordem })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban_columns"] }),
  });
}

export function useUpdateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KanbanColumn> & { id: string }) => {
      const { error } = await supabase.from("kanban_columns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban_columns"] }),
  });
}

export function useDeleteColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kanban_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban_columns"] });
      qc.invalidateQueries({ queryKey: ["demandas"] });
    },
  });
}

export function useReorderColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cols: { id: string; ordem: number }[]) => {
      await Promise.all(
        cols.map((c) => supabase.from("kanban_columns").update({ ordem: c.ordem }).eq("id", c.id))
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban_columns"] }),
  });
}
