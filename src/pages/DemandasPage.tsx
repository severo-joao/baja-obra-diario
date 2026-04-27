import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMANDA_PRIORIDADE, type Demanda, type KanbanColumn } from "@/lib/types";
import {
  useDemandas,
  useCreateDemanda,
  useMoveDemanda,
} from "@/hooks/use-demandas";
import {
  useKanbanColumns,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
} from "@/hooks/use-kanban-columns";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { DemandaDetailDialog } from "@/components/kanban/DemandaDetailDialog";
import { useMyDemandasScope } from "@/hooks/use-user-permissions";
import { useProfiles } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function DemandasPage() {
  const { data: demandas, isLoading } = useDemandas();
  const { data: columns } = useKanbanColumns();
  const { data: profiles } = useProfiles();
  const { user } = useAuth();
  const scope = useMyDemandasScope();
  const myEmail = user?.email ?? "";
  const createMut = useCreateDemanda();
  const moveMut = useMoveDemanda();
  const createColMut = useCreateColumn();
  const updateColMut = useUpdateColumn();
  const deleteColMut = useDeleteColumn();

  const [newOpen, setNewOpen] = useState(false);
  const [defaultColumnId, setDefaultColumnId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"alta" | "media" | "baixa">("media");
  const [responsavel, setResponsavel] = useState("");
  const [prazoDate, setPrazoDate] = useState<Date | undefined>();

  const [selected, setSelected] = useState<Demanda | null>(null);

  const [colDialogOpen, setColDialogOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColColor, setNewColColor] = useState("#94a3b8");

  const openNew = (columnId?: string) => {
    setDefaultColumnId(columnId ?? columns?.[0]?.id ?? null);
    setTitulo("");
    setDescricao("");
    setPrioridade("media");
    setResponsavel(scope === "own" ? myEmail : "");
    setPrazoDate(undefined);
    setNewOpen(true);
  };

  // Apply scope filter: 'own' shows only demandas where responsavel matches user email
  const visibleDemandas = (demandas ?? []).filter((d) =>
    scope === "own" ? (d.responsavel ?? "") === myEmail : true
  );

  const canEditDemanda = (d: { responsavel?: string | null }) =>
    scope === "all" || (d.responsavel ?? "") === myEmail;

  const handleCreate = async () => {
    if (!titulo.trim()) {
      toast.error("Informe o título");
      return;
    }
    const colId = defaultColumnId ?? columns?.[0]?.id ?? null;
    const colDemandas = (demandas ?? []).filter((d) => d.coluna_id === colId);
    const maxOrdem = colDemandas.reduce((m, d) => Math.max(m, d.ordem ?? 0), 0);
    try {
      await createMut.mutateAsync({
        titulo,
        descricao,
        prioridade,
        sazonal: false,
        intervalo_dias: null,
        data_notificacao: prazoDate ? format(prazoDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        coluna_id: colId,
        prazo: prazoDate ? format(prazoDate, "yyyy-MM-dd") : null,
        responsavel,
        ordem: maxOrdem + 1,
      } as any);
      toast.success("Tarefa criada");
      setNewOpen(false);
    } catch {
      toast.error("Erro ao criar tarefa");
    }
  };

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    const ordem = (columns?.length ?? 0);
    try {
      await createColMut.mutateAsync({ titulo: newColTitle, cor: newColColor, ordem });
      setNewColTitle("");
      setNewColColor("#94a3b8");
      toast.success("Coluna criada");
    } catch {
      toast.error("Erro ao criar coluna");
    }
  };

  const handleRenameColumn = async (col: KanbanColumn) => {
    const novo = prompt("Novo título da coluna:", col.titulo);
    if (!novo || novo === col.titulo) return;
    await updateColMut.mutateAsync({ id: col.id, titulo: novo });
  };

  const handleDeleteColumn = async (col: KanbanColumn) => {
    if (!confirm(`Excluir coluna "${col.titulo}"? As tarefas nela ficarão sem coluna.`)) return;
    await deleteColMut.mutateAsync(col.id);
    toast.success("Coluna excluída");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demandas</h1>
          <p className="text-muted-foreground text-sm">
            Quadro Kanban — arraste cartões entre colunas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={colDialogOpen} onOpenChange={setColDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings2 className="h-4 w-4 mr-2" /> Colunas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerenciar colunas</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                {columns?.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 border rounded p-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.cor }}
                    />
                    <span className="flex-1 text-sm">{c.titulo}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRenameColumn(c)}
                    >
                      Renomear
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteColumn(c)}
                    >
                      Excluir
                    </Button>
                  </div>
                ))}
                <div className="border-t pt-3 space-y-2">
                  <Label>Nova coluna</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Título"
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                    />
                    <input
                      type="color"
                      value={newColColor}
                      onChange={(e) => setNewColColor(e.target.value)}
                      className="h-10 w-12 rounded border bg-background"
                    />
                    <Button onClick={handleAddColumn} disabled={!newColTitle.trim()}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openNew()}>
                <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Título *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Coluna</Label>
                    <Select
                      value={defaultColumnId ?? ""}
                      onValueChange={(v) => setDefaultColumnId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEMANDA_PRIORIDADE.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Responsável</Label>
                    <Select
                      value={responsavel || "__none__"}
                      onValueChange={(v) => setResponsavel(v === "__none__" ? "" : v)}
                      disabled={scope === "own"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Não atribuído" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Não atribuído</SelectItem>
                        {profiles?.map((p) => (
                          <SelectItem key={p.id} value={p.email}>
                            {p.email}
                          </SelectItem>
                        ))}
                        {/* Mostrar valor antigo (texto livre) se não estiver na lista */}
                        {responsavel &&
                          !profiles?.some((p) => p.email === responsavel) && (
                            <SelectItem value={responsavel}>{responsavel}</SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !prazoDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {prazoDate
                            ? format(prazoDate, "PPP", { locale: ptBR })
                            : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={prazoDate}
                          onSelect={setPrazoDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMut.isPending}
                >
                  Criar tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading || !columns ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : (
        <KanbanBoard
          columns={columns}
          demandas={visibleDemandas}
          onMove={(id, colId, ordem) => {
            const d = visibleDemandas.find((x) => x.id === id);
            if (d && !canEditDemanda(d)) {
              toast.error("Você só pode mover suas próprias demandas");
              return;
            }
            moveMut.mutate({ id, coluna_id: colId, ordem });
          }}
          onAddCard={(colId) => openNew(colId)}
          onCardClick={(d) => setSelected(d)}
          onRenameColumn={handleRenameColumn}
          onDeleteColumn={handleDeleteColumn}
        />
      )}

      <DemandaDetailDialog
        demanda={selected}
        columns={columns ?? []}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        readOnly={selected ? !canEditDemanda(selected) : false}
        lockResponsavel={scope === "own"}
        myEmail={myEmail}
      />
    </div>
  );
}
