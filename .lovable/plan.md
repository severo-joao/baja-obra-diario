

## Plano: Link externo público para funcionários cadastrarem relatos

### Resumo
Criar uma rota pública `/relato-externo` (sem necessidade de login) onde o funcionário de obra:
1. Vê a lista de obras (clientes) com status "ativa"
2. Seleciona a obra
3. Preenche o formulário de relato (mesmo formato atual)
4. Após salvar, vê uma tela de sucesso com opção "Criar novo relato"

O link compartilhável será: `https://baja-obra-diario.lovable.app/relato-externo`

### Alterações

**1. Criar `src/pages/ExternalReportPage.tsx`**
- Página pública, sem sidebar/header — layout limpo com logo BAJA
- **Etapa 1 — Seleção de obra**: lista os clientes com status "ativa" como cards clicáveis (nome da empreitada + endereço)
- **Etapa 2 — Formulário**: idêntico ao `ReportFormPage` (data, equipe, condições climáticas, ferramentas, atividades, observações, fotos)
- Internamente usa `useGetOrCreateReport` para obter/criar o relatório do cliente selecionado, depois `useCreateEntry` e `useUploadEntryImages`
- **Etapa 3 — Sucesso**: mensagem "Relato salvo com sucesso!" com dois botões:
  - "Criar novo relato" → volta à etapa 1
  - (sem botão de "ir ao painel" — funcionário não tem acesso)

**2. Atualizar `src/App.tsx`**
- Adicionar rota pública `/relato-externo` fora do `AuthenticatedRoutes` (ao lado de `/auth` e `/set-password`)

**3. Adicionar link copiável nas Configurações ou Relatórios**
- Na `SettingsPage`, adicionar uma seção "Link Externo para Relatos" com o link e botão de copiar

### Detalhes técnicos
- As tabelas `clients`, `reports`, `report_entries`, `report_images` e `tools` já têm RLS com acesso público (`true`), então não é necessário alterar permissões
- O bucket `report-images` já é público
- Não requer autenticação — acesso direto via URL
- Reutiliza os mesmos hooks existentes (`useClients`, `useTools`, `useGetOrCreateReport`, `useCreateEntry`, `useUploadEntryImages`)

