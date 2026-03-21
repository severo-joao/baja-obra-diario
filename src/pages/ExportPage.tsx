import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { useReport, useReports } from "@/hooks/use-reports";
import { useTools } from "@/hooks/use-tools";
import { WEATHER_OPTIONS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ExportPage() {
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: reports = [], isLoading: lr } = useReports();
  const { data: tools = [] } = useTools();
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loading = lc || lr;

  // Find the report for the selected client
  const selectedReport = reports.find((r) => r.client_id === clientId);
  const selectedReportId = selectedReport?.id;

  // Fetch full report with entries + images
  const { data: fullReport } = useReport(selectedReportId);

  const client = clients.find((c) => c.id === clientId);

  // Filter entries by date range
  const filteredEntries = (fullReport?.entries || []).filter((e) => {
    if (dateFrom && e.data_relato < dateFrom) return false;
    if (dateTo && e.data_relato > dateTo) return false;
    return true;
  });

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Exportar Relatório</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecione a obra e o período para exportar</p>
      </div>

      <Card className="shadow-sm no-print">
        <CardContent className="p-6">
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Obra</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome_empreitada} — {c.nome_cliente}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handlePrint} disabled={filteredEntries.length === 0} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
                  <Printer className="h-4 w-4 mr-2" /> Imprimir / Exportar PDF
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!loading && filteredEntries.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum relato encontrado</p>
            <p className="text-sm mt-1">Selecione uma obra e período para visualizar.</p>
          </CardContent>
        </Card>
      ) : filteredEntries.length > 0 && (
        <div className="a4-page mx-auto" style={{ maxWidth: "210mm" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 pb-4 mb-6" style={{ borderColor: "hsl(216, 47%, 20%)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(27, 81%, 53%)" }}>
                <span className="font-extrabold" style={{ color: "white" }}>B</span>
              </div>
              <div>
                <h2 className="font-bold" style={{ color: "hsl(216, 47%, 20%)" }}>BAJA</h2>
                <p className="text-[10px]" style={{ color: "hsl(215, 14%, 44%)" }}>Engenharia & Construções</p>
              </div>
            </div>
            <p className="text-xs font-mono" style={{ color: "hsl(215, 14%, 44%)" }}>
              Diário de Obra
            </p>
          </div>

          {client && (
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Cliente:</span> {client.nome_cliente}</div>
              <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Obra:</span> {client.nome_empreitada}</div>
            </div>
          )}

          <div className="space-y-8">
            {filteredEntries.map((entry, idx) => {
              const usedTools = tools.filter((t) => entry.ferramentas_ids?.includes(t.id));
              const weather = WEATHER_OPTIONS.find((w) => w.value === entry.condicoes_climaticas);

              return (
                <div key={entry.id} className="border-t pt-4">
                  <h3 className="font-semibold text-sm mb-3" style={{ color: "hsl(216, 47%, 20%)" }}>
                    Relato #{idx + 1} — {format(new Date(entry.data_relato), "dd/MM/yyyy")}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Clima:</span> {weather?.label}</div>
                    <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Ferramentas:</span> {usedTools.map((t) => t.nome).join(", ") || "—"}</div>
                  </div>

                  {entry.equipe && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Equipe</p>
                      <p className="text-sm whitespace-pre-wrap">{entry.equipe}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Atividades</p>
                    <p className="text-sm whitespace-pre-wrap">{entry.atividades_dia}</p>
                  </div>

                  {entry.observacoes && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Observações</p>
                      <p className="text-sm whitespace-pre-wrap">{entry.observacoes}</p>
                    </div>
                  )}

                  {entry.images && entry.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase mb-2" style={{ color: "hsl(215, 14%, 44%)" }}>Fotos</p>
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

          <div className="mt-auto pt-4 border-t text-center text-xs" style={{ color: "hsl(215, 14%, 44%)" }}>
            BAJA Engenharia & Construções — Diário de Obras
          </div>
        </div>
      )}
    </div>
  );
}
