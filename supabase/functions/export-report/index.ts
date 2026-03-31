import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEATHER_MAP: Record<string, { label: string; icon: string }> = {
  ensolarado: { label: "Ensolarado", icon: "☀️" },
  nublado: { label: "Nublado", icon: "☁️" },
  chuvoso: { label: "Chuvoso", icon: "🌧️" },
  parcialmente_nublado: { label: "Parcialmente Nublado", icon: "⛅" },
};

const NAVY = [26, 43, 74] as const;
const ORANGE = [232, 119, 34] as const;
const GRAY_TEXT = [107, 114, 128] as const;
const LIGHT_BG = [248, 249, 250] as const;

const PW = 210;
const PH = 297;
const BORDER_INSET = 5;
const LEFT_LINE_X = 18;
const MARGIN_LEFT = 24;
const MARGIN_RIGHT = 15;
const CONTENT_LEFT = MARGIN_LEFT + 2;
const CONTENT_WIDTH = PW - CONTENT_LEFT - MARGIN_RIGHT;

function drawPageFrame(doc: jsPDF) {
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.7);
  doc.rect(BORDER_INSET, BORDER_INSET, PW - BORDER_INSET * 2, PH - BORDER_INSET * 2);
  doc.setLineWidth(0.5);
  doc.line(LEFT_LINE_X, BORDER_INSET, LEFT_LINE_X, PH - BORDER_INSET);
  doc.setFillColor(...NAVY);
  doc.triangle(BORDER_INSET, PH - BORDER_INSET, BORDER_INSET, PH - BORDER_INSET - 30, BORDER_INSET + 20, PH - BORDER_INSET, "F");
}

function drawHeader(doc: jsPDF) {
  doc.setFillColor(...NAVY);
  doc.roundedRect(CONTENT_LEFT, 10, 28, 28, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BAJA", CONTENT_LEFT + 14, 27, { align: "center" });
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Baja Engenharia & Construções", PW - MARGIN_RIGHT, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_TEXT);
  doc.text("CNPJ: 34.526.647/0001-73", PW - MARGIN_RIGHT, 24, { align: "right" });
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(CONTENT_LEFT, 32, PW - MARGIN_RIGHT, 32);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const footerY = PH - BORDER_INSET - 18;
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("Copacabana | Rio de Janeiro", CONTENT_LEFT + 10, footerY);
  doc.text("Rua Ministro de Castro | 15 1118  |  www.bajaengenharia.com.br  |  contato@bajaengenharia.com.br", CONTENT_LEFT + 10, footerY + 4);
  doc.text(`Página ${pageNum} de ${totalPages}`, PW / 2, footerY + 10, { align: "center" });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, accent = false): number {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(title.toUpperCase(), CONTENT_LEFT, y);
  y += 1;
  if (accent) {
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
  }
  return y;
}

function drawWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, accent = false): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const lines: string[] = doc.splitTextToSize(text, maxWidth - (accent ? 4 : 0));
  const textX = accent ? x + 4 : x;
  if (accent) {
    const blockHeight = lines.length * 4.2;
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
    doc.line(x, y - 1, x, y + blockHeight - 1);
  }
  lines.forEach((line: string) => {
    doc.text(line, textX, y);
    y += 4.2;
  });
  return y;
}

function getResizedUrl(originalUrl: string): string {
  // Use Supabase Storage render transform for smaller images
  // Replace /object/public/ with /render/image/public/ and add resize params
  const transformed = originalUrl.replace(
    "/object/public/",
    "/render/image/public/"
  );
  const sep = transformed.includes("?") ? "&" : "?";
  return `${transformed}${sep}width=400&quality=50`;
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    // Try resized version first, fall back to original
    const resizedUrl = getResizedUrl(url);
    let resp = await fetch(resizedUrl);
    if (!resp.ok) {
      resp = await fetch(url);
      if (!resp.ok) return null;
    }
    const buf = await resp.arrayBuffer();
    // Skip images larger than 500KB even after resize
    if (buf.byteLength > 500_000) return null;
    const bytes = new Uint8Array(buf);
    let binary = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
      binary += String.fromCharCode(...slice);
    }
    const b64 = btoa(binary);
    const ct = resp.headers.get("content-type") || "image/jpeg";
    const format = ct.includes("png") ? "PNG" : "JPEG";
    return { data: `data:image/jpeg;base64,${b64}`, format: "JPEG" };
  } catch {
    return null;
  }
}

interface ReportData {
  client: any;
  entries: any[];
  imagesByEntry: Map<string, { url: string; filename: string }[]>;
  toolsMap: Map<string, string>;
}

