import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Report, ReportImage } from "@/lib/types";

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, clients(*), report_images(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((r) => ({
        ...r,
        client: r.clients,
        images: r.report_images,
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
        .select("*, clients(*), report_images(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return { ...data, client: (data as any).clients, images: (data as any).report_images } as Report;
    },
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Omit<Report, "id" | "created_at" | "updated_at" | "client" | "images">) => {
      const { data, error } = await supabase.from("reports").insert(report).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Report>) => {
      const { client, images, ...rest } = data as any;
      const { error } = await supabase.from("reports").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
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

export function useUploadReportImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, files }: { reportId: string; files: File[] }) => {
      const uploaded: ReportImage[] = [];
      for (const file of files) {
        const path = `${reportId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("report-images").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("report-images").getPublicUrl(path);
        const { data, error } = await supabase
          .from("report_images")
          .insert({ report_id: reportId, url: urlData.publicUrl, filename: file.name })
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
