

## Plano: Implementar autenticação com login e senha

### O que será feito
Adicionar tela de login/cadastro com email e senha. Todas as rotas ficam protegidas — só acessíveis após autenticação.

### Alterações

**1. Criar `src/pages/AuthPage.tsx`**
- Formulário com abas Login / Cadastro
- Campos: email e senha
- Usa `supabase.auth.signInWithPassword()` e `supabase.auth.signUp()`
- Feedback de erro com toast
- Após cadastro, informar que é necessário confirmar email

**2. Criar `src/hooks/useAuth.ts`**
- Hook que escuta `onAuthStateChange` e expõe `session`, `user`, `loading`, `signOut`
- `getSession()` chamado após o listener (conforme boas práticas)

**3. Atualizar `src/App.tsx`**
- Envolver rotas com verificação de sessão
- Se não autenticado → redirecionar para `/auth`
- Rota `/auth` pública (fora do `AppLayout`)
- Adicionar botão de logout no header ou sidebar

**4. Atualizar `src/components/layout/AppLayout.tsx` ou `AppSidebar.tsx`**
- Adicionar botão "Sair" no footer da sidebar
- Chamar `supabase.auth.signOut()` ao clicar

### Detalhes técnicos
- Sem tabela de perfis (apenas `auth.users`)
- Email precisa ser confirmado antes do login (comportamento padrão)
- Sem auto-confirm de email
- RLS das tabelas existentes já permite acesso público — sem impacto na autenticação

