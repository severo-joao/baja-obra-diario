import { useReports, useDeleteReport } from "@/hooks/use-reports";
import { useClients } from "@/hooks/use-clients";
import { WEATHER_OPTIONS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Eye, Trash2, ChevronRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ReportsPage() {
  const { data: reports = [], isLoading: lr } = useReports();
  const { data: clients = [], isLoading: lc } = useClients();
  const deleteReport = useDeleteReport();
  const navigate = useNavigate();

  const loading = lr || lc;

  const grouped = clients
    .filter((c) => reports.some((r) => r.client_id === c.id))
    .map((c) => ({
      client: c,
      entries: reports
        .filter((r) => r.client_id === c.id)
        .sort((a, b) => new Date(b.data_relatorio).getTime() - new Date(a.data_relatorio).getTime()),
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios de Obras</h1>
          <p className="text-muted-foreground text-sm mt-1">Diário de obra por empreitada</p>
        </div>
        <Button onClick={() => navigate("/relatorios/novo")} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" /> Novo Relatório
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : grouped.length === 0 && reports.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum relatório criado</p>
            <p className="text-sm mt-1">Crie seu primeiro relatório diário de obra.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ client, entries }) => (
            <Card key={client.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{client.nome_empreitada}</CardTitle>
                    <p className="text-sm text-muted-foreground">{client.nome_cliente}</p>
                  </div>
                  <Badge variant="secondary">{entries.length} {entries.length === 1 ? "entrada" : "entradas"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entries.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                        {WEATHER_OPTIONS.find((w) => w.value === r.condicoes_climaticas)?.icon || "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {format(new Date(r.data_relatorio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{r.atividades_dia.slice(0, 80)}...</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/relatorios/${r.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/relatorios/editar/${r.id}`)}>
                          <ChevronRight className="h-4 w-4" />
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
                              <AlertDialogDescription>Tem certeza que deseja excluir este relatório?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={async () => { await deleteReport.mutateAsync(r.id); toast.success("Relatório removido!"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
