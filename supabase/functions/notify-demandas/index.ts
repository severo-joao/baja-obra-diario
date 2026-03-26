import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const hoje = new Date().toISOString().split("T")[0];

    const { data: demandas, error } = await supabase
      .from("demandas")
      .select("*")
      .eq("status", "pendente")
      .lte("data_notificacao", hoje);

    if (error) throw error;

    const results: { id: string; status: number | string }[] = [];

    for (const d of demandas || []) {
      if (!d.webhook_url) continue;

      const actionBase = `${supabaseUrl}/functions/v1/demanda-action?id=${d.id}`;

      const payload = {
        demanda_id: d.id,
        titulo: d.titulo,
        descricao: d.descricao,
        prioridade: d.prioridade,
        data_notificacao: d.data_notificacao,
        sazonal: d.sazonal,
        intervalo_dias: d.intervalo_dias,
        acoes: {
          renovar: `${actionBase}&action=renovar`,
          lembrar_amanha: `${actionBase}&action=lembrar_amanha`,
          aprovar: `${actionBase}&action=aprovar`,
        },
      };

      try {
        const resp = await fetch(d.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        results.push({ id: d.id, status: resp.status });
      } catch (e) {
        results.push({ id: d.id, status: `error: ${e.message}` });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