async function generatePdf(data: ReportData, includeImages: boolean): Promise<ArrayBuffer> {
  const { client, entries, imagesByEntry, toolsMap } = data;
  const totalPages = entries.length || 1;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  if (entries.length === 0) {
    drawPageFrame(doc);
    drawHeader(doc);
    doc.setFontSize(14);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DIÁRIO DE OBRA", PW / 2, 50, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Nenhum relato encontrado no período selecionado.", PW / 2, 65, { align: "center" });
    drawFooter(doc, 1, 1);
  } else {
    for (let idx = 0; idx < entries.length; idx++) {
      const entry = entries[idx];
      if (idx > 0) doc.addPage();
      const pageNum = idx + 1;
      drawPageFrame(doc);
      drawHeader(doc);
      let y = 40;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text("RELATÓRIO DIÁRIO DE OBRA", PW / 2, y, { align: "center" });
      y += 10;

      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(CONTENT_LEFT, y, CONTENT_WIDTH, 22, 2, 2, "F");
      y += 6;
      const col1 = CONTENT_LEFT + 4;
      const col2 = CONTENT_LEFT + CONTENT_WIDTH / 2 + 4;

      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY_TEXT);
      doc.text("OBRA:", col1, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...NAVY); doc.setFontSize(9);
      doc.text(client.nome_empreitada, col1 + 14, y);

      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY_TEXT);
      doc.text("CLIENTE:", col2, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...NAVY); doc.setFontSize(9);
      doc.text(client.nome_cliente, col2 + 18, y);

      y += 7;
      const dateParts = entry.data_relato.split("-");
      const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : entry.data_relato;

      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY_TEXT);
      doc.text("DATA:", col1, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...NAVY); doc.setFontSize(9);
      doc.text(dateFormatted, col1 + 14, y);

      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY_TEXT);
      doc.text("RELATO #:", col2, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...NAVY); doc.setFontSize(9);
      doc.text(String(idx + 1), col2 + 20, y);

      y += 12;

      const weather = WEATHER_MAP[entry.condicoes_climaticas];
      if (weather) {
        y = drawSectionTitle(doc, "Condições Climáticas", y) + 3;
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        doc.text(weather.label, CONTENT_LEFT, y);
        y += 6;
      }

      if (entry.equipe) {
        y = drawSectionTitle(doc, "Equipe", y) + 3;
        y = drawWrappedText(doc, entry.equipe, CONTENT_LEFT, y, CONTENT_WIDTH);
        y += 2;
      }

      const toolNames = (entry.ferramentas_ids || []).map((id: string) => toolsMap.get(id) || id);
      if (toolNames.length > 0) {
        y = drawSectionTitle(doc, "Ferramentas Utilizadas", y) + 3;
        let badgeX = CONTENT_LEFT;
        doc.setFontSize(8); doc.setFont("helvetica", "normal");
        for (const name of toolNames) {
          const tw = doc.getTextWidth(name) + 6;
          if (badgeX + tw > PW - MARGIN_RIGHT) { badgeX = CONTENT_LEFT; y += 6; }
          doc.setFillColor(229, 231, 235);
          doc.roundedRect(badgeX, y - 3.5, tw, 5, 1.5, 1.5, "F");
          doc.setTextColor(55, 65, 81);
          doc.text(name, badgeX + 3, y);
          badgeX += tw + 2;
        }
        y += 8;
      }

      if (entry.atividades_dia) {
        y = drawSectionTitle(doc, "Atividades do Dia", y, true) + 3;
        y = drawWrappedText(doc, entry.atividades_dia, CONTENT_LEFT, y, CONTENT_WIDTH, true);
        y += 3;
      }

      if (entry.observacoes) {
        y = drawSectionTitle(doc, "Observações Importantes", y, true) + 3;
        y = drawWrappedText(doc, entry.observacoes, CONTENT_LEFT, y, CONTENT_WIDTH, true);
        y += 3;
      }

      const entryImages = imagesByEntry.get(entry.id) || [];
      if (entryImages.length > 0) {
        y = drawSectionTitle(doc, "Registros Fotográficos", y) + 3;

        if (includeImages) {
          const maxImgH = entryImages.length === 1 ? 80 : 50;
          const imgW = entryImages.length === 1 ? CONTENT_WIDTH * 0.6 : (CONTENT_WIDTH - 4) / 2;
          let imgX = CONTENT_LEFT;
          let imgCount = 0;
          for (const img of entryImages) {
            const imgData = await fetchImageAsBase64(img.url);
            if (imgData) {
              if (entryImages.length === 1) {
                imgX = CONTENT_LEFT + (CONTENT_WIDTH - imgW) / 2;
              } else {
                imgX = CONTENT_LEFT + (imgCount % 2) * (imgW + 4);
              }
              if (y + maxImgH > PH - 40) {
                doc.setFontSize(7); doc.setTextColor(...GRAY_TEXT);
                doc.text(`+ ${entryImages.length - imgCount} foto(s) não exibidas`, CONTENT_LEFT, y);
                break;
              }
              try {
                doc.addImage(imgData.data, imgData.format, imgX, y, imgW, maxImgH);
              } catch {
                doc.setFontSize(7); doc.setTextColor(...GRAY_TEXT);
                doc.text(`${img.filename}: ${img.url}`, CONTENT_LEFT, y + 4);
              }
              imgCount++;
              if (entryImages.length === 1 || imgCount % 2 === 0) { y += maxImgH + 3; }
            } else {
              doc.setFontSize(7); doc.setTextColor(40, 100, 180);
              doc.text(`• ${img.filename}: ${img.url}`, CONTENT_LEFT, y);
              y += 4;
              imgCount++;
            }
          }
          if (entryImages.length > 1 && imgCount % 2 !== 0) { y += maxImgH + 3; }
        } else {
          doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 100, 180);
          entryImages.forEach((img) => {
            doc.text(`• ${img.filename || "foto"}: ${img.url}`, CONTENT_LEFT, y);
            y += 4;
          });
          doc.setTextColor(0, 0, 0);
        }
      }

      drawFooter(doc, pageNum, totalPages);
    }
  }

  return doc.output("arraybuffer");
}

