import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEATHER_MAP: Record<string, string> = {
  ensolarado: "Ensolarado",
  nublado: "Nublado",
  chuvoso: "Chuvoso",
  parcialmente_nublado: "Parcialmente Nublado",
};

function addHeader(doc: jsPDF, clientName: string, projectName: string, pageNum: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(23, 37, 63);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DIÁRIO DE OBRA", pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${projectName} — ${clientName}`, pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - 15, pageHeight - 8, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate x-api-key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Header x-api-key é obrigatório" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: keyRecord, error: keyErr } = await supabase
      .from("api_keys")
      .select("id")
      .eq("key", apiKey)
      .eq("active", true)
      .single();

    if (keyErr || !keyRecord) {
      return new Response(
        JSON.stringify({ error: "API key inválida ou inativa" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    const url = new URL(req.url);
    const clientId = url.searchParams.get("client_id");
    const dataInicio = url.searchParams.get("data_inicio");
    const dataFim = url.searchParams.get("data_fim");

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'client_id' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if ((dataInicio && !dateRegex.test(dataInicio)) || (dataFim && !dateRegex.test(dataFim))) {
      return new Response(
        JSON.stringify({ error: "Parâmetros de data devem estar no formato YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientErr || !client) {
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch report
    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("client_id", clientId)
      .single();

    if (!report) {
      return new Response(
        JSON.stringify({ error: "Nenhum relatório encontrado para este cliente" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch entries with date filters
    let entriesQuery = supabase
      .from("report_entries")
      .select("*")
      .eq("report_id", report.id)
      .order("data_relato", { ascending: true });

    if (dataInicio) entriesQuery = entriesQuery.gte("data_relato", dataInicio);
    if (dataFim) entriesQuery = entriesQuery.lte("data_relato", dataFim);

    const { data: entries, error: entriesErr } = await entriesQuery;
    if (entriesErr) throw entriesErr;

    // Fetch images
    const { data: images } = await supabase
      .from("report_images")
      .select("*")
      .eq("report_id", report.id);

    const imagesByEntry = new Map<string, { url: string; filename: string }[]>();
    (images ?? []).forEach((img) => {
      if (img.entry_id) {
        const list = imagesByEntry.get(img.entry_id) || [];
        list.push({ url: img.url, filename: img.filename });
        imagesByEntry.set(img.entry_id, list);
      }
    });

    // Fetch tools
    const allToolIds = (entries ?? []).flatMap((e) => e.ferramentas_ids || []);
    const uniqueToolIds = [...new Set(allToolIds)];
    let toolsMap = new Map<string, string>();
    if (uniqueToolIds.length > 0) {
      const { data: tools } = await supabase
        .from("tools")
        .select("id, nome")
        .in("id", uniqueToolIds);
      (tools ?? []).forEach((t) => toolsMap.set(t.id, t.nome));
    }

    // Generate PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;
    let pageNum = 1;

    const ensureSpace = (needed: number) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (y + needed > pageHeight - 15) {
        addFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        addHeader(doc, client.nome_cliente, client.nome_empreitada, pageNum);
        y = 35;
      }
    };

    // Page 1 - Cover info
    addHeader(doc, client.nome_cliente, client.nome_empreitada, pageNum);
    y = 38;

    // Client info box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, contentWidth, 38, 2, 2, "F");
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DA OBRA", margin + 4, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const infoLines = [
      `Cliente: ${client.nome_cliente}`,
      `Empreitada: ${client.nome_empreitada}`,
      `Endereço: ${client.endereco_obra || "—"}`,
      `Período: ${dataInicio || "início"} a ${dataFim || "atual"}`,
    ];
    infoLines.forEach((line) => {
      doc.text(line, margin + 4, y);
      y += 5;
    });
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total de relatos: ${(entries ?? []).length}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 10;

    // Entries
    (entries ?? []).forEach((entry, idx) => {
      ensureSpace(50);

      // Entry header
      doc.setFillColor(23, 37, 63);
      doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const dateFormatted = entry.data_relato;
      doc.text(`Relato ${idx + 1} — ${dateFormatted}`, margin + 4, y + 5.5);
      doc.setTextColor(0, 0, 0);
      y += 12;

      // Meta row
      ensureSpace(12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Clima:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(WEATHER_MAP[entry.condicoes_climaticas] || entry.condicoes_climaticas, margin + 14, y);

      if (entry.equipe) {
        doc.setFont("helvetica", "bold");
        doc.text("Equipe:", margin + 60, y);
        doc.setFont("helvetica", "normal");
        doc.text(entry.equipe, margin + 74, y);
      }
      y += 6;

      // Tools
      const toolNames = (entry.ferramentas_ids || []).map((id: string) => toolsMap.get(id) || id);
      if (toolNames.length > 0) {
        ensureSpace(8);
        doc.setFont("helvetica", "bold");
        doc.text("Ferramentas:", margin, y);
        doc.setFont("helvetica", "normal");
        const toolsText = toolNames.join(", ");
        const toolLines = doc.splitTextToSize(toolsText, contentWidth - 28);
        doc.text(toolLines, margin + 28, y);
        y += toolLines.length * 4 + 3;
      }

      // Atividades
      if (entry.atividades_dia) {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Atividades do Dia:", margin, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        const actLines = doc.splitTextToSize(entry.atividades_dia, contentWidth);
        actLines.forEach((line: string) => {
          ensureSpace(5);
          doc.text(line, margin, y);
          y += 4;
        });
        y += 2;
      }

      // Observações
      if (entry.observacoes) {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.text("Observações:", margin, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        const obsLines = doc.splitTextToSize(entry.observacoes, contentWidth);
        obsLines.forEach((line: string) => {
          ensureSpace(5);
          doc.text(line, margin, y);
          y += 4;
        });
        y += 2;
      }

      // Images (URLs only)
      const entryImages = imagesByEntry.get(entry.id) || [];
      if (entryImages.length > 0) {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.text("Fotos:", margin, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 100, 180);
        entryImages.forEach((img) => {
          ensureSpace(5);
          const label = img.filename || "foto";
          doc.text(`• ${label}: ${img.url}`, margin + 2, y);
          y += 4;
        });
        doc.setTextColor(0, 0, 0);
        y += 2;
      }

      // Separator
      ensureSpace(6);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    });

    addFooter(doc, pageNum);

    const pdfBytes = doc.output("arraybuffer");

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${client.nome_empreitada.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
