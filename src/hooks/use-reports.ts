import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Report, ReportEntry, ReportImage } from "@/lib/types";
import { fireWebhooksForEvent } from "@/lib/webhook-utils";

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, clients(*), report_entries(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((r) => ({
        ...r,
        client: r.clients,
        entries: r.report_entries,
      })) as Report[];
    },
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ["reports", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, clients(*), report_entries(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      const report = {
        ...data,
        client: (data as any).clients,
        entries: (data as any).report_entries,
      } as Report;

      // Fetch images for each entry
      if (report.entries && report.entries.length > 0) {
        const entryIds = report.entries.map((e) => e.id);
        const { data: images } = await supabase
          .from("report_images")
          .select("*")
          .in("entry_id", entryIds);
        if (images) {
          const imagesByEntry = (images as ReportImage[]).reduce((acc, img) => {
            const eid = img.entry_id || "";
            if (!acc[eid]) acc[eid] = [];
            acc[eid].push(img);
            return acc;
          }, {} as Record<string, ReportImage[]>);
          report.entries = report.entries.map((e) => ({
            ...e,
            images: imagesByEntry[e.id] || [],
          }));
        }
        // Sort entries by date
        report.entries.sort((a, b) => new Date(a.data_relato + "T00:00:00").getTime() - new Date(b.data_relato + "T00:00:00").getTime());
      }

      return report;
    },
  });
}

/** Find or create a report for a given client */
export function useGetOrCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      // Check if report exists for this client
      const { data: existing } = await supabase
        .from("reports")
        .select("id")
        .eq("client_id", clientId)
        .maybeSingle();
      if (existing) return existing.id as string;

      // Create new report
      const { data, error } = await supabase
        .from("reports")
        .insert({ client_id: clientId })
        .select("id")
        .single();
      if (error) throw error;

      // Fetch client name for webhook payload
      const { data: clientData } = await supabase.from("clients").select("nome_cliente, nome_empreitada").eq("id", clientId).single();

      await fireWebhooksForEvent("relatorio.criado", {
        report_id: data.id,
        client_id: clientId,
        nome_cliente: clientData?.nome_cliente ?? "",
        nome_empreitada: clientData?.nome_empreitada ?? "",
        created_at: new Date().toISOString(),
      });

      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      report_id: string;
      data_relato: string;
      equipe: string;
      condicoes_climaticas: string;
      ferramentas_ids: string[];
      atividades_dia: string;
      observacoes: string;
    }) => {
      const { data, error } = await supabase.from("report_entries").insert(entry).select().single();
      if (error) throw error;
      // Update report's updated_at
      await supabase.from("reports").update({ updated_at: new Date().toISOString() }).eq("id", entry.report_id);

      // Fire webhooks
      await fireWebhooksForEvent("relatorio.atualizado", {
        report_id: entry.report_id,
        entry_id: data.id,
        action: "entry_created",
        data_relato: entry.data_relato,
        atividades_dia: entry.atividades_dia,
      });

      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, report_id, ...rest }: { id: string; report_id: string } & Partial<ReportEntry>) => {
      const { images, ...data } = rest as any;
      const { error } = await supabase.from("report_entries").update(data).eq("id", id);
      if (error) throw error;
      await supabase.from("reports").update({ updated_at: new Date().toISOString() }).eq("id", report_id);

      // Fire webhooks
      await fireWebhooksForEvent("relatorio.atualizado", {
        report_id,
        entry_id: id,
        action: "entry_updated",
        ...data,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("report_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useUploadEntryImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, reportId, files }: { entryId: string; reportId: string; files: File[] }) => {
      const uploaded: ReportImage[] = [];
      for (const file of files) {
        const sanitizedName = file.name
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]/gi, "_")
          .toLowerCase();
        const path = `${reportId}/${entryId}/${crypto.randomUUID()}-${sanitizedName}`;
        console.log(`Uploading image: ${file.name} (${file.size} bytes)`);
        const { error: uploadError } = await supabase.storage.from("report-images").upload(path, file);
        if (uploadError) {
          console.error(`Erro no upload de ${file.name}:`, uploadError);
          throw new Error(`Falha no upload da imagem "${file.name}": ${uploadError.message}`);
        }
        const { data: urlData } = supabase.storage.from("report-images").getPublicUrl(path);
        const { data, error } = await supabase
          .from("report_images")
          .insert({ report_id: reportId, entry_id: entryId, url: urlData.publicUrl, filename: file.name })
          .select()
          .single();
        if (error) throw error;
        uploaded.push(data as ReportImage);
      }
      return uploaded;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
