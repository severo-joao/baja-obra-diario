

## Plano: Sistema de convites por email (registro apenas por convite)

### Resumo
Remover o cadastro público da tela de login. Criar uma área em Configurações onde o usuário logado pode convidar novos usuários por email. O convite usa a API `auth.admin.inviteUserByEmail` do backend, que envia um email com link para o novo usuário definir sua senha.

### Alterações

**1. Edge Function `invite-user`**
- Recebe `{ email }` no body
- Valida que o chamador está autenticado (verifica JWT)
- Usa `supabase.auth.admin.inviteUserByEmail(email, { redirectTo })` com service role key
- Retorna sucesso ou erro

**2. Tabela `invites` (migração)**
- Colunas: `id`, `email`, `invited_by` (uuid), `created_at`, `status` (pending/accepted)
- RLS: apenas usuários autenticados podem ler e inserir
- Serve como histórico de convites enviados

**3. `src/pages/AuthPage.tsx`**
- Remover a aba "Cadastrar" — manter apenas o formulário de login
- Remover o `handleSignUp` e componentes relacionados

**4. `src/pages/SettingsPage.tsx`**
- Substituir o placeholder por um formulário funcional:
  - Campo de email + botão "Enviar Convite"
  - Chama a edge function `invite-user`
  - Lista de convites enviados (da tabela `invites`) com status
  - Toast de sucesso/erro

**5. `src/App.tsx`**
- Nenhuma mudança de rotas necessária (Settings já existe)

### Fluxo
1. Admin logado vai em Configurações → digita email → clica "Enviar Convite"
2. Edge function cria o usuário via `inviteUserByEmail` e registra na tabela `invites`
3. Novo usuário recebe email com link → clica → define senha
4. Novo usuário faz login normalmente na tela de login

### Detalhes técnicos
- `inviteUserByEmail` requer service role key (por isso precisa de edge function)
- O email de convite é enviado automaticamente pelo sistema de autenticação
- O link do convite redireciona para a aplicação onde o usuário pode definir sua senha
- Será necessário criar uma página `/set-password` para o usuário convidado definir sua senha após clicar no link

### Arquivos
- `supabase/functions/invite-user/index.ts` (criar)
- `src/pages/AuthPage.tsx` (simplificar — só login)
- `src/pages/SettingsPage.tsx` (formulário de convites)
- `src/hooks/use-invites.ts` (criar — CRUD da tabela invites)
- Migração SQL para tabela `invites`

