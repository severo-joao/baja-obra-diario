

## Plano: Redesign do Layout A4 — Letterhead Oficial BAJA

### Resumo
Redesenhar completamente o layout `.a4-page` nos componentes `ReportViewerPage` e `ExportPage`, além do CSS em `index.css`, para replicar o papel timbrado oficial da BAJA com header, borda lateral, footer decorativo e formatação profissional.

### Arquivos Alterados

**1. `src/index.css`** — Reescrever `.a4-page` e estilos de impressão:
- Dimensões fixas: 794px × 1123px com borda navy 1.5px inset 8px
- `::before` pseudo-element para a linha vertical esquerda (2px, #1A2B4A) do header ao footer
- `page-break-after: always` para múltiplas páginas
- Print stylesheet escondendo tudo exceto `.a4-page`

**2. `src/components/report/A4ReportPage.tsx`** (novo) — Componente reutilizável do layout A4:
- **Header**: Logo "B" em caixa navy 70×70px (esquerda) + "Baja Engenharia & Construções" e CNPJ (direita) + separador
- **Linha vertical esquerda**: 2px navy contínua pela margem esquerda
- **Conteúdo**: Slot para children com as seções formatadas
- **Footer**: Forma diagonal navy no canto inferior esquerdo (clip-path), texto de contato, "Página X de Y"
- **Borda**: Moldura navy 1.5px com 8px de inset

**3. `src/components/report/ReportEntrySection.tsx`** (novo) — Componente para cada relato diário:
- Título "RELATÓRIO DIÁRIO DE OBRA" centralizado, bold, navy
- Info block: Obra, Cliente, Data, Responsável
- Seção Clima com ícone
- Seção Equipe
- Seção Ferramentas como badges/tags
- Seção Atividades com borda esquerda laranja 3px (#E87722)
- Seção Observações com borda esquerda laranja 3px
- Seção Fotos em grid 2 colunas com bordas sutis

**4. `src/pages/ReportViewerPage.tsx`** — Usar o novo `A4ReportPage` + `ReportEntrySection`, cada entrada como uma página A4 separada

**5. `src/pages/ExportPage.tsx`** — Mesmo layout, cada relato filtrado renderizado em sua própria página A4

### Detalhes do Footer
```text
┌──────────────────────────────┐
│  ╲                           │  ← clip-path diagonal navy ~80×60px
│   ╲__________________________│
│ Copacabana | Rio de Janeiro  │
│ Rua Ministro... | www...     │
│       Página X de Y          │
└──────────────────────────────┘
```

### Detalhes CSS
- `.a4-page` com `position: relative`, dimensões fixas em px
- Borda decorativa via box com `outline` ou dupla borda (inset 8px)
- Diagonal do footer via `clip-path: polygon(0 0, 0 100%, 80px 100%)`
- `@media print` — `size: A4`, esconde `.no-print`, remove box-shadow

