import { useState } from "react";
import { useWebhooks, useWebhookLogs, useCreateWebhook, useUpdateWebhook, useDeleteWebhook } from "@/hooks/use-webhooks";
import { useApiKeys, useCreateApiKey, useToggleApiKey, useDeleteApiKey } from "@/hooks/use-api-keys";
import type { ApiKey } from "@/hooks/use-api-keys";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Webhook } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Send, BookOpen, Webhook as WebhookIcon, Key, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const EVENT_TYPES = [
  { value: "relatorio.criado", label: "Relatório Criado" },
  { value: "relatorio.atualizado", label: "Relatório Atualizado" },
  { value: "cliente.cadastrado", label: "Cliente Cadastrado" },
  { value: "demanda.vencida", label: "Demanda Vencida" },
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
  "demanda.vencida": JSON.stringify({
    event: "demanda.vencida",
    timestamp: "2025-03-21T08:00:00Z",
    data: {
      id: "demanda-001",
      titulo: "Renovar licença ambiental",
      descricao: "Licença vence em 30 dias",
      prioridade: "alta",
      data_notificacao: "2025-03-21",
      sazonal: true,
      intervalo_dias: 365,
    },
    acoes: {
      renovar: "https://.../functions/v1/demanda-action?id=demanda-001&action=renovar",
      lembrar_amanha: "https://.../functions/v1/demanda-action?id=demanda-001&action=lembrar_amanha",
      aprovar: "https://.../functions/v1/demanda-action?id=demanda-001&action=aprovar",
    },
  }, null, 2),
};

function maskKey(key: string) {
  if (key.length <= 12) return key;
  return key.slice(0, 8) + "••••••••" + key.slice(-4);
}

