import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { CLIENT_STATUS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const emptyClient: Omit<Client, "id" | "created_at" | "updated_at"> = {
  nome_cliente: "", cpf_cnpj: "", telefone: "", email: "",
  endereco_obra: "", nome_empreitada: "", data_inicio: "",
  data_prevista_conclusao: "", status: "ativa", observacoes: "",
};

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useAppStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);

  const filtered = clients.filter((c) =>
    [c.nome_cliente, c.nome_empreitada, c.cpf_cnpj].some((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  );

  const openNew = () => { setEditing(null); setForm(emptyClient); setDialogOpen(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm(c); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.nome_cliente || !form.nome_empreitada) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    const now = new Date().toISOString();
    if (editing) {
      updateClient(editing.id, form);
      toast.success("Cliente atualizado com sucesso!");
    } else {
      addClient({ ...form, id: crypto.randomUUID(), created_at: now, updated_at: now } as Client);
      toast.success("Cliente cadastrado com sucesso!");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    toast.success("Cliente removido com sucesso!");
  };

  const statusBadge = (status: string) => {
    const s = CLIENT_STATUS.find((st) => st.value === status);
    return <Badge variant="secondary" className={s?.color}>{s?.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes & Empreitadas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus clientes e obras</p>
        </div>
        <Button onClick={openNew} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, obra ou CPF/CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm mt-1">Cadastre seu primeiro cliente clicando no botão acima.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Obra</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">CPF/CNPJ</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{c.nome_cliente}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{c.nome_empreitada}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell">{c.nome_empreitada}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{c.cpf_cnpj}</td>
                    <td className="p-3">{statusBadge(c.status)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cliente "{c.nome_cliente}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input value={form.nome_cliente} onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço da Obra</Label>
              <Input value={form.endereco_obra} onChange={(e) => setForm({ ...form, endereco_obra: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nome da Empreitada/Obra *</Label>
              <Input value={form.nome_empreitada} onChange={(e) => setForm({ ...form, nome_empreitada: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Client["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data Prevista de Conclusão</Label>
              <Input type="date" value={form.data_prevista_conclusao} onChange={(e) => setForm({ ...form, data_prevista_conclusao: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
              {editing ? "Salvar Alterações" : "Cadastrar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
