

## Plano: Corrigir aspecto das imagens no PDF exportado

### Alterações

**1. `src/components/report/ReportEntrySection.tsx`**
- Substituir o bloco de renderização de imagens para usar container com altura fixa e `objectFit: "cover"`, garantindo que `html2canvas` capture dimensões corretas

**2. `src/pages/ExportPage.tsx`**
- Adicionar `imageTimeout: 0` nas opções do `html2canvas` para garantir que imagens estejam carregadas antes da renderização

