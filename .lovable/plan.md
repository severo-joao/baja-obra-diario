

## Plano: Mover webhook de demandas para a página Documentação

### Resumo
Remover o campo `webhook_url` do cadastro individual de demandas e usar um webhook centralizado registrado na página Documentação com o event type `demanda.vencida`.

### Alterações

**1. Página Documentação (`src/pages/DocumentationPage.tsx`)**
- Adicionar `demanda.vencida` ao array `EVENT_TYPES` com label "Demanda Vencida"
- Adicionar payload de exemplo em `samplePayloads` mostrando os dados da demanda + URLs de ação

**2. Página Demandas (`src/pages/DemandasPage.tsx`)**
- Remover campo `webhook_url` do formulário de criação/edição
- Remover `webhook_url` do `DemandaForm` interface e `emptyForm`

**3. Tipo Demanda (`src/lib/types.ts`)**
- Manter `webhook_url` no tipo (coluna ainda existe no banco), mas tornar opcional

**4. Hook `use-demandas.ts`**
- Não enviar `webhook_url` no create/update (ou enviar string vazia)

**5. Edge Function `notify-demandas/index.ts`**
- Em vez de usar `d.webhook_url` de cada demanda, buscar todos os webhooks ativos com `event_type = 'demanda.vencida'` da tabela `webhooks`
- Para cada demanda vencida, enviar POST para **todos** os webhooks registrados com esse event type
- Registrar logs na tabela `webhook_logs`

**6. Migração SQL**
- Tornar coluna `webhook_url` nullable/opcional (já tem default `''`, nenhuma mudança necessária no banco)

### Fluxo resultante
1. Usuário registra webhook com evento "Demanda Vencida" na página Documentação → URL salva na tabela `webhooks`
2. Cron diário executa `notify-demandas` → busca demandas pendentes vencidas + webhooks ativos do tipo `demanda.vencida`
3. Envia POST para cada webhook com dados de cada demanda

