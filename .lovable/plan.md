## Plano: Permissão por escopo nas Demandas (todas vs. próprias)

Adicionar um nível extra de permissão para Demandas, permitindo restringir um usuário a ver/editar **apenas as demandas atribuídas a ele**.

### Funcionalidade

Na tela de **Configurações → Permissões**, ao lado da linha "Demandas" do editor de permissões, surge um seletor extra com escopo:

- **Todas as demandas** (padrão atual)
- **Apenas as próprias** (somente onde `responsavel` = email do usuário)

Este seletor só aparece para a permissão `demandas` quando `can_view` está marcado. As demais permissões continuam iguais.

### Como o escopo é aplicado

- **Listagem (Kanban)**: se o usuário tem escopo `own`, o `useDemandas` filtra `responsavel === session.user.email` antes de renderizar o board.
- **Mutations** (mover, editar, comentar, anexar): o `DemandaDetailDialog` e os handlers do board verificam o escopo; se `own` e a demanda não pertence ao usuário, as ações ficam desabilitadas.
- **Criar nova tarefa**: usuário com escopo `own` continua podendo criar, mas o campo `responsavel` é forçado ao seu próprio email (read-only).

### Mudança no campo "Responsável"

Hoje `responsavel` é texto livre — isso quebra o filtro por escopo (qualquer typo invalida o vínculo). Será trocado por um **Select com lista de usuários** (emails da tabela `profiles`), com opção "Não atribuído". Demandas antigas com texto livre continuam funcionando (exibidas como estão), mas só casam com o filtro `own` se o texto coincidir exatamente com o email do usuário logado.

### Mudanças no banco (migration)

Adicionar uma coluna `scope` em `user_permissions`:

```sql
ALTER TABLE public.user_permissions
  ADD COLUMN scope text NOT NULL DEFAULT 'all';
-- valores aceitos: 'all' | 'own'
```

A coluna é genérica (pode ser usada por outras permissões no futuro), mas por ora só a UI de Demandas a expõe.

Atualizar `handle_new_user_permissions` para inserir `scope = 'all'` por padrão (já é o default da coluna, então nenhuma mudança de função é necessária).

### Mudanças no frontend

| Arquivo | Mudança |
|---|---|
| `src/hooks/use-user-permissions.ts` | Adicionar `scope` em `UserPermission`; `useUpdateUserPermissions` passa a gravar `scope`; novo helper `useMyDemandasScope()` |
| `src/pages/SettingsPage.tsx` | Na linha "Demandas" do editor, exibir Select com "Todas" / "Apenas próprias" |
| `src/hooks/use-demandas.ts` | `useDemandas` aceita filtro opcional ou expor versão filtrada via novo hook `useVisibleDemandas()` que aplica escopo + email do usuário |
| `src/pages/DemandasPage.tsx` | Usar `useVisibleDemandas`; ao criar tarefa, se escopo = `own`, pré-preencher e travar `responsavel` com email do usuário |
| `src/components/kanban/DemandaDetailDialog.tsx` | Trocar input texto de "Responsável" por Select de usuários (`profiles`); se escopo `own` e a demanda não é do usuário, modo somente-leitura |
| `src/components/kanban/KanbanBoard.tsx` | Bloquear `onMove` quando escopo `own` e cartão não pertence ao usuário |

Novo hook `use-profiles.ts` (ou adicionar em `use-user-permissions.ts`) para listar emails disponíveis no Select de Responsável.

### Compatibilidade

- Coluna `scope` tem default `'all'` → nenhum usuário existente perde acesso.
- Edge functions (`notify-demandas`, `get-demandas`, `demanda-action`) continuam intactas — escopo é puramente de UI/UX por enquanto.
- Demandas com `responsavel` em texto livre não casam automaticamente com o filtro `own` a menos que coincidam com o email; o admin pode reatribuir via Select.

### Resumo visual do editor de permissões

```text
┌─ Permissões de joao@empresa.com ──────────────────┐
│ Seção           Visualizar   Editar    Escopo     │
│ Dashboard          ☑           ☑          —       │
│ Demandas           ☑           ☑       [Todas ▾]  │
│                                          ├ Todas  │
│                                          └ Própr. │
│ Relatórios         ☑           ☐          —       │
└───────────────────────────────────────────────────┘
```

### Não incluído

- RLS no banco para impor o escopo (pode ser adicionado depois; hoje as policies são `Allow all for authenticated`).
- Aplicar escopo às edge functions externas.
