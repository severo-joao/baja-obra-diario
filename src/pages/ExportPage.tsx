import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { WEATHER_OPTIONS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ExportPage() {
  const { clients, reports, tools } = useAppStore();
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = reports.filter((r) => {
    if (clientId && r.client_id !== clientId) return false;
    if (dateFrom && r.data_relatorio < dateFrom) return false;
    if (dateTo && r.data_relatorio > dateTo) return false;
    return true;
  }).sort((a, b) => new Date(a.data_relatorio).getTime() - new Date(b.data_relatorio).getTime());

  const client = clients.find((c) => c.id === clientId);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Exportar Relatório</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecione a obra e o período para exportar</p>
      </div>

      <Card className="shadow-sm no-print">
        <CardContent className="p-6">
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
            <Button onClick={handlePrint} disabled={filtered.length === 0} className="bg-baja-orange hover:bg-baja-orange/90 text-accent-foreground">
              <Printer className="h-4 w-4 mr-2" /> Imprimir / Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum relatório encontrado</p>
            <p className="text-sm mt-1">Selecione uma obra e período para visualizar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filtered.map((report) => {
            const usedTools = tools.filter((t) => report.ferramentas_ids?.includes(t.id));
            const weather = WEATHER_OPTIONS.find((w) => w.value === report.condicoes_climaticas);
            return (
              <div key={report.id} className="a4-page mx-auto" style={{ maxWidth: "210mm" }}>
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
                  <p className="text-xs font-mono" style={{ color: "hsl(215, 14%, 44%)" }}>#{report.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Cliente:</span> {client?.nome_cliente}</div>
                  <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Obra:</span> {client?.nome_empreitada}</div>
                  <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Data:</span> {format(new Date(report.data_relatorio), "dd/MM/yyyy")}</div>
                  <div><span className="text-xs font-semibold uppercase" style={{ color: "hsl(215, 14%, 44%)" }}>Clima:</span> {weather?.label}</div>
                </div>

                <table className="w-full text-sm border mb-4">
                  <thead>
                    <tr style={{ backgroundColor: "hsl(216, 47%, 20%)" }}>
                      <th className="text-left p-2" style={{ color: "white" }}>Equipe</th>
                      <th className="text-left p-2" style={{ color: "white" }}>Ferramentas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2 align-top whitespace-pre-wrap">{report.equipe || "—"}</td>
                      <td className="p-2 align-top">{usedTools.map((t) => t.nome).join(", ") || "—"}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mb-4">
                  <h3 className="font-semibold text-sm mb-1 border-b pb-1" style={{ color: "hsl(216, 47%, 20%)" }}>Atividades do Dia</h3>
                  <p className="text-sm whitespace-pre-wrap">{report.atividades_dia}</p>
                </div>

                {report.observacoes && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm mb-1 border-b pb-1" style={{ color: "hsl(216, 47%, 20%)" }}>Observações</h3>
                    <p className="text-sm whitespace-pre-wrap">{report.observacoes}</p>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t text-center text-xs" style={{ color: "hsl(215, 14%, 44%)" }}>
                  BAJA Engenharia & Construções — Diário de Obras
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
