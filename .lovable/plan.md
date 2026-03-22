

## Problema

A `SetPasswordPage` depende exclusivamente do evento `PASSWORD_RECOVERY` do `onAuthStateChange`. Esse evento é disparado pelo Supabase client quando ele processa os tokens do hash da URL. O problema é uma condição de corrida: o Supabase client (inicializado em `client.ts`) pode processar o hash e disparar o evento **antes** do `useEffect` da `SetPasswordPage` registrar o listener. Quando isso acontece, o evento é perdido e a página fica presa no "Verificando convite..." para sempre.

Além disso, o `useAuth` hook no `App.tsx` também escuta `onAuthStateChange` e pode consumir o evento antes.

## Solução

Alterar `SetPasswordPage` para não depender apenas do evento. Adicionar uma verificação de sessão existente no `useEffect`:

1. Manter o listener de `PASSWORD_RECOVERY` (funciona quando o timing é favorável)
2. Adicionar `supabase.auth.getSession()` — se já existe sessão ativa (o token do hash já foi processado), marcar como `ready`
3. Adicionar um timeout de segurança (~5s) para mostrar mensagem de erro caso nem o evento nem a sessão estejam disponíveis (link expirado, por exemplo)

### Alteração: `src/pages/SetPasswordPage.tsx`

No `useEffect`:
- Chamar `supabase.auth.getSession()` e se houver sessão, setar `ready = true`
- Manter o listener para `PASSWORD_RECOVERY` e também `SIGNED_IN` como fallback
- Adicionar timeout de 5 segundos para exibir mensagem de link expirado/inválido em vez de loading infinito

Arquivo único, mudança pontual.

