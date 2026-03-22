

## Plano: Campo de obra condicional ao status "Em uso"

### O que muda

Quando o usuário selecionar status **"Em uso"** no formulário de cadastro/edição de ferramenta, um campo Select aparece para escolher a obra (cliente) na qual a ferramenta está sendo usada. Para outros status, o campo fica oculto.

### Alterações

**1. Migração de banco — adicionar coluna `client_id` na tabela `tools`**
- `ALTER TABLE tools ADD COLUMN client_id uuid DEFAULT NULL;`
- Nullable, sem foreign key para `auth.users` (é referência a `clients`)

**2. `src/lib/types.ts`** — adicionar `client_id?: string | null` à interface `Tool`

**3. `src/pages/ToolsPage.tsx`**
- Importar `useClients` para obter lista de obras
- No formulário (Dialog), após o Select de Status: renderizar condicionalmente (quando `form.status === 'em_uso'`) um Select com as obras ativas
- Adicionar `client_id: null` ao `emptyTool`
- Quando status mudar para algo diferente de `em_uso`, limpar `client_id`
- No card da ferramenta, mostrar o nome da obra quando status for "em_uso"

**4. `src/hooks/use-tools.ts`** — sem mudanças necessárias (já usa `select("*")` e tipos parciais)

### Resultado
- Status "Em uso" exige seleção de obra
- Status "Disponível" ou "Manutenção" não mostra o campo
- A obra associada aparece no card da ferramenta

