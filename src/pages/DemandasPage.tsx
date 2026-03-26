import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, RefreshCw, Bell, CheckCircle, Trash2, Edit2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DEMANDA_PRIORIDADE, DEMANDA_STATUS, type Demanda } from "@/lib/types";
import {
  useDemandas,
  useCreateDemanda,
  useUpdateDemanda,
  useDeleteDemanda,
  useRenovarDemanda,
  useLembrarAmanhaDemanda,
  useAprovarDemanda,
} from "@/hooks/use-demandas";
import { toast } from "sonner";

interface DemandaForm {
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  sazonal: boolean;
  intervalo_dias: number | null;
  data_notificacao: string;
  webhook_url: string;
}

const emptyForm: DemandaForm = {
  titulo: "",
  descricao: "",
  prioridade: "media",
  sazonal: false,
  intervalo_dias: null,
  data_notificacao: "",
  webhook_url: "",
};

export default function DemandasPage() {
  const { data: demandas, isLoading } = useDemandas();
  const createMut = useCreateDemanda();
  const updateMut = useUpdateDemanda();
  const deleteMut = useDeleteDemanda();
  const renovarMut = useRenovarDemanda();
  const lembrarMut = useLembrarAmanhaDemanda();
  const aprovarMut = useAprovarDemanda();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dateValue, setDateValue] = useState<Date | undefined>();

  const resetForm = () => {
    setForm(emptyForm);
    setDateValue(undefined);
    setEditId(null);
  };

  const openEdit = (d: Demanda) => {
    setEditId(d.id);
    setForm({
      titulo: d.titulo,
      descricao: d.descricao,
      prioridade: d.prioridade as "alta" | "media" | "baixa",
      sazonal: d.sazonal,
      intervalo_dias: d.intervalo_dias,
      data_notificacao: d.data_notificacao,
      webhook_url: d.webhook_url,
    });
    setDateValue(new Date(d.data_notificacao + "T12:00:00"));
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.titulo || !form.data_notificacao) {
      toast.error("Preencha título e data de notificação");
      return;
    }
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...form });
        toast.success("Demanda atualizada");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Demanda criada");
      }
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Erro ao salvar demanda");
    }
  };

  const prioridadeBadge = (val: string) => {
    const p = DEMANDA_PRIORIDADE.find((x) => x.value === val);
    return p ? <Badge className={p.color}>{p.label}</Badge> : val;
  };

  const statusBadge = (val: string) => {
    const s = DEMANDA_STATUS.find((x) => x.value === val);
    return s ? <Badge className={s.color}>{s.label}</Badge> : val;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demandas</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas demandas e notificações</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Demanda</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Demanda" : "Nova Demanda"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v: any) => setForm({ ...form, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEMANDA_PRIORIDADE.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data da Notificação *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateValue && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateValue ? format(dateValue, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(d) => {
                        setDateValue(d);
                        if (d) setForm({ ...form, data_notificacao: format(d, "yyyy-MM-dd") });
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.sazonal} onCheckedChange={(v) => setForm({ ...form, sazonal: v, intervalo_dias: v ? (form.intervalo_dias || 30) : null })} />
                <Label>Sazonal (recorrente)</Label>
              </div>
              {form.sazonal && (
                <div>
                  <Label>Intervalo em dias</Label>
                  <Input type="number" min={1} value={form.intervalo_dias || ""} onChange={(e) => setForm({ ...form, intervalo_dias: parseInt(e.target.value) || null })} />
                </div>
              )}
              <div>
                <Label>Webhook URL</Label>
                <Input placeholder="https://..." value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
                {editId ? "Salvar Alterações" : "Criar Demanda"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Demandas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : !demandas?.length ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma demanda cadastrada</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Notificação</TableHead>
                    <TableHead>Sazonal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandas.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.titulo}</TableCell>
                      <TableCell>{prioridadeBadge(d.prioridade)}</TableCell>
                      <TableCell>
                        {d.data_notificacao
                          ? format(new Date(d.data_notificacao + "T12:00:00"), "dd/MM/yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {d.sazonal ? `Sim (${d.intervalo_dias}d)` : "Não"}
                      </TableCell>
                      <TableCell>{statusBadge(d.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {d.status === "pendente" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => renovarMut.mutate(d)} title="Renovar">
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => lembrarMut.mutate(d.id)} title="Lembrar amanhã">
                                <Bell className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => aprovarMut.mutate(d.id)} title="Aprovar">
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            deleteMut.mutate(d.id);
                            toast.success("Demanda excluída");
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
