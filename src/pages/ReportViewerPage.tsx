import { useReport } from "@/hooks/use-reports";
import { useTools } from "@/hooks/use-tools";
import { WEATHER_OPTIONS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRef } from "react";

export default function ReportViewerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: report, isLoading } = useReport(id);
  const { data: tools = [] } = useTools();
  const printRef = useRef<HTMLDivElement>(null);

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

      <div className="flex justify-center">
        <div ref={printRef} className="a4-page mx-auto" style={{ maxWidth: "210mm" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(27, 81%, 53%)" }}>
                <span className="font-extrabold text-lg" style={{ color: "white" }}>B</span>
              </div>
              <div>
                <h2 className="font-bold text-lg tracking-tight" style={{ color: "hsl(216, 47%, 20%)" }}>BAJA</h2>
                <p className="text-xs" style={{ color: "hsl(215, 14%, 44%)" }}>Engenharia & Construções</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "hsl(215, 14%, 44%)" }}>Diário de Obra</p>
              <p className="font-mono text-xs" style={{ color: "hsl(215, 14%, 44%)" }}>#{report.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(215, 14%, 44%)" }}>Cliente</p>
              <p className="font-medium">{client.nome_cliente}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(215, 14%, 44%)" }}>Obra</p>
              <p className="font-medium">{client.nome_empreitada}</p>
            </div>
          </div>

          {/* Entries */}
          {(!report.entries || report.entries.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum relato registrado.</p>
          ) : (
            <div className="space-y-8">
              {report.entries.map((entry, idx) => {
                const usedTools = tools.filter((t) => entry.ferramentas_ids?.includes(t.id));
                const weather = WEATHER_OPTIONS.find((w) => w.value === entry.condicoes_climaticas);

                return (
                  <div key={entry.id} className="border-t pt-4">
                    <h3 className="font-semibold text-sm mb-3" style={{ color: "hsl(216, 47%, 20%)" }}>
                      Relato #{idx + 1} — {format(new Date(entry.data_relato), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Clima:</span> {weather?.label}</div>
                      <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Ferramentas:</span> {usedTools.length > 0 ? usedTools.map((t) => t.nome).join(", ") : "—"}</div>
                    </div>

                    {entry.equipe && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Equipe</p>
                        <p className="text-sm whitespace-pre-wrap">{entry.equipe}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Atividades do Dia</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.atividades_dia}</p>
                    </div>

                    {entry.observacoes && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Observações</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.observacoes}</p>
                      </div>
                    )}

                    {entry.images && entry.images.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase mb-2" style={{ color: "hsl(215, 14%, 44%)" }}>Registros Fotográficos</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {entry.images.map((img) => (
                            <img key={img.id} src={img.url} alt={img.filename} className="w-full h-32 object-cover rounded border" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 pt-6 border-t text-center" style={{ color: "hsl(215, 14%, 44%)" }}>
            <p className="text-xs">BAJA Engenharia & Construções — Diário de Obras</p>
          </div>
        </div>
      </div>
    </div>
  );
}
