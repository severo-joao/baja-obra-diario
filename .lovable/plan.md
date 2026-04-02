

## Plano: PDF via rota de impressão pública + html2pdf.app

### Resumo
Criar uma rota pública `/report-print?token=TOKEN` que renderiza os mesmos componentes React do frontend. A Edge Function `export-report` gera um token temporário, chama html2pdf.app com a URL dessa rota, e retorna o PDF idêntico ao do frontend.

### Alterações

**1. Migration — tabela `print_tokens`**
```sql
create table print_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  client_id uuid references clients(id),
  date_from date,
  date_to date,
  expires_at timestamptz not null default now() + interval '10 minutes',
  used boolean default false,
  created_at timestamptz default now()
);
alter table print_tokens enable row level security;
create policy "Service role only" on print_tokens for all using (false);
```

**2. `src/pages/ReportPrintPage.tsx`** (novo)
- Rota pública: `/report-print?token=TOKEN`
- Busca `print_tokens` pelo token (via Supabase anon — mas RLS bloqueia, então usar edge function ou RLS com `anon` select)
  - Alternativa mais simples: criar uma Edge Function `validate-print-token` que valida o token com service role e retorna os dados do relatório
- Renderiza `A4ReportPage` + `ReportEntrySection` com a mesma lógica de `pageSlots` do ExportPage
- Página limpa (sem AppLayout, sem sidebar)
- Marca token como `used = true` após renderizar

**Problema de acesso**: RLS `using (false)` bloqueia acesso anon. Duas opções:
- **Opção A**: Criar edge function `validate-print-token` que usa service role para validar token e retornar dados
- **Opção B**: RLS policy que permite SELECT anon com filtro `token = current_setting('request.header.x-token')` — complexo demais

Vou usar **Opção A**: edge function intermediária.

**3. `supabase/functions/validate-print-token/index.ts`** (novo)
- Recebe `?token=TOKEN`
- Valida: existe, não expirado, não usado
- Busca client, report_entries, report_images para o client_id + date_from/date_to
- Marca `used = true`
- Retorna JSON com todos os dados necessários para renderizar

**4. `src/App.tsx`**
- Adicionar rota pública `/report-print` fora do `AuthenticatedRoutes`

**5. `supabase/functions/export-report/index.ts`**
- Remover toda a lógica jsPDF (imports, drawPageFrame, drawHeader, generatePdf, fetchImageAsBase64)
- Novo fluxo:
  1. Inserir registro em `print_tokens` (service role)
  2. Construir URL: `https://baja-obra-diario.lovable.app/report-print?token=TOKEN`
  3. Chamar html2pdf.app API com a URL
  4. Retornar PDF bytes ou salvar no bucket (modo assíncrono)
- Manter lógica existente de validateApiKey, query params, export_jobs

### Fluxo
```text
API call → export-report edge fn
  → INSERT print_tokens (token, client_id, dates)
  → POST html2pdf.app { url: /report-print?token=TOKEN }
    → Browser renderiza ReportPrintPage
      → Chama validate-print-token edge fn
      → Recebe dados, renderiza A4 pages
    → html2pdf.app captura → retorna PDF
  → Retorna PDF ao caller
```

### Arquivos
| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `print_tokens` |
| `supabase/functions/validate-print-token/index.ts` | Novo — validar token e retornar dados |
| `src/pages/ReportPrintPage.tsx` | Novo — página de impressão pública |
| `src/App.tsx` | Adicionar rota `/report-print` |
| `supabase/functions/export-report/index.ts` | Reescrever para usar html2pdf.app + print tokens |

### Riscos
- html2pdf.app free tier pode ter limites de tamanho (problema anterior) — se necessário, usar `wait_for` maior para aguardar imagens
- Latência: browser rendering + screenshot pode levar 10-30s para relatórios grandes

