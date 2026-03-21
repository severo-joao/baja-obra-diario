import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Webhook, WebhookLog } from "@/lib/types";

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("webhooks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Webhook[];
    },
  });
}

export function useWebhookLogs() {
  return useQuery({
    queryKey: ["webhook_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data as WebhookLog[];
    },
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wh: Omit<Webhook, "id" | "created_at">) => {
      const { data, error } = await supabase.from("webhooks").insert(wh).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Webhook>) => {
      const { error } = await supabase.from("webhooks").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useCreateWebhookLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<WebhookLog, "id">) => {
      const { data, error } = await supabase.from("webhook_logs").insert(log).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook_logs"] }),
  });
}
