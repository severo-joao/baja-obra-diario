

## Plano: PDF via HTML renderizado server-side

### Problema
O endpoint `export-report` usa jsPDF com primitivas de desenho, produzindo resultado visualmente diferente do frontend (que usa html2canvas sobre componentes React estilizados).

### Solução
Substituir `generatePdf()` por uma função `generateHtml()` que constrói um HTML auto-contido replicando exatamente o layout dos componentes `A4ReportPage` + `ReportEntrySection`. Depois, converter esse HTML em PDF usando uma API externa (html2pdf.app ou similar).

### Alterações em `supabase/functions/export-report/index.ts`

**1. Nova função `generateHtml(data, includeImages)`**
- Gera string HTML completa com `<style>` inline replicando todas as classes CSS do frontend:
  - `.a4-page` (794px × 1123px, fundo branco, fonte Inter/sans-serif)
  - `.a4-page-border` (borda navy 1.5px, inset 8px)
  - `.a4-left-line` (linha vertical esquerda em #1A2B4A)
  - `.a4-footer-diagonal` (triângulo navy via clip-path)
  - Header: logo (imagem base64 à esquerda), nome empresa + CNPJ à direita
  - Footer: endereço + paginação
  - Seções: títulos uppercase, badges para ferramentas, borda laranja accent para atividades/observações
  - Grid de fotos: container fixo (single: 700×450px, grid: 340×220px) com `object-fit: cover`
- Imagens embutidas como base64 data URIs (se `includeImages`)
- Logo buscado uma vez e reutilizado em todas as páginas
- Cada entry = uma "página" A4 no HTML

**2. Conversão HTML → PDF**
- Usar API `https://api.html2pdf.app/v1/generate` (ou alternativa como Browserless)
- Requer API key — será adicionada como secret `HTML2PDF_API_KEY`
- Enviar HTML como body, receber PDF binary
- Parâmetros: format A4, margins 0, print background true

**3. Manter toda lógica existente intacta**
- `fetchReportData`, `validateApiKey`, polling, job async — sem alteração
- Apenas `generatePdf()` é substituído por `generateHtml()` + chamada à API de conversão
- O fluxo sync (sem imagens) e async (com imagens) continuam funcionando igual

### Dependência externa
- Secret `HTML2PDF_API_KEY` precisa ser configurada
- A API html2pdf.app tem plano gratuito limitado; alternativas: Browserless, PDFShift

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/export-report/index.ts` | Reescrever `generatePdf` → `generateHtml` + chamada API |

### Fluxo
1. Edge function busca dados (sem mudança)
2. `generateHtml()` monta HTML auto-contido com CSS inline + imagens base64
3. HTML é enviado para API html2pdf → recebe PDF binary
4. PDF é retornado (sync) ou salvo no bucket (async)

