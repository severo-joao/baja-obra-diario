

## Plano: Endpoints para listar obras e exportar relatório em PDF

### Resumo
Dois novos endpoints protegidos por `x-api-key`:
1. **`get-clients`** — lista obras ativas com dados cadastrais
2. **`export-report`** — gera e retorna PDF do relatório de uma obra (por `client_id` + filtros de data)

### 1. Edge Function `get-clients`
- `GET /functions/v1/get-clients?status=ativa` (parâmetro opcional, default: `ativa`)
- Retorna JSON com array de clientes e seus campos cadastrais
- Validação de `x-api-key` (mesmo padrão do `get-demandas`)

**Resposta exemplo:**
```json
{
  "clients": [
    {
      "id": "uuid",
      "nome_cliente": "João Silva",
      "nome_empreitada": "Residencial Mar Azul",
      "endereco_obra": "Rua X, 123",
      "status": "ativa",
      "data_inicio": "2026-01-15",
      "data_prevista_conclusao": "2026-12-30",
      ...
    }
  ]
}
```

### 2. Edge Function `export-report`
- `GET /functions/v1/export-report?client_id=UUID&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD`
- Busca report + entries + images do cliente no período
- Gera PDF server-side usando `jsPDF` (disponível em Deno via ESM)
- Retorna `Content-Type: application/pdf` com o arquivo binário
- O PDF terá layout estruturado com: cabeçalho da empresa, dados da obra/cliente, e cada entry com data, equipe, clima, atividades, observações e URLs das fotos

**Limitação**: Como não há DOM no servidor, o PDF será gerado programaticamente (texto formatado com jsPDF), sem renderizar HTML. O layout será limpo e profissional mas não idêntico pixel-a-pixel ao do frontend.

### 3. Documentação
- Adicionar ambos endpoints na aba Docs da página Documentação com exemplos de uso

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/get-clients/index.ts` | Criar |
| `supabase/functions/export-report/index.ts` | Criar |
| `src/pages/DocumentationPage.tsx` | Adicionar docs dos 2 endpoints |

### Fluxo externo automatizado
1. Chamar `get-clients` → obter lista de obras ativas com IDs
2. Para cada obra, chamar `export-report?client_id=ID&data_inicio=X&data_fim=Y` → receber PDF

