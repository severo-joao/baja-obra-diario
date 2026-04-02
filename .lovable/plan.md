

## Plano: Corrigir PDF renderizando página de login

### Causa raiz
A Edge Function `export-report` usa a URL publicada (`https://baja-obra-diario.lovable.app/report-print?token=...`), mas o site publicado ainda não tem a rota `/report-print`. O request cai no wildcard `/*` → `AuthenticatedRoutes` → redireciona para `/auth` (login). O html2pdf.app captura a página de login.

### Solução
**Publicar o projeto** para que a versão publicada inclua a rota `/report-print`.

Alternativamente, se não quiser publicar agora, mudar temporariamente a URL no `export-report` para usar o preview URL:

**Arquivo**: `supabase/functions/export-report/index.ts`
- Linha com `PUBLISHED_URL`: trocar de `https://baja-obra-diario.lovable.app` para o preview URL, ou melhor, publicar o projeto.

### Recomendação
Publicar o projeto é a solução correta. Após publicar, o endpoint funcionará automaticamente.

