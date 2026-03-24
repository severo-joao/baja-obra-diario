import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { useTools } from "@/hooks/use-tools";
import { useGetOrCreateReport, useCreateEntry, useUploadEntryImages } from "@/hooks/use-reports";
import { WEATHER_OPTIONS } from "@/lib/types";
import type { ReportEntry } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, ImagePlus, X, MapPin, CheckCircle2, Plus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Step = "select" | "form" | "success";

export default function ExternalReportPage() {
  const [step, setStep] = useState<Step>("select");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: tools = [] } = useTools();
  const getOrCreateReport = useGetOrCreateReport();
  const createEntry = useCreateEntry();
  const uploadImages = useUploadEntryImages();

  const activeClients = clients.filter((c) => c.status === "ativa");
  const selectedClient = clients.find((c) => c.id === selectedClientId);

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
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({
      data_relato: new Date().toISOString().split("T")[0],
      equipe: "",
      condicoes_climaticas: "ensolarado",
      ferramentas_ids: [],
      atividades_dia: "",
      observacoes: "",
    });
    setFiles([]);
    setPreviews([]);
  };

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

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setStep("form");
  };

  const handleSave = async () => {
    if (!form.atividades_dia) {
      toast.error("Descreva as atividades do dia.");
      return;
    }
    if (!selectedClientId) return;

    setSaving(true);
    try {
      const reportId = await getOrCreateReport.mutateAsync(selectedClientId);
      const created = await createEntry.mutateAsync({ report_id: reportId, ...form });
      if (files.length > 0 && created) {
        await uploadImages.mutateAsync({ entryId: (created as any).id, reportId, files });
      }
      toast.success("Relato salvo com sucesso!");
      resetForm();
      setStep("success");
    } catch (err: any) {
      console.error("Erro ao salvar relato:", err);
      toast.error(err?.message || "Erro ao salvar relato.");
    } finally {
      setSaving(false);
    }
  };

  const handleNewReport = () => {
    setSelectedClientId(null);
    resetForm();
    setStep("select");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-baja-navy text-white py-4 px-6 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-baja-orange flex items-center justify-center">
            <span className="font-extrabold text-sm text-white">B</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">BAJA Diário de Obras</h1>
            <p className="text-white/70 text-xs">Registro de Relato Diário</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Select project */}
        {step === "select" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold">Selecione a Obra</h2>
              <p className="text-muted-foreground text-sm mt-1">Escolha a obra para registrar o relato diário</p>
            </div>

            {loadingClients ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activeClients.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma obra ativa encontrada.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {activeClients.map((client) => (
                  <Card
                    key={client.id}
                    className="cursor-pointer hover:border-baja-orange/50 hover:shadow-md transition-all"
                    onClick={() => handleSelectClient(client.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{client.nome_empreitada}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{client.nome_cliente}</p>
                      {client.endereco_obra && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {client.endereco_obra}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Form */}
        {step === "form" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setStep("select")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Novo Relato Diário</h2>
                <p className="text-sm text-muted-foreground">{selectedClient?.nome_empreitada}</p>
              </div>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label>Data do Relato</Label>
                  <Input type="date" value={form.data_relato} onChange={(e) => setForm({ ...form, data_relato: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Equipe</Label>
                  <Textarea value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} placeholder="Descreva a equipe presente" rows={3} />
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
                    {previews.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
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
                  <Button variant="outline" onClick={() => setStep("select")}>Voltar</Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-baja-orange hover:bg-baja-orange/90 text-white">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Relato
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Relato Salvo!</h2>
              <p className="text-muted-foreground mt-2">O relato diário foi registrado com sucesso.</p>
            </div>
            <Button onClick={handleNewReport} className="bg-baja-orange hover:bg-baja-orange/90 text-white gap-2">
              <Plus className="h-4 w-4" /> Criar Novo Relato
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
