import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useInvites } from "@/hooks/use-invites";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Send, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { data: invites, isLoading } = useInvites();
  const { session } = useAuth();
  const queryClient = useQueryClient();

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
                onChange={e => setEmail(e.target.value)}
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
    </div>
  );
}
