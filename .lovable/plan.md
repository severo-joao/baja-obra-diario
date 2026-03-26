

## Plano: Disparar webhooks automaticamente ao criar/atualizar relatórios

### Problema
Os hooks de relatório (`useCreateEntry`, `useUpdateEntry`, `useGetOrCreateReport`) salvam dados no banco mas nunca chamam os webhooks registrados. O botão "Testar" na Documentação envia apenas payloads de exemplo.

### Solução
Após cada operação de criação/atualização de relatório, chamar a edge function `fire-webhook` para todos os webhooks ativos do event type correspondente.

### Alterações

**1. `src/hooks/use-reports.ts`**
- Importar `supabase` (já importado)
- No `useGetOrCreateReport`: após criar um novo relatório, buscar webhooks ativos com `event_type = 'relatorio.criado'` e chamar `fire-webhook` para cada um, enviando os dados reais do relatório
- No `useCreateEntry` e `useUpdateEntry`: após salvar, buscar webhooks ativos com `event_type = 'relatorio.atualizado'` e chamar `fire-webhook` para cada um com dados reais da entry

**2. Criar função utilitária `src/lib/webhook-utils.ts`**
- Função `fireWebhooksForEvent(eventType, payload)` que:
  1. Consulta tabela `webhooks` filtrando por `event_type` e `active = true`
  2. Para cada webhook encontrado, chama `supabase.functions.invoke('fire-webhook', { body: { webhook_id, payload } })`
  3. Erros são silenciosos (não bloqueia a operação principal)

**3. Integração nos mutations**
- `useGetOrCreateReport` → dispara `relatorio.criado` (só quando cria novo, não quando encontra existente)
- `useCreateEntry` → dispara `relatorio.atualizado` com dados da entry criada
- `useUpdateEntry` → dispara `relatorio.atualizado` com dados da entry atualizada

### Fluxo resultante
1. Usuário cria relatório → dados salvos no banco → webhooks `relatorio.criado` disparados automaticamente
2. Usuário adiciona/edita entry → dados salvos → webhooks `relatorio.atualizado` disparados
3. Logs registrados automaticamente na tabela `webhook_logs` pela edge function

