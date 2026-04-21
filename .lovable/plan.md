

## Plano: Kanban de Tarefas (Demandas)

Transformar a página de Demandas (atualmente uma tabela) em um **quadro Kanban** com colunas customizáveis, drag-and-drop, anexos e comentários.

### Funcionalidades

1. **Colunas customizáveis** (configuráveis pelo usuário)
   - Padrão: "A Fazer", "Em Progresso", "Em Revisão", "Concluído"
   - Adicionar / renomear / reordenar / excluir colunas
   - Persistidas no banco

2. **Cartões de tarefa** com:
   - Título, descrição
   - Prazo (data) com destaque visual quando vencido/próximo
   - Etiqueta de prioridade (Alta / Média / Baixa) com cores
   - Responsável (quem é a demanda) — texto livre ou seleção de usuários do sistema
   - Anexos (imagens) e comentários

3. **Drag-and-drop** entre colunas (`@dnd-kit/core`)

4. **Modal de detalhes** ao clicar no cartão: edição inline, lista de comentários (com autor + timestamp), upload/preview de imagens

### Mudanças no banco (migração)

**Novas tabelas:**

```sql
-- Colunas do Kanban (customizáveis)
kanban_columns (
  id uuid pk,
  titulo text,
  ordem int,
  cor text,
  created_at timestamptz
)

-- Anexos de imagens
demanda_attachments (
  id uuid pk,
  demanda_id uuid fk → demandas,
  url text,
  filename text,
  uploaded_by uuid,
  created_at timestamptz
)

-- Comentários
demanda_comments (
  id uuid pk,
  demanda_id uuid fk → demandas,
  autor_id uuid,
  autor_email text,
  texto text,
  created_at timestamptz
)
```

**Alterações em `demandas`:**
- `coluna_id uuid` (referência à coluna do Kanban) — substitui o uso simples de `status`
- `prazo date` (renomear/complementar `data_notificacao` mantendo retrocompat)
- `responsavel text` (quem é dono da demanda)
- `ordem int` (posição dentro da coluna para drag-and-drop)

Manter os campos atuais (`titulo`, `descricao`, `prioridade`, `sazonal`, `intervalo_dias`, `webhook_url`) intactos para não quebrar a edge function `notify-demandas`.

**Storage:** novo bucket público `demanda-attachments` com policies de leitura pública e escrita autenticada.

**RLS:** Allow all para autenticados (consistente com `demandas`).

### Mudanças no frontend

**Arquivos a criar/editar:**

| Arquivo | Ação |
|---|---|
| `src/lib/types.ts` | Adicionar `KanbanColumn`, `DemandaAttachment`, `DemandaComment`, expandir `Demanda` |
| `src/hooks/use-demandas.ts` | Adicionar mutations para mover entre colunas, reordenar |
| `src/hooks/use-kanban-columns.ts` | **novo** — CRUD de colunas |
| `src/hooks/use-demanda-attachments.ts` | **novo** — upload/listagem |
| `src/hooks/use-demanda-comments.ts` | **novo** — CRUD comentários |
| `src/pages/DemandasPage.tsx` | Reescrever como Kanban board |
| `src/components/kanban/KanbanBoard.tsx` | **novo** — board com colunas + dnd-kit |
| `src/components/kanban/KanbanColumn.tsx` | **novo** — coluna droppable |
| `src/components/kanban/KanbanCard.tsx` | **novo** — cartão draggable |
| `src/components/kanban/DemandaDetailDialog.tsx` | **novo** — modal com edição, anexos, comentários |
| `src/components/kanban/ColumnSettingsDialog.tsx` | **novo** — gerenciar colunas (add/renomear/excluir/reordenar) |

**Dependência nova:** `@dnd-kit/core` + `@dnd-kit/sortable`

### Layout (resumo visual)

```text
┌─ Demandas (Kanban) ──────────────── [⚙ Colunas] [+ Nova] ┐
│ ┌─ A Fazer (3) ─┐ ┌─ Em Progresso ─┐ ┌─ Concluído ─┐    │
│ │ [Card]        │ │ [Card]          │ │ [Card]      │   │
│ │  Título       │ │  Título         │ │             │   │
│ │  🔴 Alta      │ │  📅 12/05       │ │             │   │
│ │  👤 João      │ │  💬 2  📎 1     │ │             │   │
│ │ [Card]        │ │                 │ │             │   │
│ └───────────────┘ └─────────────────┘ └─────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Compatibilidade
- Demandas existentes serão migradas para a primeira coluna ("A Fazer") via UPDATE no migration
- Webhook `notify-demandas` continua funcionando (campos antigos preservados)
- Edge function `demanda-action` continua funcionando

