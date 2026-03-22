

## Plano: Conter imagens dentro da página A4 na exportação

### Problema
As imagens dos registros fotográficos estão ultrapassando os limites da página A4 durante a exportação PDF. Isso acontece porque:

1. O `maxHeight` das imagens (460px / 280px) pode exceder o espaço disponível na página
2. O conteúdo da página A4 tem `overflow: hidden` no print, mas as imagens são grandes demais e ficam cortadas ou vazam
3. Não há limitação relativa ao espaço real disponível dentro da área de conteúdo

### Correções

**1. `src/components/report/ReportEntrySection.tsx`**
- Reduzir o `maxHeight` das imagens para valores mais seguros que caibam dentro do espaço disponível na página A4
- Imagem única: reduzir de 460px para ~340px
- Múltiplas imagens (grid 2 colunas): reduzir de 280px para ~200px
- Adicionar `max-width: 100%` e `object-fit: contain` explicitamente para garantir que nenhuma imagem ultrapasse horizontalmente

**2. `src/index.css`** — Adicionar regra de print para imagens:
- Forçar `img` dentro de `.a4-page` a respeitar `max-width: 100%` e `max-height` seguro no contexto de impressão
- Garantir que o container de fotos não force overflow

**3. `src/components/report/A4ReportPage.tsx`**
- Alterar o container de conteúdo para usar `overflow: hidden` visualmente, evitando vazamento no preview e no print

### Resultado
Imagens ficam contidas dentro dos limites da página A4 tanto no preview quanto na exportação PDF.

