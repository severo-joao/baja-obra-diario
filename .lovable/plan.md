

## Plano: Funcionalidade de Demandas

### Resumo
Nova seção "Demandas" com cadastro, prioridades, sazonalidade, notificações por webhook externo e endpoints de ação (Renovar, Lembrar amanhã, Aprovar).

### 1. Tabela no banco — `demandas`

```sql
CREATE TABLE public.demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  prioridade text NOT NULL DEFAULT 'media', -- 'alta', 'media', 'baixa'
  sazonal boolean NOT NULL DEFAULT false,
  intervalo_dias integer, -- se sazonal, de quantos em quantos dias
  data_notificacao date NOT NULL, -- data da próxima notificação
  webhook_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'aprovada'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.demandas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 2. Permissões
- Adicionar `"demandas"` ao array de permission_keys no trigger `handle_new_user_permissions` e no front-end (`PERMISSION_KEYS`, `PERMISSION_LABELS`).

### 3. Página `DemandasPage.tsx`
- Listagem de demandas com badges de prioridade (Alta=vermelho, Média=laranja, Baixa=verde) e status.
- Formulário de cadastro/edição: título, descrição, prioridade (select), data da notificação (datepicker), toggle sazonal, campo intervalo_dias (aparece só quando sazonal=true), webhook URL.
- Botões de ação por demanda: **Renovar**, **Lembrar amanhã**, **Aprovar**.

### 4. Hook `use-demandas.ts`
- CRUD completo via Supabase client.
- Mutations para as 3 ações:
  - **Renovar**: calcula `data_notificacao = hoje + intervalo_dias`
  - **Lembrar amanhã**: `data_notificacao = amanhã`
  - **Aprovar**: `status = 'aprovada'`

### 5. Edge Function `notify-demandas/index.ts`
- Chamada via cron (pg_cron + pg_net) diariamente.
- Consulta demandas com `data_notificacao = hoje` e `status = 'pendente'`.
- Para cada, faz POST na `webhook_url` com payload contendo dados da demanda.
- Inclui no payload 3 URLs de ação (endpoints da edge function `demanda-action`).

### 6. Edge Function `demanda-action/index.ts`
- Endpoints públicos (via link externo, sem login necessário) com token único por demanda.
- Aceita `action` = `renovar | lembrar_amanha | aprovar` + `demanda_id`.
- Executa a lógica correspondente no banco.
- Retorna HTML simples confirmando a ação.

### 7. Navegação
- Novo item no sidebar: "Demandas" com ícone `ClipboardList`, rota `/demandas`, permKey `"demandas"`.
- Nova rota em `App.tsx`.

### 8. Cron job
- Ativar extensões `pg_cron` e `pg_net`.
- Agendar execução diária da edge function `notify-demandas`.

### Arquivos criados/modificados
| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `demandas`, atualizar trigger permissions |
| `src/lib/types.ts` | Adicionar tipo `Demanda` |
| `src/hooks/use-demandas.ts` | Criar hook CRUD + ações |
| `src/pages/DemandasPage.tsx` | Criar página completa |
| `src/hooks/use-user-permissions.ts` | Adicionar "demandas" |
| `src/components/layout/AppSidebar.tsx` | Novo nav item |
| `src/App.tsx` | Nova rota + permission gate |
| `supabase/functions/notify-demandas/index.ts` | Edge function notificação |
| `supabase/functions/demanda-action/index.ts` | Edge function ações externas |

