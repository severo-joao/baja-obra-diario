import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Helpers ───

async function validateApiKey(supabase: any, apiKey: string | null) {
  if (!apiKey) throw { status: 401, message: "Header x-api-key é obrigatório" };
  const { data: keyRecord, error: keyErr } = await supabase
    .from("api_keys").select("id").eq("key", apiKey).eq("active", true).single();
  if (keyErr || !keyRecord) throw { status: 401, message: "API key inválida ou inativa" };
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);
}

// ─── Data fetching ───

async function fetchReportData(supabase: any, clientId: string, dateFrom: string | null, dateTo: string | null) {
  const { data: client, error: clientErr } = await supabase
    .from("clients").select("*").eq("id", clientId).single();
  if (clientErr || !client) throw { status: 404, message: "Cliente não encontrado" };

  const { data: report } = await supabase
    .from("reports").select("id").eq("client_id", clientId).single();
  if (!report) throw { status: 404, message: "Relatório não encontrado" };

  let entriesQuery = supabase
    .from("report_entries").select("*").eq("report_id", report.id)
    .order("data_relato", { ascending: true });
  if (dateFrom) entriesQuery = entriesQuery.gte("data_relato", dateFrom);
  if (dateTo) entriesQuery = entriesQuery.lte("data_relato", dateTo);
  const { data: entries } = await entriesQuery;

  const { data: images } = await supabase
    .from("report_images").select("*").eq("report_id", report.id);

  const allToolIds = (entries ?? []).flatMap((e: any) => e.ferramentas_ids || []);
  const uniqueToolIds = [...new Set(allToolIds)];
  let tools: any[] = [];
  if (uniqueToolIds.length > 0) {
    const { data: toolsData } = await supabase
      .from("tools").select("id, nome").in("id", uniqueToolIds);
    tools = toolsData ?? [];
  }

  const imagesByEntry: Record<string, any[]> = {};
  (images ?? []).forEach((img: any) => {
    if (img.entry_id) {
      if (!imagesByEntry[img.entry_id]) imagesByEntry[img.entry_id] = [];
      imagesByEntry[img.entry_id].push({ id: img.id, url: img.url, filename: img.filename });
    }
  });

  const entriesWithImages = (entries ?? []).map((entry: any) => ({
    ...entry,
    images: imagesByEntry[entry.id] || [],
  }));

  return { client, entries: entriesWithImages, tools };
}

// Fetch image as Uint8Array (avoids expensive base64 string conversion)
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB limit per image
const LOGO_URL = "https://elooeyntfqkygrwmifsv.supabase.co/storage/v1/object/public/report-images/baja-logo.png";

let cachedLogo: { bytes: Uint8Array; format: string } | null = null;

async function fetchLogoData(): Promise<{ bytes: Uint8Array; format: string } | null> {
  if (cachedLogo) return cachedLogo;
  const data = await fetchImageData(LOGO_URL);
  if (data) cachedLogo = data;
  return data;
}

async function fetchImageData(url: string): Promise<{ bytes: Uint8Array; format: string } | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const contentLength = resp.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_BYTES) {
      await resp.body?.cancel();
      return null;
    }
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    const ct = resp.headers.get("content-type") || "";
    const format = ct.includes("png") ? "PNG" : "JPEG";
    return { bytes: new Uint8Array(buf), format };
  } catch {
    return null;
  }
}

// ─── Layout constants (mm, A4 = 210x297) ───

const PW = 210;
const PH = 297;
const BORDER_INSET = 3;
const LINE_X = 19;
const CONTENT_X = 27;
const CONTENT_W = 170;
const NAVY = [26, 43, 74];
const GRAY = [107, 114, 128];
const ORANGE = [232, 119, 34];

function drawPageFrame(doc: any) {
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.rect(BORDER_INSET, BORDER_INSET, PW - 2 * BORDER_INSET, PH - 2 * BORDER_INSET);
  doc.setLineWidth(0.3);
  doc.line(LINE_X, BORDER_INSET, LINE_X, PH - BORDER_INSET);
}

