## Plano: Concluir demandas + Filtros no Kanban

### 1. Marcar como "realizada" / "não realizada"

Reaproveitar o campo `status` existente na tabela `demandas` (já tem `'pendente' | 'aprovada'`), adicionando o valor **`'concluida'`**. Uma demanda concluída fica com visual atenuado (opacidade + risco no título) mas continua na sua coluna do Kanban (o usuário decide se quer mover para uma coluna "Concluído" também — independente do status).

**Onde marcar:**

a) **Fora do card (no Kanban)** — Checkbox no canto superior esquerdo do `KanbanCard`. Clicar alterna `concluida` ↔ `pendente` sem abrir o detalhe (`stopPropagation`). Não dispara drag.

b) **Dentro do card (no DemandaDetailDialog)** — Botão de toggle no topo do diálogo: "Marcar como concluída" / "Reabrir tarefa".

**Tipos:** atualizar `Demanda.status` para `'pendente' | 'aprovada' | 'concluida'` em `src/lib/types.ts` e adicionar entrada em `DEMANDA_STATUS`.

**Hook:** novo `useToggleConcluida` em `use-demandas.ts` que faz update do `status`.

### 2. Filtros no topo da página de Demandas

Barra de filtros acima do Kanban com 4 controles + botão "Limpar":

| Filtro | Tipo | Opções |
|---|---|---|
| Status | Select | Todas / Não realizadas / Realizadas |
| Responsável | Select | Todos + lista de `profiles` + "Não atribuído" |
| Prioridade | Select | Todas / Alta / Média / Baixa |
| Data (prazo) | Range de datas (2 popovers Calendar: De / Até) | — |

Estado local em `DemandasPage.tsx`. Filtros são aplicados em memória sobre `visibleDemandas` (após o filtro de scope já existente), antes de passar para o `KanbanBoard`.

```text
┌──────────────────────────────────────────────────────────┐
│ [Status ▾] [Resp ▾] [Prioridade ▾] [De 📅] [Até 📅] [✕]  │
├──────────────────────────────────────────────────────────┤
│  Coluna A    │  Coluna B   │  Coluna C   │  ...           │
│  ┌────────┐  │             │             │                │
│  │ ☐ Card │  │             │             │                │
│  └────────┘  │             │             │                │
└──────────────────────────────────────────────────────────┘
```

Default: Status = "Não realizadas" (esconde concluídas) — assim o quadro fica limpo. Botão "Limpar" reseta para "Todas".

### Arquivos afetados

- `src/lib/types.ts` — adiciona `'concluida'` ao tipo e a `DEMANDA_STATUS`.
- `src/hooks/use-demandas.ts` — novo `useToggleConcluida`.
- `src/components/kanban/KanbanCard.tsx` — checkbox de conclusão + estilo (opacidade/strike) quando concluída.
- `src/components/kanban/DemandaDetailDialog.tsx` — botão "Marcar como concluída / Reabrir".
- `src/pages/DemandasPage.tsx` — barra de filtros + lógica de filtragem (status/responsável/prioridade/range de prazo).

### Notas técnicas

- Datas: usar `parseISO(prazo + "T12:00:00")` para evitar problemas de timezone (rule do projeto).
- Checkbox no card precisa parar `pointer-down`/`click` para não disparar drag (`@dnd-kit`).
- Não é necessária migração de banco — o `status` é `text` com default `'pendente'`, aceita o novo valor.
- Permissões: usuários com scope `'own'` continuam só conseguindo concluir/reabrir suas próprias demandas (reuso de `canEditDemanda`).
