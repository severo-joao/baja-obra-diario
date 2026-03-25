import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useInvites } from "@/hooks/use-invites";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Mail, Send, Clock, CheckCircle2, Link2, Copy,
  Users, Shield, Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useUsersWithPermissions,
  useUpdateUserPermissions,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  type UserPermission,
  type UserWithPermissions,
} from "@/hooks/use-user-permissions";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { data: invites, isLoading } = useInvites();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Users & permissions
  const { data: users, isLoading: loadingUsers } = useUsersWithPermissions();
  const updatePerms = useUpdateUserPermissions();
  const [editingUser, setEditingUser] = useState<UserWithPermissions | null>(null);
  const [editPerms, setEditPerms] = useState<UserPermission[]>([]);

  const openPermEditor = (user: UserWithPermissions) => {
    setEditingUser(user);
    const perms = PERMISSION_KEYS.map((key) => {
      const existing = user.permissions.find((p) => p.permission_key === key);
      return {
        permission_key: key,
        can_view: existing?.can_view ?? true,
        can_edit: existing?.can_edit ?? true,
      };
    });
    setEditPerms(perms);
  };

  const togglePerm = (key: string, field: "can_view" | "can_edit") => {
    setEditPerms((prev) =>
      prev.map((p) =>
        p.permission_key === key
          ? {
              ...p,
              [field]: !p[field],
              // If removing view, also remove edit
              ...(field === "can_view" && p.can_view ? { can_edit: false } : {}),
              // If adding edit, also add view
              ...(field === "can_edit" && !p.can_edit ? { can_view: true } : {}),
            }
          : p
      )
    );
  };

  const savePerms = async () => {
    if (!editingUser) return;
    try {
      await updatePerms.mutateAsync({ userId: editingUser.id, permissions: editPerms });
      toast({ title: "Permissões atualizadas!" });
      setEditingUser(null);
    } catch {
      toast({ title: "Erro ao salvar permissões", variant: "destructive" });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: { email: email.trim() },
    });
    setSending(false);

    if (error || data?.error) {
      toast({
        title: "Erro ao enviar convite",
        description: data?.error || error?.message || "Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Convite enviado!", description: `Um email foi enviado para ${email}.` });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie usuários e convites</p>
      </div>

      {/* Users & Permissions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !users?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isCurrentUser = u.id === session?.user?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.email}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs">Você</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openPermEditor(u)}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Permissões
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Convidar Novo Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Email do novo usuário</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
            </div>
            <Button type="submit" disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar Convite
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invites List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Convites Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !invites?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum convite enviado ainda.</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{invite.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(invite.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    <Badge variant={invite.status === "accepted" ? "default" : "secondary"} className="gap-1">
                      {invite.status === "accepted" ? (
                        <><CheckCircle2 className="h-3 w-3" /> Aceito</>
                      ) : (
                        <><Clock className="h-3 w-3" /> Pendente</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Link */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            Link Externo para Relatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Compartilhe este link com funcionários de obra para que registrem relatos diários sem precisar de login.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/relato-externo`}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/relato-externo`);
                toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência." });
              }}
            >
              <Copy className="h-4 w-4" /> Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permission Editor Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissões de {editingUser?.email}
            </DialogTitle>
            <DialogDescription>
              Configure quais seções o usuário pode visualizar e editar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seção</TableHead>
                  <TableHead className="text-center w-24">Visualizar</TableHead>
                  <TableHead className="text-center w-24">Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editPerms.map((perm) => (
                  <TableRow key={perm.permission_key}>
                    <TableCell className="font-medium text-sm">
                      {PERMISSION_LABELS[perm.permission_key as keyof typeof PERMISSION_LABELS] || perm.permission_key}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.can_view}
                        onCheckedChange={() => togglePerm(perm.permission_key, "can_view")}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.can_edit}
                        onCheckedChange={() => togglePerm(perm.permission_key, "can_edit")}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={savePerms} disabled={updatePerms.isPending} className="gap-2">
              {updatePerms.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
