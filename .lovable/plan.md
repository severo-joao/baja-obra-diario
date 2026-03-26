

## Plano: Sistema de API Keys na Documentação

### Resumo
Criar uma tabela `api_keys` para que o usuário possa gerar, visualizar e revogar chaves de API personalizadas. As edge functions públicas (`get-demandas`, `demanda-action`) passarão a validar essas chaves no header `x-api-key` em vez de depender diretamente da anon key.

### Alterações

**1. Migração SQL — tabela `api_keys`**
```sql
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  key text NOT NULL DEFAULT ('baja_' || replace(gen_random_uuid()::text, '-', '')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keys" ON public.api_keys
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

**2. Nova aba "API Keys" na página Documentação (`src/pages/DocumentationPage.tsx`)**
- Adicionar aba com ícone de chave entre Webhooks e Documentação
- Formulário: campo "Nome da chave" + botão "Gerar"
- Lista de chaves existentes com: nome, chave (parcialmente oculta com botão copiar), data de criação, status ativo/inativo, botão revogar
- Ao gerar, mostrar a chave completa apenas uma vez com destaque

**3. Hook `src/hooks/use-api-keys.ts`**
- CRUD: `useApiKeys()`, `useCreateApiKey()`, `useDeleteApiKey()`, `useToggleApiKey()`
- Queries na tabela `api_keys`

**4. Atualizar edge functions para validar `x-api-key`**
- `get-demandas/index.ts` e `demanda-action/index.ts`: verificar header `x-api-key`, buscar na tabela `api_keys` se está ativo, rejeitar com 401 se inválido
- Atualizar `last_used_at` a cada uso válido

**5. Atualizar documentação (aba Docs)**
- Seção "Autenticação" explicando como usar o header `x-api-key`
- Exemplo de chamada com a chave

### Fluxo
1. Usuário gera API key na aba "API Keys" → chave salva no banco
2. Usuário copia a chave e usa no header `x-api-key` das chamadas
3. Edge functions validam a chave antes de processar a requisição
4. Usuário pode revogar chaves a qualquer momento

