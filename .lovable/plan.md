

## Plano: PDF nativo com jsPDF na Edge Function

### Resumo
Substituir html2pdf.app por geração nativa de PDF usando jsPDF diretamente na Edge Function `export-report`. A função busca os dados do banco e constrói o PDF programaticamente, replicando o layout A4 (bordas navy, logo, header, footer, seções de texto, grid de imagens).

### Alterações

**1. `supabase/functions/export-report/index.ts` — Reescrever geração de PDF**

- Remover `generatePdfViaHtml2Pdf`, `createPrintToken`, constante `PUBLISHED_URL`
- Importar jsPDF de `https://esm.sh/jspdf@2.5.2`
- Criar função `generatePdfNative(supabase, clientId, dateFrom, dateTo)` que:
  1. Busca client, report, entries (com filtros de data), images, tools (mesma lógica que `validate-print-token`)
  2. Cria doc jsPDF A4 portrait
  3. Para cada entry, desenha:
     - Frame decorativo (borda navy #1A2B4A, linha vertical esquerda, diagonal footer)
     - Header com nome da empresa, CNPJ
     - Título "Relatório Diário de Obra"
     - Bloco info (Obra, Cliente, Data, Relato #)
     - Condições Climáticas, Equipe, Ferramentas, Atividades, Observações
     - Até 4 imagens na primeira página (fetch das URLs, embed como JPEG)
     - Páginas de continuação com até 6 imagens em grid 2x3
  4. Footer com endereço + "Página X de Y"
  5. Recalcula totalPages antes de gerar (2 passes: primeiro conta páginas, depois desenha)

- Manter toda a lógica existente de `validateApiKey`, parâmetros de query, modo síncrono/assíncrono com `export_jobs`
- Remover dependência do secret `HTML2PDF_API_KEY`

**2. Buscar imagens como base64**
- Para cada imagem, fazer `fetch(img.url)` → `arrayBuffer` → converter para base64 data URI
- Inserir no jsPDF com `doc.addImage()`
- Tratar falhas de fetch graciosamente (pular imagem se falhar)

**3. Layout no jsPDF (dimensões em mm, A4 = 210x297)**
- Margem: ~11mm (32px/3)
- Borda navy: rect stroke inset ~3mm
- Linha vertical esquerda: x=19mm, de y=11mm até y=286mm
- Content area: x=19mm+8mm=27mm, largura útil ~170mm
- Font sizes mapeados de px para pt (fontSize 18px → ~13pt, 13px → ~10pt, 11px → ~8pt)
- Cores: navy #1A2B4A, cinza #6B7280, laranja #E87722
- Imagens: grid 2 colunas, largura ~83mm cada, altura proporcional ou fixa ~53mm (200px equiv)

### O que NÃO muda
- Endpoint URL e parâmetros (`client_id`, `data_inicio`, `data_fim`, `include_images`, `job_id`)
- Autenticação via `x-api-key`
- Modo assíncrono com `export_jobs` e storage `export-pdfs`
- Frontend `ExportPage.tsx` continua usando html2canvas (funciona bem)
- Rota `/report-print` e `validate-print-token` permanecem (podem ser úteis no futuro)

### Riscos
- Layout jsPDF não será pixel-perfect comparado ao frontend (fontes diferentes, sem CSS), mas será consistente e profissional
- Imagens grandes podem aumentar o tempo de processamento — timeout de Edge Function (max ~150s) pode ser atingido em relatórios muito grandes

