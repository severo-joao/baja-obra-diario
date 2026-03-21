import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { Report } from "@/lib/types";
import { WEATHER_OPTIONS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, ImagePlus, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function ReportFormPage() {
  const { clients, tools, reports, addReport, updateReport } = useAppStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? reports.find((r) => r.id === id) : null;

  const [form, setForm] = useState({
    client_id: "",
    data_relatorio: new Date().toISOString().split("T")[0],
    equipe: "",
    condicoes_climaticas: "ensolarado" as Report["condicoes_climaticas"],
    ferramentas_ids: [] as string[],
    atividades_dia: "",
    observacoes: "",
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (existing) {
      setForm({
        client_id: existing.client_id,
        data_relatorio: existing.data_relatorio,
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
        ? f.ferramentas_ids.filter((id) => id !== toolId)
        : [...f.ferramentas_ids, toolId],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setImageUrls((prev) => [...prev, url]);
    });
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!form.client_id) { toast.error("Selecione uma obra."); return; }
    if (!form.atividades_dia) { toast.error("Descreva as atividades do dia."); return; }

    const now = new Date().toISOString();
    if (existing) {
      updateReport(existing.id, form);
      toast.success("Relatório atualizado!");
    } else {
      addReport({
        ...form,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      } as Report);
      toast.success("Relatório salvo!");
    }
    navigate("/relatorios");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{existing ? "Editar Relatório" : "Novo Relatório"}</h1>
          <p className="text-muted-foreground text-sm mt-1">Preencha os dados do relatório diário</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Obra *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                <SelectContent>
                  {clients.filter((c) => c.status === "ativa").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_empreitada} — {c.nome_cliente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data do Relatório</Label>
              <Input type="date" value={form.data_relatorio} onChange={(e) => setForm({ ...form, data_relatorio: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipe</Label>
            <Textarea value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} placeholder="Descreva a equipe presente nesta obra" rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Condições Climáticas</Label>
            <Select value={form.condicoes_climaticas} onValueChange={(v) => setForm({ ...form, condicoes_climaticas: v as Report["condicoes_climaticas"] })}>
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
              <p className="text-sm text-muted-foreground">Nenhuma ferramenta cadastrada. Cadastre ferramentas na seção "Ferramentas".</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                {tools.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted transition-colors">
                    <Checkbox
                      checked={form.ferramentas_ids.includes(t.id)}
                      onCheckedChange={() => toggleTool(t.id)}
                    />
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
              {imageUrls.map((url, i) => (
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
            <Button variant="outline" onClick={() => navigate("/relatorios")}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
              <Save className="h-4 w-4 mr-2" /> Salvar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
