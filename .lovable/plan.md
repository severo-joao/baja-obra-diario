

## Plano: PDF com imagens via processamento assíncrono

### Problema
Edge Functions têm limite de CPU (~2s). Baixar e converter imagens para base64 estoura esse limite, causando "CPU Time exceeded".

### Solução
Dividir em duas etapas:

1. **Chamada inicial** (`export-report` com `include_images=true`) → cria um registro na tabela `export_jobs` com status `processing`, inicia o processamento em background via `EdgeRuntime.waitUntil()`, e retorna imediatamente o `job_id`
2. **Polling** (`export-report?job_id=XXX`) → o cliente consulta o status do job. Quando `completed`, retorna a URL do PDF armazenado no storage

### Alterações

**1. Migração SQL — tabela `export_jobs` + bucket `export-pdfs`**
```sql
CREATE TABLE public.export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'processing', -- processing, completed, failed
  client_id uuid REFERENCES public.clients(id),
  file_path text,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- Bucket para armazenar os PDFs gerados
INSERT INTO storage.buckets (id, name, public) VALUES ('export-pdfs', 'export-pdfs', true);
```

**2. Reescrever `supabase/functions/export-report/index.ts`**

Novo fluxo:
- Se `include_images=true`: cria job → usa `EdgeRuntime.waitUntil()` para processar em background (baixar imagens, gerar PDF, salvar no bucket `export-pdfs`) → retorna `{ job_id, status: "processing" }`
- Se `job_id` presente: consulta status do job → se completed, retorna `{ status: "completed", download_url: "..." }`
- Se `include_images` não é `true`: gera PDF sem imagens e retorna diretamente (comportamento atual)

O processamento em background:
1. Baixa cada imagem sequencialmente
2. Gera o PDF com `jsPDF` (layout A4 completo)
3. Faz upload do PDF para `storage/export-pdfs/{job_id}.pdf`
4. Atualiza o job para `completed` com o `file_path`
5. Se falhar, marca como `failed` com mensagem de erro

**3. Atualizar documentação**
- Explicar o fluxo assíncrono com exemplos de polling

### Fluxo de uso externo
```
# 1. Iniciar exportação
POST /export-report?client_id=X&include_images=true
→ { "job_id": "abc-123", "status": "processing" }

# 2. Verificar status (polling a cada 3-5s)
GET /export-report?job_id=abc-123
→ { "status": "processing" }
→ { "status": "completed", "download_url": "https://...export-pdfs/abc-123.pdf" }
```

### Arquivos
| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabela `export_jobs` + bucket |
| `supabase/functions/export-report/index.ts` | Reescrever com fluxo assíncrono |
| `src/pages/DocumentationPage.tsx` | Documentar fluxo async |

