import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUBLISHED_URL = "https://baja-obra-diario.lovable.app";

// ─── Helpers ───

async function validateApiKey(supabase: any, apiKey: string | null) {
  if (!apiKey) throw { status: 401, message: "Header x-api-key é obrigatório" };
  const { data: keyRecord, error: keyErr } = await supabase
    .from("api_keys").select("id").eq("key", apiKey).eq("active", true).single();
  if (keyErr || !keyRecord) throw { status: 401, message: "API key inválida ou inativa" };
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);
}

async function createPrintToken(
  supabase: any,
  clientId: string,
  dateFrom: string | null,
  dateTo: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from("print_tokens")
    .insert({
      client_id: clientId,
      date_from: dateFrom,
      date_to: dateTo,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .select("token")
    .single();

  if (error || !data) throw new Error("Erro ao criar token de impressão: " + (error?.message || ""));
  return data.token;
}

async function generatePdfViaHtml2Pdf(printUrl: string): Promise<ArrayBuffer> {
  const apiKey = Deno.env.get("HTML2PDF_API_KEY");
  if (!apiKey) throw new Error("HTML2PDF_API_KEY não configurada");

  const resp = await fetch("https://api.html2pdf.app/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authentication: apiKey,
    },
    body: JSON.stringify({
      url: printUrl,
      landscape: false,
      paper_size: "a4",
      margin_top: 0,
      margin_bottom: 0,
      margin_left: 0,
      margin_right: 0,
      wait_for: 5000,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`html2pdf.app retornou ${resp.status}: ${errText}`);
  }

  return resp.arrayBuffer();
}

// ─── Data fetching (for sync/no-images fallback) ───

async function fetchClientName(supabase: any, clientId: string): Promise<string> {
  const { data: client } = await supabase
    .from("clients").select("nome_empreitada").eq("id", clientId).single();
  return client?.nome_empreitada || "relatorio";
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

    // Both sync and async now use html2pdf.app via print token

    // === SYNC MODE ===
    if (!includeImages) {
      const token = await createPrintToken(supabase, clientId, dataInicio, dataFim);
      const printUrl = `${PUBLISHED_URL}/report-print?token=${token}`;
      const pdfBytes = await generatePdfViaHtml2Pdf(printUrl);
      const clientName = await fetchClientName(supabase, clientId);

      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="relatorio-${clientName.replace(/\s+/g, "_")}.pdf"`,
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

    const bgPromise = (async () => {
      try {
        const token = await createPrintToken(supabase, clientId, dataInicio, dataFim);
        const printUrl = `${PUBLISHED_URL}/report-print?token=${token}`;
        const pdfBytes = await generatePdfViaHtml2Pdf(printUrl);

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

    // @ts-ignore
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
