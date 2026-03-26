

## Plano: Endpoint para buscar demandas por data

### Resumo
Criar uma nova Edge Function `get-demandas` que recebe um parâmetro `data` (formato `YYYY-MM-DD`) e retorna as demandas pendentes daquele dia em JSON.

### Alterações

**1. Nova Edge Function `supabase/functions/get-demandas/index.ts`**
- Aceita GET com query param `data` (ex: `?data=2026-03-26`)
- Consulta tabela `demandas` filtrando `data_notificacao = data` e `status = 'pendente'`
- Retorna JSON com array de demandas encontradas
- CORS headers padrão
- Usa `SUPABASE_SERVICE_ROLE_KEY` para acesso completo

**2. Documentação (`src/pages/DocumentationPage.tsx`)**
- Adicionar seção documentando o endpoint `get-demandas` com exemplo de chamada e resposta

### Exemplo de uso
```
GET /functions/v1/get-demandas?data=2026-03-26

Response:
{
  "demandas": [
    { "id": "...", "titulo": "...", "prioridade": "alta", ... }
  ]
}
```

