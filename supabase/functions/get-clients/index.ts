import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const status = url.searchParams.get("status") || "ativa";

    let query = supabase
      .from("clients")
      .select("id, nome_cliente, nome_empreitada, endereco_obra, cpf_cnpj, telefone, email, status, data_inicio, data_prevista_conclusao, observacoes, created_at")
      .order("nome_empreitada", { ascending: true });

    if (status !== "todas") {
      query = query.eq("status", status);
    }

    const { data: clients, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ clients: clients ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
