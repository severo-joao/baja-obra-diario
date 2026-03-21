import { useState, useEffect } from "react";
import { useTools } from "@/hooks/use-tools";
import { useCreateEntry, useUpdateEntry, useUploadEntryImages } from "@/hooks/use-reports";
import type { ReportEntry } from "@/lib/types";
import { WEATHER_OPTIONS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, ImagePlus, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ReportFormPage() {
  const { data: tools = [] } = useTools();
  const navigate = useNavigate();
  const { id, entryId } = useParams(); // id = reportId for new entry, entryId = existing entry id
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const uploadImages = useUploadEntryImages();
  const qc = useQueryClient();

  const isEdit = !!entryId;

  // Fetch existing entry if editing
  const { data: existing, isLoading } = useQuery({
    queryKey: ["report_entries", entryId],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_entries")
        .select("*, report_images(*)")
        .eq("id", entryId!)
        .single();
      if (error) throw error;
      return { ...data, images: (data as any).report_images } as ReportEntry;
    },
  });

  const reportId = isEdit ? existing?.report_id : id;

  const [form, setForm] = useState({
    data_relato: new Date().toISOString().split("T")[0],
    equipe: "",
    condicoes_climaticas: "ensolarado" as ReportEntry["condicoes_climaticas"],
    ferramentas_ids: [] as string[],
    atividades_dia: "",
    observacoes: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (existing) {
      setForm({
        data_relato: existing.data_relato,
        equipe: existing.equipe,
        condicoes_climaticas: existing.condicoes_climaticas,
        ferramentas_ids: existing.ferramentas_ids || [],
        atividades_dia: existing.atividades_dia,
        observacoes: existing.observacoes,
      });
    }
  }, [existing]);

  const toggleTool = (toolId: string) => {
    setForm((f) => ({
      ...f,
      ferramentas_ids: f.ferramentas_ids.includes(toolId)
        ? f.ferramentas_ids.filter((i) => i !== toolId)
        : [...f.ferramentas_ids, toolId],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (!newFiles) return;
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, url]);
    });
  };

  const removeImage = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.atividades_dia) { toast.error("Descreva as atividades do dia."); return; }
    if (!reportId) { toast.error("Relatório não encontrado."); return; }

    try {
      if (isEdit && existing) {
        await updateEntry.mutateAsync({ id: existing.id, report_id: existing.report_id, ...form });
        if (files.length > 0) {
          await uploadImages.mutateAsync({ entryId: existing.id, reportId: existing.report_id, files });
        }
        toast.success("Relato atualizado!");
      } else {
        const created = await createEntry.mutateAsync({ report_id: reportId, ...form });
        if (files.length > 0 && created) {
          await uploadImages.mutateAsync({ entryId: (created as any).id, reportId, files });
        }
        toast.success("Relato salvo!");
      }
      navigate("/relatorios");
    } catch {
      toast.error("Erro ao salvar relato.");
    }
  };

  if (isEdit && isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Editar Relato" : "Novo Relato Diário"}</h1>
          <p className="text-muted-foreground text-sm mt-1">Preencha os dados do relato diário</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Data do Relato</Label>
            <Input type="date" value={form.data_relato} onChange={(e) => setForm({ ...form, data_relato: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Equipe</Label>
            <Textarea value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} placeholder="Descreva a equipe presente nesta obra" rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Condições Climáticas</Label>
            <Select value={form.condicoes_climaticas} onValueChange={(v) => setForm({ ...form, condicoes_climaticas: v as ReportEntry["condicoes_climaticas"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEATHER_OPTIONS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ferramentas Utilizadas</Label>
            {tools.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma ferramenta cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                {tools.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted transition-colors">
                    <Checkbox checked={form.ferramentas_ids.includes(t.id)} onCheckedChange={() => toggleTool(t.id)} />
                    <span className="text-sm">{t.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Atividades do Dia *</Label>
            <Textarea value={form.atividades_dia} onChange={(e) => setForm({ ...form, atividades_dia: e.target.value })} placeholder="Descreva as atividades realizadas hoje" rows={5} />
          </div>

          <div className="space-y-2">
            <Label>Observações Importantes</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações adicionais" rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Registros Fotográficos</Label>
            <div className="flex flex-wrap gap-3">
              {existing?.images?.map((img) => (
                <div key={img.id} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                </div>
              ))}
              {previews.map((url, i) => (
                <div key={`new-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-baja-orange/50 transition-colors">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">Adicionar</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/relatorios")}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createEntry.isPending || updateEntry.isPending || uploadImages.isPending} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
              <Save className="h-4 w-4 mr-2" /> Salvar Relato
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