export default function DocumentationPage() {
  const { data: webhooks = [], isLoading: lw } = useWebhooks();
  const { data: webhookLogs = [], isLoading: ll } = useWebhookLogs();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const { data: apiKeys = [], isLoading: lk } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const toggleApiKey = useToggleApiKey();
  const deleteApiKey = useDeleteApiKey();
  const qc = useQueryClient();
  const [newEvent, setNewEvent] = useState<Webhook["event_type"]>("relatorio.criado");
  const [newUrl, setNewUrl] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);

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

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) { toast.error("Informe um nome para a chave."); return; }
    try {
      const created = await createApiKey.mutateAsync(newKeyName.trim());
      setNewKeyName("");
      setJustCreatedKey(created.key);
      toast.success("API Key gerada com sucesso!");
    } catch {
      toast.error("Erro ao gerar API Key.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Documentação & Webhooks</h1>
        <p className="text-muted-foreground text-sm mt-1">Integrações, API Keys e documentação da API</p>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks"><WebhookIcon className="h-4 w-4 mr-1.5" /> Webhooks</TabsTrigger>
          <TabsTrigger value="apikeys"><Key className="h-4 w-4 mr-1.5" /> API Keys</TabsTrigger>
          <TabsTrigger value="docs"><BookOpen className="h-4 w-4 mr-1.5" /> Documentação</TabsTrigger>
        </TabsList>

        {/* ===== WEBHOOKS TAB ===== */}
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

        {/* ===== API KEYS TAB ===== */}
        <TabsContent value="apikeys" className="space-y-6 mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Gerar Nova API Key</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Nome da chave (ex: Integração Make)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCreateApiKey} disabled={createApiKey.isPending} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
                  <Key className="h-4 w-4 mr-1" /> Gerar Chave
                </Button>
              </div>
            </CardContent>
          </Card>

          {justCreatedKey && (
            <Card className="shadow-sm border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                  ⚠️ Copie sua chave agora — ela não será exibida novamente!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background p-2 rounded text-sm font-mono break-all border">{justCreatedKey}</code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(justCreatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setJustCreatedKey(null)}>
                  Entendi, fechar
                </Button>
              </CardContent>
            </Card>
          )}

          {lk ? <Skeleton className="h-32 w-full" /> : apiKeys.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Chaves Existentes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {apiKeys.map((ak: ApiKey) => (
                  <div key={ak.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ak.name || "Sem nome"}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <code className="text-xs font-mono text-muted-foreground">
                          {revealedKey === ak.id ? ak.key : maskKey(ak.key)}
                        </code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRevealedKey(revealedKey === ak.id ? null : ak.id)}>
                          {revealedKey === ak.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(ak.key)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criada em {format(new Date(ak.created_at), "dd/MM/yyyy HH:mm")}
                        {ak.last_used_at && ` · Último uso: ${format(new Date(ak.last_used_at), "dd/MM/yyyy HH:mm")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={ak.active} onCheckedChange={(v) => toggleApiKey.mutate({ id: ak.id, active: v })} />
                      <Button variant="ghost" size="icon" onClick={async () => { await deleteApiKey.mutateAsync(ak.id); toast.success("Chave removida!"); }} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== DOCS TAB ===== */}
        <TabsContent value="docs" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-6 prose prose-sm max-w-none">
              <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(216, 47%, 20%)" }}>Documentação da API</h2>

              <h3 className="text-base font-semibold mt-6 mb-2">Autenticação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Todas as chamadas à API requerem uma chave de autenticação no header <code>x-api-key</code>.
                Gere sua chave na aba "API Keys" acima.
              </p>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`Headers:
  x-api-key: baja_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</code>
              </pre>

              <h3 className="text-base font-semibold mt-8 mb-2">Eventos de Webhook Disponíveis</h3>
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
              <h3 className="text-base font-semibold mt-6 mb-2">Headers dos Webhooks</h3>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs">
                <code>{`Content-Type: application/json\nX-Webhook-Event: <event_type>\nX-Webhook-Timestamp: <ISO 8601>`}</code>
              </pre>

              <h3 className="text-base font-semibold mt-8 mb-2">Endpoint: Buscar Demandas por Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Retorna as demandas pendentes para uma data específica.
              </p>
              <h4 className="font-semibold text-sm mb-2">Requisição</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`GET /functions/v1/get-demandas?data=2026-03-26

Headers:
  x-api-key: baja_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</code>
              </pre>
              <h4 className="font-semibold text-sm mt-4 mb-2">Resposta (200)</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{JSON.stringify({
  demandas: [
    {
      id: "uuid",
      titulo: "Renovar licença ambiental",
      descricao: "Licença vence em 30 dias",
      prioridade: "alta",
      data_notificacao: "2026-03-26",
      sazonal: true,
      intervalo_dias: 365,
      status: "pendente"
    }
  ]
}, null, 2)}</code>
              </pre>
              <h4 className="font-semibold text-sm mt-4 mb-2">Erro (401 — Chave inválida)</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`{ "error": "API key inválida ou inativa" }`}</code>
              </pre>
              <h4 className="font-semibold text-sm mt-4 mb-2">Erro (400)</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`{ "error": "Parâmetro 'data' obrigatório no formato YYYY-MM-DD" }`}</code>
              </pre>

              <h3 className="text-base font-semibold mt-8 mb-2">Endpoint: Listar Obras (Clientes)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Retorna a lista de obras cadastradas com dados cadastrais.
              </p>
              <h4 className="font-semibold text-sm mb-2">Requisição</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`GET /functions/v1/get-clients?status=ativa

Headers:
  x-api-key: baja_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

Parâmetros:
  status (opcional): "ativa" (default), "concluida", "pausada" ou "todas"`}</code>
              </pre>
              <h4 className="font-semibold text-sm mt-4 mb-2">Resposta (200)</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{JSON.stringify({
  clients: [
    {
      id: "uuid",
      nome_cliente: "João Silva",
      nome_empreitada: "Residencial Mar Azul",
      endereco_obra: "Rua X, 123",
      status: "ativa",
      data_inicio: "2026-01-15",
      data_prevista_conclusao: "2026-12-30",
      cpf_cnpj: "123.456.789-00",
      telefone: "(11) 99999-0000",
      email: "joao@email.com"
    }
  ]
}, null, 2)}</code>
              </pre>

              <h3 className="text-base font-semibold mt-8 mb-2">Endpoint: Exportar Relatório em PDF</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gera e retorna um PDF com os relatos diários de uma obra em um período específico.
              </p>
              <h4 className="font-semibold text-sm mb-2">Requisição</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`GET /functions/v1/export-report?client_id=UUID&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&include_images=true

Headers:
  x-api-key: baja_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

Parâmetros:
  client_id (obrigatório): ID da obra/cliente
  data_inicio (opcional): Data inicial dos relatos (YYYY-MM-DD)
  data_fim (opcional): Data final dos relatos (YYYY-MM-DD)
  include_images (opcional): "true" para embutir fotos no PDF (padrão: false, mostra URLs)`}</code>
              </pre>
              <h4 className="font-semibold text-sm mt-4 mb-2">Resposta (200)</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio-Nome_Empreitada.pdf"

(arquivo PDF binário)`}</code>
              </pre>
              <h4 className="font-semibold text-sm mt-4 mb-2">Erro (404)</h4>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`{ "error": "Cliente não encontrado" }`}</code>
              </pre>

              <h3 className="text-base font-semibold mt-8 mb-2">URL Base da API</h3>
              <pre className="bg-foreground/5 rounded-lg p-4 text-xs overflow-x-auto">
                <code>{`https://elooeyntfqkygrwmifsv.supabase.co/functions/v1/`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
