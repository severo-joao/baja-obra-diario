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

    // Update last_used_at
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    const url = new URL(req.url);
    const data = url.searchParams.get("data");

    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'data' obrigatório no formato YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: demandas, error } = await supabase
      .from("demandas")
      .select("*")
      .eq("data_notificacao", data)
      .eq("status", "pendente")
      .order("prioridade", { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ demandas: demandas ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
