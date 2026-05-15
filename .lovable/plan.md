## Problema

A função `notify-demandas` hoje busca demandas com `data_notificacao <= amanhã`, o que inclui todas as demandas pendentes vencidas no passado (ex.: `2026-04-01`).

## Ajuste

Em `supabase/functions/notify-demandas/index.ts`, alterar a query para filtrar **exatamente** a data de amanhã:

- Calcular `amanha` (YYYY-MM-DD)
- Trocar `.lte("data_notificacao", limite)` por `.eq("data_notificacao", amanha)`
- Manter `status = 'pendente'`
- Manter o agrupamento por responsável e o formato atual do payload
- Se não houver demandas, retornar `{ processed: 0, results: [] }` sem disparar webhook (comportamento já existente)

Nenhuma outra mudança no payload, agrupamento ou logs.