async function fetchReportData(supabase: any, clientId: string, dataInicio: string | null, dataFim: string | null) {
  const { data: client, error: clientErr } = await supabase
    .from("clients").select("*").eq("id", clientId).single();
  if (clientErr || !client) throw new Error("Cliente não encontrado");

  const { data: report } = await supabase
    .from("reports").select("id").eq("client_id", clientId).single();
  if (!report) throw new Error("Nenhum relatório encontrado para este cliente");

  let entriesQuery = supabase
    .from("report_entries").select("*").eq("report_id", report.id)
    .order("data_relato", { ascending: true });
  if (dataInicio) entriesQuery = entriesQuery.gte("data_relato", dataInicio);
  if (dataFim) entriesQuery = entriesQuery.lte("data_relato", dataFim);
  const { data: entries, error: entriesErr } = await entriesQuery;
  if (entriesErr) throw entriesErr;

  const { data: images } = await supabase
    .from("report_images").select("*").eq("report_id", report.id);

  const imagesByEntry = new Map<string, { url: string; filename: string }[]>();
  (images ?? []).forEach((img: any) => {
    if (img.entry_id) {
      const list = imagesByEntry.get(img.entry_id) || [];
      list.push({ url: img.url, filename: img.filename });
      imagesByEntry.set(img.entry_id, list);
    }
  });

  const allToolIds = (entries ?? []).flatMap((e: any) => e.ferramentas_ids || []);
  const uniqueToolIds = [...new Set(allToolIds)];
  const toolsMap = new Map<string, string>();
  if (uniqueToolIds.length > 0) {
    const { data: tools } = await supabase.from("tools").select("id, nome").in("id", uniqueToolIds);
    (tools ?? []).forEach((t: any) => toolsMap.set(t.id, t.nome));
  }

  return { client, entries: entries ?? [], imagesByEntry, toolsMap };
}

async function validateApiKey(supabase: any, apiKey: string | null) {
  if (!apiKey) throw { status: 401, message: "Header x-api-key é obrigatório" };
  const { data: keyRecord, error: keyErr } = await supabase
    .from("api_keys").select("id").eq("key", apiKey).eq("active", true).single();
  if (keyErr || !keyRecord) throw { status: 401, message: "API key inválida ou inativa" };
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);
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

    // === SYNC MODE: no images, return PDF directly ===
    if (!includeImages) {
      const reportData = await fetchReportData(supabase, clientId, dataInicio, dataFim);
      const pdfBytes = await generatePdf(reportData, false);

      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="relatorio-${reportData.client.nome_empreitada.replace(/\s+/g, "_")}.pdf"`,
        },
      });
    }

    // === ASYNC MODE: include_images=true → background processing ===
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

    // Background processing via EdgeRuntime.waitUntil
    const bgPromise = (async () => {
      try {
        const reportData = await fetchReportData(supabase, clientId, dataInicio, dataFim);
        const pdfBytes = await generatePdf(reportData, true);

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
      } catch (err: any) {
        await supabase.from("export_jobs")
          .update({ status: "failed", error: err.message || "Erro desconhecido", updated_at: new Date().toISOString() })
          .eq("id", job.id);
      }
    })();

    // @ts-ignore - EdgeRuntime.waitUntil is a Deno Deploy / Supabase Edge Runtime API
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(bgPromise);
    } else {
      // Fallback: just await (may hit CPU limit but won't lose the promise)
      bgPromise.catch(() => {});
    }

    return new Response(
      JSON.stringify({ job_id: job.id, status: "processing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    const status = e.status || 500;
    return new Response(
      JSON.stringify({ error: e.message || "Erro interno" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
