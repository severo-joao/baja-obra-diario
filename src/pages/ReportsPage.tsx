import { useReports, useDeleteReport, useGetOrCreateReport } from "@/hooks/use-reports";
import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Plus, FileText, Eye, Trash2, PlusCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ReportsPage() {
  const { data: reports = [], isLoading: lr } = useReports();
  const { data: clients = [], isLoading: lc } = useClients();
  const deleteReport = useDeleteReport();
  const getOrCreateReport = useGetOrCreateReport();
  const navigate = useNavigate();

  const loading = lr || lc;

  // Clients that already have a report
  const clientsWithReport = reports.map((r) => ({
    report: r,
    client: r.client || clients.find((c) => c.id === r.client_id),
  })).filter((x) => x.client);

  // Active clients without a report yet
  const clientsWithoutReport = clients
    .filter((c) => c.status === "ativa" && !reports.some((r) => r.client_id === c.id));

  const handleNewEntry = async (clientId: string) => {
    try {
      const reportId = await getOrCreateReport.mutateAsync(clientId);
      navigate(`/relatorios/entrada/novo/${reportId}`);
    } catch {
      toast.error("Erro ao criar relatório.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios de Obras</h1>
          <p className="text-muted-foreground text-sm mt-1">Um relatório por obra com relatos diários</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : clientsWithReport.length === 0 && clientsWithoutReport.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma obra cadastrada</p>
            <p className="text-sm mt-1">Cadastre uma obra primeiro para criar relatórios.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Obras com relatório existente */}
          {clientsWithReport.length > 0 && (
            <Accordion type="multiple" className="space-y-2">
              {clientsWithReport.map(({ report, client }) => (
                <AccordionItem key={report.id} value={report.id} className="border rounded-lg bg-card shadow-sm px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div>
                        <p className="font-semibold text-base">{client!.nome_empreitada}</p>
                        <p className="text-sm text-muted-foreground">{client!.nome_cliente}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">{report.entries?.length || 0} relatos</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-1">
                      {(report.entries || [])
                        .sort((a, b) => new Date(b.data_relato + "T00:00:00").getTime() - new Date(a.data_relato + "T00:00:00").getTime())
                        .map((entry) => (
                          <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {format(new Date(entry.data_relato + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{entry.atividades_dia.slice(0, 80)}...</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/relatorios/entrada/editar/${entry.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleNewEntry(report.client_id)}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Novo Relato
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/relatorios/${report.id}`)}>
                        <Eye className="h-4 w-4 mr-2" /> Ver Relatório Completo
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive ml-auto">
                            <Trash2 className="h-4 w-4 mr-1" /> Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>Isso excluirá o relatório e todos os relatos diários. Continuar?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => { await deleteReport.mutateAsync(report.id); toast.success("Relatório removido!"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Obras ativas sem relatório */}
          {clientsWithoutReport.length > 0 && (
            <Card className="shadow-sm border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">Obras sem relatório</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clientsWithoutReport.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{c.nome_empreitada}</p>
                        <p className="text-xs text-muted-foreground">{c.nome_cliente}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleNewEntry(c.id)}>
                        <Plus className="h-4 w-4 mr-1" /> Iniciar Diário
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
