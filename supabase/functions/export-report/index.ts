import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function getResizedUrl(originalUrl: string): string {
  const transformed = originalUrl.replace(
    "/object/public/",
    "/render/image/public/"
  );
  const sep = transformed.includes("?") ? "&" : "?";
  return `${transformed}${sep}width=400&quality=50`;
}

async function fetchImageAsBase64DataUri(url: string, maxBytes = 500_000): Promise<string | null> {
  try {
    const resizedUrl = getResizedUrl(url);
    let resp = await fetch(resizedUrl);
    if (!resp.ok) {
      resp = await fetch(url);
      if (!resp.ok) return null;
    }
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > maxBytes) return null;
    const bytes = new Uint8Array(buf);
    const ct = resp.headers.get("content-type") || "image/jpeg";
    const b64 = bytesToBase64(bytes);
    return `data:${ct};base64,${b64}`;
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function sectionBlock(title: string, content: string, accent = false): string {
  const borderStyle = accent ? 'border-left: 3px solid #E87722; padding-left: 12px;' : '';
  return `
    <div style="margin-bottom: 16px;">
      <p style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; color: #1A2B4A; font-size: 11px;">${escapeHtml(title)}</p>
      <div style="${borderStyle}">
        ${content}
      </div>
    </div>
  `;
}

async function generateHtml(data: ReportData, includeImages: boolean): Promise<string> {
  const { client, entries, imagesByEntry, toolsMap } = data;
  const totalPages = entries.length || 1;

  // Use direct URL for logo (public asset) - no base64 needed
  const logoUrl = "https://baja-obra-diario.lovable.app/baja-logo.png";
  const logoHtml = `<img src="${logoUrl}" alt="BAJA Logo" style="width: 105px; height: 105px; object-fit: contain; border-radius: 4px;" />`;

  let pagesHtml = "";

  if (entries.length === 0) {
    pagesHtml = renderPage(logoHtml, `
      <h2 style="text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; color: #1A2B4A; font-size: 18px;">Relatório Diário de Obra</h2>
      <p style="text-align: center; color: #6B7280; font-size: 14px;">Nenhum relato encontrado no período selecionado.</p>
    `, 1, 1);
  } else {
    // Pre-fetch all images in parallel if including images
    const imageDataMap = new Map<string, string>();
    if (includeImages) {
      const allImgUrls: { url: string; key: string }[] = [];
      for (const entry of entries) {
        const imgs = imagesByEntry.get(entry.id) || [];
        for (const img of imgs.slice(0, 4)) {
          allImgUrls.push({ url: img.url, key: `${entry.id}_${img.url}` });
        }
      }
      // Process in chunks of 3 to avoid memory issues
      for (let i = 0; i < allImgUrls.length; i += 3) {
        const chunk = allImgUrls.slice(i, i + 3);
        const results = await Promise.all(
          chunk.map(async ({ url, key }) => {
            const dataUri = await fetchImageAsBase64DataUri(url);
            return { key, dataUri };
          })
        );
        for (const { key, dataUri } of results) {
          if (dataUri) imageDataMap.set(key, dataUri);
        }
      }
    }

    for (let idx = 0; idx < entries.length; idx++) {
      const entry = entries[idx];
      const pageNum = idx + 1;
      let contentHtml = "";

      // Title
      contentHtml += `<h2 style="text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; color: #1A2B4A; font-size: 18px;">Relatório Diário de Obra</h2>`;

      // Info block
      const dateParts = entry.data_relato.split("-");
      const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : entry.data_relato;

      contentHtml += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; padding: 16px; border-radius: 4px; background-color: #F8F9FA; font-size: 13px;">
          <div>
            <span style="font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #6B7280;">Obra: </span>
            <span style="font-weight: 500; color: #1A2B4A;">${escapeHtml(client.nome_empreitada)}</span>
          </div>
          <div>
            <span style="font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #6B7280;">Cliente: </span>
            <span style="font-weight: 500; color: #1A2B4A;">${escapeHtml(client.nome_cliente)}</span>
          </div>
          <div>
            <span style="font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #6B7280;">Data: </span>
            <span style="font-weight: 500; color: #1A2B4A;">${dateFormatted}</span>
          </div>
          <div>
            <span style="font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #6B7280;">Relato #: </span>
            <span style="font-weight: 500; color: #1A2B4A;">${idx + 1}</span>
          </div>
        </div>
      `;

      // Weather
      const weather = WEATHER_MAP[entry.condicoes_climaticas];
      if (weather) {
        contentHtml += sectionBlock("Condições Climáticas", `<p style="font-size: 13px;">${weather.icon} ${escapeHtml(weather.label)}</p>`);
      }

      // Equipe
      if (entry.equipe) {
        contentHtml += sectionBlock("Equipe", `<p style="white-space: pre-wrap; font-size: 13px;">${escapeHtml(entry.equipe)}</p>`);
      }

      // Ferramentas
      const toolNames = (entry.ferramentas_ids || []).map((id: string) => toolsMap.get(id) || id);
      if (toolNames.length > 0) {
        const badgesHtml = toolNames.map((name: string) =>
          `<span style="display: inline-block; padding: 2px 8px; background: #E5E7EB; color: #374151; border-radius: 4px; font-size: 12px; margin: 2px;">${escapeHtml(name)}</span>`
        ).join("");
        contentHtml += sectionBlock("Ferramentas Utilizadas", `<div style="display: flex; flex-wrap: wrap; gap: 6px;">${badgesHtml}</div>`);
      }

      // Atividades
      if (entry.atividades_dia) {
        contentHtml += sectionBlock("Atividades do Dia", `<p style="white-space: pre-wrap; font-size: 13px;">${escapeHtml(entry.atividades_dia)}</p>`, true);
      }

      // Observações
      if (entry.observacoes) {
        contentHtml += sectionBlock("Observações Importantes", `<p style="white-space: pre-wrap; font-size: 13px;">${escapeHtml(entry.observacoes)}</p>`, true);
      }

      // Fotos
      const entryImages = imagesByEntry.get(entry.id) || [];
      if (entryImages.length > 0 && includeImages) {
        const isSingle = entryImages.length === 1;
        const slotW = isSingle ? 700 : 340;
        const slotH = isSingle ? 450 : 220;
        const gridStyle = isSingle
          ? "display: flex; justify-content: center;"
          : "display: grid; grid-template-columns: 1fr 1fr; gap: 12px;";

        let imagesInnerHtml = "";
        for (const img of entryImages.slice(0, 4)) {
          const key = `${entry.id}_${img.url}`;
          const dataUri = imageDataMap.get(key);
          if (dataUri) {
            imagesInnerHtml += `
              <div style="width: ${isSingle ? slotW : '100%'}px; height: ${slotH}px; border-radius: 4px; overflow: hidden;">
                <img src="${dataUri}" alt="${escapeHtml(img.filename)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
              </div>
            `;
          } else {
            imagesInnerHtml += `<p style="font-size: 11px; color: #6B7280;">${escapeHtml(img.filename)}: imagem não disponível</p>`;
          }
        }
        contentHtml += sectionBlock("Registros Fotográficos", `<div style="${gridStyle}">${imagesInnerHtml}</div>`);
      } else if (entryImages.length > 0) {
        const linksHtml = entryImages.map(img =>
          `<p style="font-size: 11px; color: #2864B4;">• ${escapeHtml(img.filename || "foto")}: ${escapeHtml(img.url)}</p>`
        ).join("");
        contentHtml += sectionBlock("Registros Fotográficos", linksHtml);
      }

      pagesHtml += renderPage(logoHtml, contentHtml, pageNum, totalPages);
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; background: white; }
    .a4-page {
      width: 794px;
      min-height: 1123px;
      height: 1123px;
      background: white;
      position: relative;
      padding: 32px;
      page-break-after: always;
      overflow: hidden;
    }
    .a4-page:last-child { page-break-after: auto; }
    .a4-page-border {
      position: absolute;
      inset: 8px;
      border: 1.5px solid #1A2B4A;
      pointer-events: none;
      z-index: 1;
    }
    .a4-left-line {
      position: absolute;
      left: 40px;
      top: 86px;
      bottom: 140px;
      width: 2px;
      background: #1A2B4A;
      z-index: 0;
    }
    .a4-footer-diagonal {
      position: absolute;
      bottom: 8px;
      left: 8px;
      width: 80px;
      height: 60px;
      background: #1A2B4A;
      clip-path: polygon(0 0, 0 100%, 100% 100%);
      z-index: 0;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

function renderPage(logoHtml: string, contentHtml: string, pageNum: number, totalPages: number): string {
  return `
    <div class="a4-page">
      <div class="a4-page-border"></div>
      <div class="a4-left-line"></div>
      <div class="a4-footer-diagonal"></div>

      <!-- HEADER -->
      <div style="position: relative; z-index: 10; display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;">
        ${logoHtml}
        <div style="text-align: right;">
          <p style="font-weight: bold; color: #1A2B4A; font-size: 14px;">Baja Engenharia &amp; Construções</p>
          <p style="color: #6B7280; font-size: 11px;">CNPJ: 34.526.647/0001-73</p>
          <div style="margin-top: 8px; border-bottom: 1px solid #D1D5DB;"></div>
        </div>
      </div>

      <!-- CONTENT -->
      <div style="position: relative; z-index: 10; padding-left: 24px; min-height: 725px; overflow: hidden;">
        ${contentHtml}
      </div>

      <!-- FOOTER -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; padding: 0 32px 16px 100px;">
        <p style="color: #9CA3AF; font-size: 10px;">Copacabana | Rio de Janeiro</p>
        <p style="color: #9CA3AF; font-size: 10px;">Rua Ministro de Castro | 15 1118 &nbsp;|&nbsp; www.bajaengenharia.com.br &nbsp;|&nbsp; contato@bajaengenharia.com.br</p>
        <p style="text-align: center; margin-top: 8px; color: #9CA3AF; font-size: 10px;">Página ${pageNum} de ${totalPages}</p>
      </div>
    </div>
  `;
}

async function convertHtmlToPdf(html: string): Promise<ArrayBuffer> {
  const apiKey = Deno.env.get("HTML2PDF_API_KEY");
  if (!apiKey) throw new Error("HTML2PDF_API_KEY não configurada");

  const resp = await fetch("https://api.html2pdf.app/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      html,
      format: "A4",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
      preferCSSPageSize: true,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`html2pdf.app error ${resp.status}: ${errText}`);
  }

  return resp.arrayBuffer();
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
      const html = await generateHtml(reportData, false);
      const pdfBytes = await convertHtmlToPdf(html);

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
        const html = await generateHtml(reportData, true);
        const pdfBytes = await convertHtmlToPdf(html);

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
