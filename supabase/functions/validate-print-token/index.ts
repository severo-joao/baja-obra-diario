import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate token
    const { data: tokenRecord, error: tokenErr } = await supabase
      .from("print_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (tokenErr || !tokenRecord) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou já utilizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check expiration
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark as used
    await supabase
      .from("print_tokens")
      .update({ used: true })
      .eq("id", tokenRecord.id);

    // Fetch client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", tokenRecord.client_id)
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
      .eq("client_id", tokenRecord.client_id)
      .single();

    if (!report) {
      return new Response(
        JSON.stringify({ error: "Relatório não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch entries with date filters
    let entriesQuery = supabase
      .from("report_entries")
      .select("*")
      .eq("report_id", report.id)
      .order("data_relato", { ascending: true });

    if (tokenRecord.date_from) {
      entriesQuery = entriesQuery.gte("data_relato", tokenRecord.date_from);
    }
    if (tokenRecord.date_to) {
      entriesQuery = entriesQuery.lte("data_relato", tokenRecord.date_to);
    }

    const { data: entries } = await entriesQuery;

    // Fetch images
    const { data: images } = await supabase
      .from("report_images")
      .select("*")
      .eq("report_id", report.id);

    // Fetch tools
    const allToolIds = (entries ?? []).flatMap((e: any) => e.ferramentas_ids || []);
    const uniqueToolIds = [...new Set(allToolIds)];
    let tools: any[] = [];
    if (uniqueToolIds.length > 0) {
      const { data: toolsData } = await supabase
        .from("tools")
        .select("id, nome")
        .in("id", uniqueToolIds);
      tools = toolsData ?? [];
    }

    // Group images by entry_id
    const imagesByEntry: Record<string, any[]> = {};
    (images ?? []).forEach((img: any) => {
      if (img.entry_id) {
        if (!imagesByEntry[img.entry_id]) imagesByEntry[img.entry_id] = [];
        imagesByEntry[img.entry_id].push({ id: img.id, url: img.url, filename: img.filename });
      }
    });

    // Attach images to entries
    const entriesWithImages = (entries ?? []).map((entry: any) => ({
      ...entry,
      images: imagesByEntry[entry.id] || [],
    }));

    return new Response(
      JSON.stringify({
        client,
        entries: entriesWithImages,
        tools,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
