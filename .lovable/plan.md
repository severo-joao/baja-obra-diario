

## Plano: Exportar relatório direto em PDF (sem diálogo de impressão)

### Problema
O botão atual usa `window.print()`, que abre o diálogo de impressão do navegador. Isso causa quebras de layout e depende do usuário configurar corretamente. O ideal é gerar o PDF diretamente no clique.

### Solução
Usar a biblioteca `jspdf` + `html2canvas` para capturar cada página A4 renderizada e gerar um PDF multi-página automaticamente, fazendo download direto.

### Alterações

**1. Instalar dependências**
- `jspdf` e `html2canvas`

**2. `src/pages/ExportPage.tsx`**
- Substituir `handlePrint` por `handleExportPDF`:
  - Para cada `A4ReportPage` renderizada, usar `html2canvas` para capturar como imagem
  - Adicionar cada imagem como página no `jsPDF` (formato A4, 210x297mm)
  - Chamar `pdf.save("relatorio-OBRA-DATA.pdf")` para download automático
- Adicionar estado `exporting` para mostrar loading no botão durante a geração
- Trocar ícone de `Printer` para `Download` e texto para "Exportar PDF"
- Cada entry renderizada recebe um `ref` ou `data-attribute` para captura individual

**3. `src/components/report/A4ReportPage.tsx`**
- Adicionar `forwardRef` ou `data-page` attribute para facilitar a seleção pelo `html2canvas`

### Fluxo
1. Usuário seleciona obra e período
2. Clica "Exportar PDF"
3. Botão mostra loading ("Gerando PDF...")
4. Cada página A4 é capturada como imagem via `html2canvas`
5. Imagens são montadas em um documento `jsPDF` multi-página
6. Download automático do arquivo PDF

### Técnico
- `html2canvas` captura o DOM exatamente como renderizado, preservando o layout
- `jsPDF` monta o PDF com dimensões A4 (210x297mm)
- Escala de captura: 2x para boa qualidade
- Nenhuma migração de banco necessária