function drawHeader(doc: any, _client: any, pageLabel: string) {
  const y = 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("BAJA Construções", CONTENT_X, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("CNPJ: 12.345.678/0001-90", CONTENT_X, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ORANGE);
  doc.text("Relatório Diário de Obra", CONTENT_X, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(pageLabel, PW - BORDER_INSET - 5, y + 2, { align: "right" });

  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.4);
  doc.line(CONTENT_X, y + 16, CONTENT_X + CONTENT_W, y + 16);

  return y + 20;
}

function drawFooter(doc: any, client: any, pageNum: number, totalPages: number) {
  const y = PH - BORDER_INSET - 6;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(CONTENT_X, y - 2, CONTENT_X + CONTENT_W, y - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(client.endereco_obra || "", CONTENT_X, y + 2);
  doc.text(`Página ${pageNum} de ${totalPages}`, PW - BORDER_INSET - 5, y + 2, { align: "right" });
}

function drawInfoBlock(doc: any, client: any, entry: any, entryIndex: number, y: number): number {
  const labelX = CONTENT_X;
  const valueX = CONTENT_X + 30;
  const lineH = 5;

  const fields = [
    ["Obra:", client.nome_empreitada],
    ["Cliente:", client.nome_cliente],
    ["Data:", formatDate(entry.data_relato)],
    ["Relato:", `#${entryIndex + 1}`],
  ];

  for (const [label, value] of fields) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(String(value || ""), valueX, y);
    y += lineH;
  }

  return y + 2;
}

function formatDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function drawSection(doc: any, title: string, content: string, y: number, maxY: number): number {
  if (!content || content.trim() === "") return y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(title, CONTENT_X, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  const lines = doc.splitTextToSize(content, CONTENT_W);
  for (const line of lines) {
    if (y > maxY) break;
    doc.text(line, CONTENT_X, y);
    y += 3.5;
  }

  return y + 2;
}

function getWeatherEmoji(cond: string): string {
  const map: Record<string, string> = {
    ensolarado: "Ensolarado",
    nublado: "Nublado",
    chuvoso: "Chuvoso",
    parcialmente_nublado: "Parcialmente Nublado",
  };
  return map[cond] || cond;
}

function calculatePages(entries: any[], includeImages: boolean): number {
  let total = 0;
  for (const entry of entries) {
    total += 1;
    if (includeImages && entry.images.length > 4) {
      const extraImages = entry.images.length - 4;
      total += Math.ceil(extraImages / 6);
    }
  }
  return Math.max(total, 1);
}

// ─── Generate PDF ───

async function generatePdfNative(
  supabase: any,
  clientId: string,
  dateFrom: string | null,
  dateTo: string | null,
  includeImages: boolean,
): Promise<Uint8Array> {
  const { client, entries, tools } = await fetchReportData(supabase, clientId, dateFrom, dateTo);

  const toolMap: Record<string, string> = {};
  tools.forEach((t: any) => { toolMap[t.id] = t.nome; });

  const totalPages = calculatePages(entries, includeImages);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let currentPage = 0;
  const maxContentY = PH - BORDER_INSET - 12;

  for (let ei = 0; ei < entries.length; ei++) {
    const entry = entries[ei];

    if (ei > 0) doc.addPage();
    currentPage++;

    drawPageFrame(doc);
    let y = drawHeader(doc, client, `Relatório #${ei + 1}`);
    drawFooter(doc, client, currentPage, totalPages);

    y = drawInfoBlock(doc, client, entry, ei, y);
    y = drawSection(doc, "Condições Climáticas", getWeatherEmoji(entry.condicoes_climaticas), y, maxContentY);
    y = drawSection(doc, "Equipe", entry.equipe, y, maxContentY);

    const toolNames = (entry.ferramentas_ids || [])
      .map((id: string) => toolMap[id] || id)
      .join(", ");
    y = drawSection(doc, "Ferramentas", toolNames, y, maxContentY);

    y = drawSection(doc, "Atividades do Dia", entry.atividades_dia, y, maxContentY);
    y = drawSection(doc, "Observações", entry.observacoes, y, maxContentY);

    if (includeImages && entry.images.length > 0) {
      const firstPageImages = entry.images.slice(0, 4);
      y = await drawImageGrid(doc, firstPageImages, y, maxContentY, 2);

      if (entry.images.length > 4) {
        const remaining = entry.images.slice(4);
        for (let chunk = 0; chunk < remaining.length; chunk += 6) {
          doc.addPage();
          currentPage++;
          drawPageFrame(doc);
          const contY = drawHeader(doc, client, `Relatório #${ei + 1} (cont.)`);
          drawFooter(doc, client, currentPage, totalPages);

          const pageImages = remaining.slice(chunk, chunk + 6);
          await drawImageGrid(doc, pageImages, contY, maxContentY, 2);
        }
      }
    }
  }

  if (entries.length === 0) {
    currentPage = 1;
    drawPageFrame(doc);
    drawHeader(doc, client, "");
    drawFooter(doc, client, 1, 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("Nenhum relato encontrado para o período selecionado.", CONTENT_X, 50);
  }

  const arrayBuf = doc.output("arraybuffer");
  return new Uint8Array(arrayBuf);
}

async function drawImageGrid(
  doc: any,
  images: any[],
  startY: number,
  maxY: number,
  cols: number,
): Promise<number> {
  const gap = 3;
  const imgW = (CONTENT_W - gap * (cols - 1)) / cols;
  const imgH = 53;
  let y = startY + 2;

  for (let i = 0; i < images.length; i++) {
    const col = i % cols;
    const x = CONTENT_X + col * (imgW + gap);

    if (col === 0 && i > 0) y += imgH + gap;
    if (y + imgH > maxY) break;

    // Fetch one image at a time to minimize memory usage
    const imgData = await fetchImageData(images[i].url);
    if (imgData) {
      try {
        doc.addImage(imgData.bytes, imgData.format, x, y, imgW, imgH);
      } catch {
        // Skip broken image
      }
    }
  }

  return y + imgH + 2;
}

// ─── Server handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await validateApiKey(supabase, req.headers.get("x-api-key"));

    const url = new URL(req.url);
    const jobId = url.searchParams.get("job_id");

    // === POLLING: check job status ===
    if (jobId) {
      const { data: job, error: jobErr } = await supabase
        .from("export_jobs").select("*").eq("id", jobId).single();

      if (jobErr || !job) {
        return new Response(
          JSON.stringify({ error: "Job não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (job.status === "completed" && job.file_path) {
        const { data: urlData } = supabase.storage
          .from("export-pdfs")
          .getPublicUrl(job.file_path);

        return new Response(
          JSON.stringify({ status: "completed", download_url: urlData.publicUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (job.status === "failed") {
        return new Response(
          JSON.stringify({ status: "failed", error: job.error }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ status: "processing", job_id: jobId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === PARAMS ===
    const clientId = url.searchParams.get("client_id");
    const dataInicio = url.searchParams.get("data_inicio");
    const dataFim = url.searchParams.get("data_fim");
    const includeImages = url.searchParams.get("include_images") === "true";

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

    // === SYNC MODE (no images) — return PDF directly ===
    if (!includeImages) {
      const pdfBytes = await generatePdfNative(supabase, clientId, dataInicio, dataFim, false);
      const { data: clientData } = await supabase
        .from("clients").select("nome_empreitada").eq("id", clientId).single();
      const clientName = clientData?.nome_empreitada || "relatorio";

      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="relatorio-${clientName.replace(/\s+/g, "_")}.pdf"`,
        },
      });
    }

    // === ASYNC MODE: include_images=true ===
    // Create job record first
    const { data: job, error: jobCreateErr } = await supabase
      .from("export_jobs")
      .insert({ client_id: clientId, status: "processing" })
      .select("id")
      .single();

    if (jobCreateErr || !job) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar job de exportação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate PDF synchronously (EdgeRuntime.waitUntil not available in Supabase)
    try {
      const pdfBytes = await generatePdfNative(supabase, clientId, dataInicio, dataFim, true);

      const filePath = `${job.id}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("export-pdfs")
        .upload(filePath, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      await supabase.from("export_jobs")
        .update({ status: "completed", file_path: filePath, updated_at: new Date().toISOString() })
        .eq("id", job.id);

      const { data: urlData } = supabase.storage
        .from("export-pdfs")
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({ job_id: job.id, status: "completed", download_url: urlData.publicUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err: any) {
      await supabase.from("export_jobs")
        .update({ status: "failed", error: err.message || "Erro desconhecido", updated_at: new Date().toISOString() })
        .eq("id", job.id);

      return new Response(
        JSON.stringify({ job_id: job.id, status: "failed", error: err.message || "Erro ao gerar PDF" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (e: any) {
    const status = e.status || 500;
    return new Response(
      JSON.stringify({ error: e.message || "Erro interno" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
