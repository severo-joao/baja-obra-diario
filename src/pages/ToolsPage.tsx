import { useState } from "react";
import { useTools, useCreateTool, useUpdateTool, useDeleteTool } from "@/hooks/use-tools";
import { useClients } from "@/hooks/use-clients";
import type { Tool } from "@/lib/types";
import { TOOL_CATEGORIES, TOOL_STATUS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

const emptyTool: Omit<Tool, "id" | "created_at"> = {
  nome: "", codigo_patrimonio: "", categoria: "manual", descricao: "", status: "disponivel", client_id: null,
};

export default function ToolsPage() {
  const { data: tools = [], isLoading } = useTools();
  const { data: clients = [] } = useClients();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [form, setForm] = useState(emptyTool);

  const filtered = tools.filter((t) =>
    [t.nome, t.codigo_patrimonio].some((f) => f.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => { setEditing(null); setForm(emptyTool); setDialogOpen(true); };
  const openEdit = (t: Tool) => { setEditing(t); setForm(t); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.nome) { toast.error("Preencha o nome da ferramenta."); return; }
    try {
      if (editing) {
        await updateTool.mutateAsync({ id: editing.id, ...form });
        toast.success("Ferramenta atualizada!");
      } else {
        await createTool.mutateAsync(form);
        toast.success("Ferramenta cadastrada!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar ferramenta.");
    }
  };

  const statusBadge = (status: string) => {
    const s = TOOL_STATUS.find((st) => st.value === status);
    return <Badge variant="secondary" className={s?.color}>{s?.label}</Badge>;
  };

  const catLabel = (cat: string) => TOOL_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ferramentas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie o inventário de ferramentas</p>
        </div>
        <Button onClick={openNew} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" /> Nova Ferramenta
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar ferramenta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma ferramenta cadastrada</p>
            <p className="text-sm mt-1">Adicione sua primeira ferramenta ao inventário.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{t.nome}</h3>
                    <p className="text-xs text-muted-foreground">{t.codigo_patrimonio || "Sem código"}</p>
                  </div>
                  {statusBadge(t.status)}
                </div>
                {t.status === 'em_uso' && t.client_id && (
                  <p className="text-xs text-muted-foreground mb-1">
                    📍 {clients.find((c) => c.id === t.client_id)?.nome_empreitada || "Obra não encontrada"}
                  </p>
                )}
                <Badge variant="outline" className="mb-2 text-xs">{catLabel(t.categoria)}</Badge>
                {t.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{t.descricao}</p>}
                <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir "{t.nome}"?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => { await deleteTool.mutateAsync(t.id); toast.success("Ferramenta removida!"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Ferramenta" : "Nova Ferramenta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Ferramenta *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código/Patrimônio</Label>
                {editing ? (
                  <Input value={form.codigo_patrimonio} disabled className="bg-muted" />
                ) : (
                  <Input value="Gerado automaticamente" disabled className="bg-muted text-muted-foreground italic" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Tool["categoria"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOOL_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Tool["status"], client_id: v === 'em_uso' ? form.client_id : null })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TOOL_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.status === 'em_uso' && (
              <div className="space-y-2">
                <Label>Obra *</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                  <SelectContent>
                    {clients.filter((c) => c.status === 'ativa').map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome_empreitada}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createTool.isPending || updateTool.isPending} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
