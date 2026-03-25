

## Plano: Corrigir data do relato exibindo um dia a menos

### Problema
O `data_relato` é salvo como string `"2025-03-21"`. Ao fazer `new Date("2025-03-21")`, JavaScript interpreta como **UTC meia-noite**, que no fuso do Brasil (UTC-3) vira **20 de março às 21h** — um dia antes. Por isso a data aparece errada na listagem.

### Solução
Substituir `new Date(entry.data_relato)` por `new Date(entry.data_relato + "T00:00:00")` em todos os locais, forçando interpretação como horário local.

### Arquivos afetados

1. **`src/pages/ReportsPage.tsx`** (linhas 80, 85) — listagem e sort
2. **`src/pages/Dashboard.tsx`** (linhas 23, 85) — contagem mensal e atividade recente
3. **`src/components/report/ReportEntrySection.tsx`** (linha 45) — visualização do relato
4. **`src/hooks/use-reports.ts`** (sort dos entries) — ordenação

Cada ocorrência de `new Date(e.data_relato)` será trocada por `new Date(e.data_relato + "T00:00:00")`.

