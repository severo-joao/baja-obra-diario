import { useState } from "react";
import { useWebhooks, useWebhookLogs, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useCreateWebhookLog } from "@/hooks/use-webhooks";
import type { Webhook } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Send, BookOpen, Webhook as WebhookIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const EVENT_TYPES = [
  { value: "relatorio.criado", label: "Relatório Criado" },
  { value: "relatorio.atualizado", label: "Relatório Atualizado" },
  { value: "cliente.cadastrado", label: "Cliente Cadastrado" },
] as const;

const samplePayloads: Record<string, string> = {
  "relatorio.criado": JSON.stringify({
    event: "relatorio.criado",
    timestamp: "2025-03-21T10:30:00Z",
    data: { id: "abc-123", client_id: "client-456", data_relatorio: "2025-03-21", atividades_dia: "Concretagem do segundo pavimento...", condicoes_climaticas: "ensolarado" },
  }, null, 2),
  "relatorio.atualizado": JSON.stringify({
    event: "relatorio.atualizado",
    timestamp: "2025-03-21T14:00:00Z",
    data: { id: "abc-123", changes: ["atividades_dia", "observacoes"] },
  }, null, 2),
  "cliente.cadastrado": JSON.stringify({
    event: "cliente.cadastrado",
    timestamp: "2025-03-21T09:00:00Z",
    data: { id: "client-789", nome_cliente: "João Silva", nome_empreitada: "Residencial Aurora" },
  }, null, 2),
};

export default function DocumentationPage() {
  const { data: webhooks = [], isLoading: lw } = useWebhooks();
  const { data: webhookLogs = [], isLoading: ll } = useWebhookLogs();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const createLog = useCreateWebhookLog();
  const [newEvent, setNewEvent] = useState<Webhook["event_type"]>("relatorio.criado");
  const [newUrl, setNewUrl] = useState("");

  const handleAddWebhook = async () => {
    if (!newUrl) { toast.error("Informe a URL do webhook."); return; }
    try {
      await createWebhook.mutateAsync({ event_type: newEvent, url: newUrl, active: true });
      setNewUrl("");
      toast.success("Webhook registrado!");
    } catch {
      toast.error("Erro ao registrar webhook.");
    }
  };

  const [testing, setTesting] = useState<string | null>(null);

  const handleTest = async (wh: Webhook) => {
    const payload = samplePayloads[wh.event_type];
    setTesting(wh.id);
    try {
      const { data, error } = await supabase.functions.invoke("fire-webhook", {
        body: { webhook_id: wh.id, payload },
      });
      if (error) throw error;
      const code = data?.status_code ?? 0;
      if (code >= 200 && code < 300) {
        toast.success(`Webhook respondeu com status ${code}`);
      } else if (code === 0) {
        toast.error("Falha na conexão com a URL do webhook");
      } else {
        toast.warning(`Webhook respondeu com status ${code}`);
      }
    } catch {
      toast.error("Erro ao disparar webhook.");
    } finally {
      setTesting(null);
      qc.invalidateQueries({ queryKey: ["webhook_logs"] });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Documentação & Webhooks</h1>
        <p className="text-muted-foreground text-sm mt-1">Integrações e documentação da API</p>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks"><WebhookIcon className="h-4 w-4 mr-1.5" /> Webhooks</TabsTrigger>
          <TabsTrigger value="docs"><BookOpen className="h-4 w-4 mr-1.5" /> Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6 mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Registrar Webhook</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={newEvent} onValueChange={(v) => setNewEvent(v as Webhook["event_type"])}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="https://sua-api.com/webhook" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="flex-1" />
                <Button onClick={handleAddWebhook} disabled={createWebhook.isPending} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {lw ? <Skeleton className="h-32 w-full" /> : webhooks.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Webhooks Registrados</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Badge variant="outline" className="w-fit text-xs">{EVENT_TYPES.find((e) => e.value === wh.event_type)?.label}</Badge>
                    <span className="text-sm font-mono flex-1 truncate">{wh.url}</span>
                    <div className="flex items-center gap-2">
                      <Switch checked={wh.active} onCheckedChange={(v) => updateWebhook.mutate({ id: wh.id, active: v })} />
                      <Button variant="outline" size="sm" onClick={() => handleTest(wh)}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Testar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={async () => { await deleteWebhook.mutateAsync(wh.id); toast.success("Webhook removido!"); }} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {ll ? <Skeleton className="h-32 w-full" /> : webhookLogs.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Log de Chamadas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {webhookLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/50">
                      <Badge variant={log.status_code === 200 ? "secondary" : "destructive"} className="text-xs">{log.status_code}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd/MM HH:mm")}</span>
                      <span className="text-xs">{log.event_type}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-6 prose prose-sm max-w-none">
              <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(216, 47%, 20%)" }}>Documentação da API</h2>
              <h3 className="text-base font-semibold mt-6 mb-2">Eventos Disponíveis</h3>
              <p className="text-sm text-muted-foreground mb-4">Os webhooks enviam requisições POST para a URL configurada quando eventos ocorrem no sistema.</p>
              {EVENT_TYPES.map((evt) => (
                <div key={evt.value} className="mb-6">
                  <h4 className="font-semibold text-sm mb-2">
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">{evt.value}</code> — {evt.label}
                  </h4>
                  <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                    <code>{samplePayloads[evt.value]}</code>
                  </pre>
                </div>
              ))}
              <h3 className="text-base font-semibold mt-6 mb-2">Headers</h3>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs">
                <code>{`Content-Type: application/json\nX-Webhook-Event: <event_type>\nX-Webhook-Timestamp: <ISO 8601>`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
