

## Plano: Gerenciamento de Usuários e Permissões por Menu

### O que será feito
Adicionar na página de Configurações uma seção para visualizar todos os usuários do sistema e editar as permissões de cada um, controlando quais itens do menu lateral cada usuário pode ver/editar.

### Modelo de dados

**Nova tabela `user_permissions`:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid (not null) | Referência ao auth.users |
| permission_key | text (not null) | Ex: `dashboard`, `clientes`, `ferramentas`, `relatorios`, `exportar`, `documentacao`, `configuracoes` |
| can_view | boolean | Pode visualizar a página |
| can_edit | boolean | Pode editar dados na página |
| created_at | timestamptz | |

- Constraint UNIQUE em (user_id, permission_key)
- RLS: apenas usuários autenticados podem ler; apenas admins podem atualizar
- Função `is_admin` (security definer) que verifica se o user tem `configuracoes.can_edit = true`

**Nova tabela `profiles`:**
| Coluna | Tipo |
|--------|------|
| id | uuid (PK, ref auth.users) |
| email | text |
| created_at | timestamptz |

- Trigger para criar perfil automaticamente no signup
- Necessária para listar usuários do sistema via SDK

### Alterações no frontend

**1. `src/hooks/use-user-permissions.ts`** (novo)
- Hook para buscar todos os usuários (via profiles) com suas permissões
- Hook para atualizar permissões de um usuário
- Hook para buscar permissões do usuário logado

**2. `src/pages/SettingsPage.tsx`**
- Adicionar nova seção "Usuários do Sistema" com tabela listando:
  - Email do usuário
  - Status (ativo/pendente)
  - Botão para editar permissões
- Dialog/modal de edição com checkboxes para cada item do menu:
  - Dashboard: visualizar / editar
  - Clientes & Empreitadas: visualizar / editar
  - Ferramentas: visualizar / editar
  - Relatórios de Obras: visualizar / editar
  - Exportar Relatório: visualizar / editar
  - Documentação & Webhooks: visualizar / editar
  - Configurações: visualizar / editar

**3. `src/components/layout/AppSidebar.tsx`**
- Filtrar `navItems` com base nas permissões do usuário logado (ocultar itens sem `can_view`)

**4. `src/App.tsx`**
- Proteger rotas: redirecionar para Dashboard se o usuário tentar acessar rota sem permissão

### Detalhes de segurança
- O primeiro usuário (ou quem tem `configuracoes.can_edit`) é tratado como admin
- Novos usuários recebem permissões padrão (tudo liberado) via trigger ou na criação do invite
- A função `is_admin` usa SECURITY DEFINER para evitar recursão no RLS

