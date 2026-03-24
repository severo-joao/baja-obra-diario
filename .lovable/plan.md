

## Problema

O botão "Testar" do webhook apenas cria um registro de log no banco de dados. Ele **nunca faz uma requisição HTTP** para a URL do webhook. O `handleTest` só chama `createLog.mutateAsync()` com status 200 hardcoded, sem enviar nada.

## Solução

Criar uma Edge Function `fire-webhook` que recebe o webhook ID, busca a URL e event_type, faz o POST real para a URL externa com o payload, e registra o resultado (status code) na tabela `webhook_logs`.

### Alterações

**1. Criar `supabase/functions/fire-webhook/index.ts`**
- Recebe `{ webhook_id, payload }` no body
- Valida autenticação via JWT
- Busca o webhook no banco (URL, event_type, active)
- Faz `fetch(url, { method: "POST", headers, body: payload })`
- Registra o resultado na tabela `webhook_logs` com o status_code real
- Retorna sucesso/erro

**2. Atualizar `src/pages/DocumentationPage.tsx`**
- Alterar `handleTest` para chamar a edge function `fire-webhook` via `supabase.functions.invoke("fire-webhook", { body: { webhook_id, payload } })`
- Mostrar o status code real retornado no toast

### Detalhes técnicos
- A edge function usa service role key para acessar as tabelas
- Headers enviados ao webhook: `Content-Type: application/json`, `X-Webhook-Event`, `X-Webhook-Timestamp`
- Se o fetch falhar (URL inválida, timeout), registra status_code 0 ou o erro

