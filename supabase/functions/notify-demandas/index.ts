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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const hoje = new Date().toISOString().split("T")[0];

    // Buscar demandas vencidas
    const { data: demandas, error } = await supabase
      .from("demandas")
      .select("*")
      .eq("status", "pendente")
      .lte("data_notificacao", hoje);

    if (error) throw error;
    if (!demandas?.length) {
      return new Response(JSON.stringify({ processed: 0, results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar webhooks ativos do tipo demanda.vencida
    const { data: webhooks, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("event_type", "demanda.vencida")
      .eq("active", true);

    if (whError) throw whError;
    if (!webhooks?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "Nenhum webhook ativo para demanda.vencida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { demanda_id: string; webhook_id: string; status: number | string }[] = [];

    for (const d of demandas) {
      const actionBase = `${supabaseUrl}/functions/v1/demanda-action?id=${d.id}`;

      const payload = {
        event: "demanda.vencida",
        timestamp: new Date().toISOString(),
        data: {
          id: d.id,
          titulo: d.titulo,
          descricao: d.descricao,
          prioridade: d.prioridade,
          data_notificacao: d.data_notificacao,
          sazonal: d.sazonal,
          intervalo_dias: d.intervalo_dias,
        },
        acoes: {
          renovar: `${actionBase}&action=renovar`,
          lembrar_amanha: `${actionBase}&action=lembrar_amanha`,
          aprovar: `${actionBase}&action=aprovar`,
        },
      };

      for (const wh of webhooks) {
        try {
          const resp = await fetch(wh.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Event": "demanda.vencida",
              "X-Webhook-Timestamp": new Date().toISOString(),
            },
            body: JSON.stringify(payload),
          });

          // Log the call
          await supabase.from("webhook_logs").insert({
            webhook_id: wh.id,
            event_type: "demanda.vencida",
            status_code: resp.status,
            payload: JSON.stringify(payload),
          });

          results.push({ demanda_id: d.id, webhook_id: wh.id, status: resp.status });
        } catch (e) {
          await supabase.from("webhook_logs").insert({
            webhook_id: wh.id,
            event_type: "demanda.vencida",
            status_code: 0,
            payload: JSON.stringify(payload),
          });
          results.push({ demanda_id: d.id, webhook_id: wh.id, status: `error: ${e.message}` });
        }
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
