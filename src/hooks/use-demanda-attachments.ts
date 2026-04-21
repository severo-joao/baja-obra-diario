import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DemandaAttachment } from "@/lib/types";

export function useDemandaAttachments(demandaId: string | null) {
  return useQuery({
    queryKey: ["demanda_attachments", demandaId],
    enabled: !!demandaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demanda_attachments")
        .select("*")
        .eq("demanda_id", demandaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DemandaAttachment[];
    },
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ demandaId, file }: { demandaId: string; file: File }) => {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${demandaId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("demanda-attachments")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("demanda-attachments").getPublicUrl(path);
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("demanda_attachments").insert({
        demanda_id: demandaId,
        url: pub.publicUrl,
        filename: file.name,
        uploaded_by: user?.id ?? null,
      });
      if (insErr) throw insErr;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["demanda_attachments", vars.demandaId] }),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, demandaId }: { id: string; demandaId: string }) => {
      const { error } = await supabase.from("demanda_attachments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["demanda_attachments", vars.demandaId] }),
  });
}
