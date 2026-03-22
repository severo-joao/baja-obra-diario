

## Plano: Eliminar primeira página em branco na exportação PDF

### Causa
A regra `#root > * > * > * > *` com `display: contents` só atinge 4 níveis de profundidade, mas a árvore React tem muito mais níveis entre `#root` e `#print-area` (SidebarProvider, BrowserRouter, Routes, etc.). Os wrappers intermediários que não são atingidos mantêm seu layout (flex, padding, min-height) e geram uma página em branco antes do conteúdo real.

Além disso, o elemento `<main>` tem padding (`p-4 md:p-6 lg:p-8`) que pode contribuir para o espaço extra.

### Correção

**Arquivo: `src/index.css`** — Substituir a abordagem de 4 níveis por uma mais robusta:

1. Remover a regra `#root > * > * > * > *` (limitada a 4 níveis)
2. Usar seletores que atinjam TODOS os elementos entre `body` e `#print-area`:
   - `body *:not(#print-area):not(#print-area *)` recebe `display: none !important`
   - Mas os ancestrais de `#print-area` precisam permanecer visíveis: usar `#print-area` ancestors via `:has(#print-area)` para manter `display: block` sem padding/margin
3. Alternativa mais simples e compatível: marcar `<main>` e o wrapper `div.space-y-6` com regras específicas de print que removam padding/margin e usem `display: block`

Abordagem escolhida (mais confiável):
```css
@media print {
  /* Esconder sidebar, header, controles */
  .no-print, header, nav, [data-sidebar], [data-sidebar-rail] {
    display: none !important;
  }

  /* Reset body e root */
  body, #root {
    background: white !important;
    margin: 0 !important; padding: 0 !important;
    width: 100% !important; min-height: 0 !important;
    overflow: visible !important;
    display: block !important;
  }

  /* Todos os wrappers intermediários viram transparentes */
  #root *, body * {
    /* Não podemos esconder tudo, então usamos :has() */
  }

  /* Ancestrais do print-area: sem padding, sem flex, bloco simples */
  *:has(> #print-area),
  *:has(> *:has(> #print-area)),
  *:has(> *:has(> *:has(> #print-area))) {
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    min-height: 0 !important;
    border: none !important;
  }

  /* #print-area e páginas A4 mantêm regras existentes */
}
```

A chave é usar CSS `:has()` para identificar automaticamente os ancestrais de `#print-area` e remover seu padding/flex/margin, independente de quantos níveis existam.

### Arquivos
- `src/index.css` — reescrever seção `@media print`

