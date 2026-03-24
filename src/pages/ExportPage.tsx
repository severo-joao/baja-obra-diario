import { useState, useRef } from "react";
import { useClients } from "@/hooks/use-clients";
import { useReport, useReports } from "@/hooks/use-reports";
import { useTools } from "@/hooks/use-tools";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import A4ReportPage from "@/components/report/A4ReportPage";
import ReportEntrySection from "@/components/report/ReportEntrySection";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportPage() {
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: reports = [], isLoading: lr } = useReports();
  const { data: tools = [] } = useTools();
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const loading = lc || lr;

  const selectedReport = reports.find((r) => r.client_id === clientId);
  const { data: fullReport } = useReport(selectedReport?.id);

  const client = clients.find((c) => c.id === clientId);

  const filteredEntries = (fullReport?.entries || []).filter((e) => {
    if (dateFrom && e.data_relato < dateFrom) return false;
    if (dateTo && e.data_relato > dateTo) return false;
    return true;
  });

  const handleExportPDF = async () => {
    if (!printAreaRef.current || !client) return;
    setExporting(true);
    try {
      const pages = printAreaRef.current.querySelectorAll<HTMLElement>("[data-report-page]");
      if (pages.length === 0) return;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      const obraSlug = client.nome_empreitada.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
      pdf.save(`relatorio-${obraSlug}-${dateFrom || "todos"}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      toast.error(err?.message || "Erro ao gerar PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Exportar Relatório</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecione a obra e o período para exportar</p>
      </div>

      <Card className="shadow-sm">
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
                <Button
                  onClick={handleExportPDF}
                  disabled={filteredEntries.length === 0 || exporting}
                  className="bg-accent hover:bg-accent/85 text-accent-foreground"
                >
                  {exporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando PDF...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Exportar PDF</>
                  )}
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
      ) : filteredEntries.length > 0 && client && (
        <div ref={printAreaRef} className="flex flex-col items-center gap-8">
          {filteredEntries.map((entry, idx) => (
            <A4ReportPage key={entry.id} pageNumber={idx + 1} totalPages={filteredEntries.length}>
              <ReportEntrySection
                entry={entry}
                index={idx}
                clientName={client.nome_cliente}
                obraName={client.nome_empreitada}
                tools={tools}
              />
            </A4ReportPage>
          ))}
        </div>
      )}
    </div>
  );
}
