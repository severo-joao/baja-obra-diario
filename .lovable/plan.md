

## Plano: Paginação de fotos no PDF (frontend + API)

### Resumo
Quando um relato tem muitas fotos, o conteúdo ultrapassa a altura A4. A correção divide entries com muitas fotos em múltiplas páginas.

### Alterações

**1. `src/components/report/A4ReportPage.tsx`**
- Adicionar `height: "1123px"` e `overflow: "hidden"` no div raiz `.a4-page`

**2. `src/components/report/ReportEntrySection.tsx`**
- Adicionar props opcionais `imageOffset?: number` e `maxImages?: number`
- Quando `imageOffset > 0` (página de continuação): omitir todo o texto, mostrar apenas título "Registros Fotográficos" + fatia de fotos
- Quando presentes, fatiar `entry.images` com `.slice(imageOffset, imageOffset + maxImages)`

**3. `src/pages/ExportPage.tsx`**
- Substituir o `map` simples por lógica de `pageSlots`:
  - Primeira página por entry: texto + primeiras 4 fotos
  - Páginas extras: 6 fotos por página
  - `pageNumber` / `totalPages` sequencial global

**4. `supabase/functions/export-report/index.ts`**
- No loop de imagens (~linha 363): remover o `slice(0, 4)` e o fallback de "fotos não exibidas"
- Quando `y + drawH > PH - 40`: chamar `doc.addPage()`, redesenhar frame + header, resetar `y = 40`, continuar inserindo imagens
- Recalcular `totalPages` antes de gerar (contar páginas extras por entry) e corrigir footers em todas as páginas

