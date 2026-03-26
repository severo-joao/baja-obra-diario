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
    const url = new URL(req.url);
    const demandaId = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // renovar | lembrar_amanha | aprovar

    if (!demandaId || !action) {
      return new Response("<h1>Parâmetros inválidos</h1>", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: demanda, error: fetchErr } = await supabase
      .from("demandas")
      .select("*")
      .eq("id", demandaId)
      .single();

    if (fetchErr || !demanda) {
      return new Response("<h1>Demanda não encontrada</h1>", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const now = new Date();
    let updateData: Record<string, unknown> = { updated_at: now.toISOString() };
    let message = "";

    if (action === "renovar") {
      const dias = demanda.sazonal && demanda.intervalo_dias ? demanda.intervalo_dias : 30;
      const novaData = new Date(now.getTime() + dias * 86400000);
      updateData.data_notificacao = novaData.toISOString().split("T")[0];
      updateData.status = "pendente";
      message = `Demanda renovada. Próxima notificação: ${updateData.data_notificacao}`;
    } else if (action === "lembrar_amanha") {
      const amanha = new Date(now.getTime() + 86400000);
      updateData.data_notificacao = amanha.toISOString().split("T")[0];
      message = `Lembrete agendado para ${updateData.data_notificacao}`;
    } else if (action === "aprovar") {
      updateData.status = "aprovada";
      message = "Demanda aprovada com sucesso!";
    } else {
      return new Response("<h1>Ação inválida</h1>", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const { error: updErr } = await supabase
      .from("demandas")
      .update(updateData)
      .eq("id", demandaId);

    if (updErr) throw updErr;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Demanda</title>
      <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5}
      .card{background:white;padding:2rem;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.1);text-align:center;max-width:400px}
      h1{color:#1A2B4A;font-size:1.5rem}p{color:#666}</style></head>
      <body><div class="card"><h1>✅ ${message}</h1><p><strong>${demanda.titulo}</strong></p></div></body></html>`;

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return new Response(`<h1>Erro interno</h1><p>${e.message}</p>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
