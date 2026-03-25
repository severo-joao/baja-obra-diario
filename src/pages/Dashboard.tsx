import { useClients } from "@/hooks/use-clients";
import { useTools } from "@/hooks/use-tools";
import { useReports } from "@/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Wrench, FileText, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: tools = [], isLoading: lt } = useTools();
  const { data: reports = [], isLoading: lr } = useReports();

  const loading = lc || lt || lr;

  const activeClients = clients.filter((c) => c.status === "ativa").length;

  // Count entries this month across all reports
  const now = new Date();
  const entriesThisMonth = reports.reduce((count, r) => {
    return count + (r.entries || []).filter((e) => {
      const d = new Date(e.data_relato + "T00:00:00");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, 0);

  const stats = [
    { label: "Clientes Cadastrados", value: clients.length, icon: Users, color: "text-baja-orange" },
    { label: "Obras Ativas", value: activeClients, icon: Building2, color: "text-emerald-600" },
    { label: "Relatos este Mês", value: entriesThisMonth, icon: FileText, color: "text-blue-600" },
    { label: "Ferramentas Cadastradas", value: tools.length, icon: Wrench, color: "text-amber-600" },
  ];

  // Recent entries across all reports
  const recentEntries = reports.flatMap((r) =>
    (r.entries || []).map((e) => ({ ...e, client: r.client }))
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
   .slice(0, 8);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-16" /> : <div className="text-3xl font-bold tabular-nums">{s.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum relato criado ainda</p>
              <p className="text-sm mt-1">Comece criando seu primeiro relato de obra.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="w-2 h-2 rounded-full bg-baja-orange flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {e.client?.nome_empreitada || "Obra desconhecida"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.client?.nome_cliente} — {format(new Date(e.data_relato), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
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
