

## Plano: Corrigir formatação de páginas na exportação/impressão PDF

### Problema
Ao usar `window.print()`, as páginas A4 não estão sendo formatadas corretamente. Os problemas são:

1. **Posicionamento**: A regra `body * { visibility: hidden }` + `.a4-page { visibility: visible }` não garante posicionamento correto — os elementos `.a4-page` ficam presos dentro do layout do app (sidebar, padding, etc.)
2. **Tamanho fixo**: As páginas usam `min-height: 1123px` mas o conteúdo pode ultrapassar, quebrando a formatação
3. **Elementos do layout**: Sidebar e header do app não são escondidos corretamente
4. **Páginas múltiplas**: Cada `.a4-page` precisa ocupar exatamente uma folha A4 no PDF

### Arquivos Alterados

**1. `src/index.css`** — Reescrever regras `@media print`:
- Usar `display: none` (em vez de `visibility: hidden`) para todo conteúdo fora das páginas A4
- Posicionar `.a4-page` como blocos de nível superior com `position: relative`, `width/height` fixos em A4
- Forçar `page-break-inside: avoid` e `page-break-after: always`
- Esconder sidebar, header, e controles do app
- Garantir que `.a4-page` ocupe exatamente 100% da folha A4
- Remover `overflow: hidden` que pode cortar conteúdo

**2. `src/components/report/A4ReportPage.tsx`** — Ajustar:
- Usar `height: 1123px` fixo (não `min-height`) para garantir uma página por folha
- Adicionar `overflow: hidden` no preview para evitar que conteúdo extrapole visualmente
- Conteúdo que ultrapasse deve ser tratado na seção de entries (não aqui)

**3. `src/components/report/ReportEntrySection.tsx`** — Sem mudanças estruturais, apenas garantir que imagens respeitem o espaço disponível

### Detalhes CSS Print

```css
@media print {
  @page { size: A4; margin: 0; }
  
  /* Esconder TUDO do app */
  body > * { display: none !important; }
  
  /* Container das páginas A4 visível */
  #print-area { display: block !important; }
  
  .a4-page {
    display: block !important;
    position: relative;
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 32px;
    box-shadow: none;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
  }
}
```

**Abordagem alternativa (mais confiável)**: Em vez de lutar com visibilidade CSS, criar um wrapper `#print-area` que envolve apenas as páginas A4, e no print stylesheet esconder `body > *:not(#print-area)`. Isso é mais simples e confiável.

### Implementação

O fluxo será:
1. ExportPage e ReportViewerPage renderizam as páginas A4 dentro de um `div#print-area`
2. O print CSS esconde todo o resto e mostra apenas `#print-area`
3. Cada `.a4-page` usa dimensões em `mm` (210mm × 297mm) no contexto de impressão para alinhar perfeitamente com A4

