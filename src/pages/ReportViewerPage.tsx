import { useReport } from "@/hooks/use-reports";
import { useTools } from "@/hooks/use-tools";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import A4ReportPage from "@/components/report/A4ReportPage";
import ReportEntrySection from "@/components/report/ReportEntrySection";

export default function ReportViewerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: report, isLoading } = useReport(id);
  const { data: tools = [] } = useTools();

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-[600px] w-full" /></div>;
  }

  const client = report?.client;

  if (!report || !client) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Relatório não encontrado.</p>
        <Button variant="link" onClick={() => navigate("/relatorios")}>Voltar</Button>
      </div>
    );
  }

  const entries = report.entries || [];
  const handlePrint = () => window.print();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 no-print">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold flex-1">Relatório — {client.nome_empreitada}</h1>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </Button>
      </div>

      <div className="flex flex-col items-center gap-8">
        {entries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Nenhum relato registrado.</p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <A4ReportPage key={entry.id} pageNumber={idx + 1} totalPages={entries.length}>
              <ReportEntrySection
                entry={entry}
                index={idx}
                clientName={client.nome_cliente}
                obraName={client.nome_empreitada}
                tools={tools}
              />
            </A4ReportPage>
          ))
        )}
      </div>
    </div>
  );
}
