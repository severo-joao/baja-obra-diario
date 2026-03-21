

## Plano: Reestruturar Relatórios para modelo "1 Relatório por Obra + Relatos Diários"

### Problema Atual
Hoje cada entrada diária é um `report` independente. O usuário quer que cada obra tenha **um único relatório** que funciona como um diário, onde se adicionam **relatos diários** (entries). As imagens de cada relato devem aparecer inline no relatório.

### Mudanças no Banco de Dados

Criar tabela `report_entries` para os relatos diários:

```text
report_entries
├── id (uuid, PK)
├── report_id (uuid, FK → reports)
├── data_relato (text, data do relato)
├── equipe (text)
├── condicoes_climaticas (text)
├── ferramentas_ids (text[])
├── atividades_dia (text)
├── observacoes (text)
├── created_at (timestamptz)
```

Mover `report_images.report_id` para referenciar `report_entries` via nova coluna `entry_id`:
- Adicionar coluna `entry_id uuid` na tabela `report_images`
- Imagens ficam vinculadas ao relato específico, não ao relatório geral

A tabela `reports` fica simplificada — um registro por obra:
- `id`, `client_id`, `created_at`, `updated_at`
- Remover campos de dados diários (equipe, clima, etc.) que migram para `report_entries`

### Mudanças nas Páginas

1. **ReportsPage** — Cada obra mostra seu relatório único. Ao clicar, abre o relatório com a lista de relatos. Botão "+ Novo Relato" adiciona uma entrada ao relatório existente (ou cria o relatório automaticamente se não existir).

2. **ReportFormPage** — Formulário agora cria/edita um `report_entry`. Se a obra ainda não tem relatório, cria o relatório e a primeira entrada juntos. Upload de imagens vinculado ao `entry_id`.

3. **ReportViewerPage** — Exibe o relatório completo da obra com todos os relatos em sequência cronológica. Cada relato mostra seus dados (data, equipe, clima, atividades, observações) e **suas imagens inline** logo abaixo.

4. **ExportPage** — Filtra por obra e período, renderiza os relatos do período com imagens embutidas em cada seção.

5. **Dashboard** — Conta relatórios (obras com diário) e relatos do mês.

### Hooks Atualizados

- `use-reports.ts` — Refatorar para buscar relatórios com entries e images nested. Adicionar `useCreateEntry`, `useUpdateEntry`, `useDeleteEntry`.

### Resumo do Fluxo

```text
Obra (client) → 1 Relatório (report) → N Relatos (report_entries)
                                          └── N Imagens (report_images)
```

O usuário vai à página de Relatórios, vê as obras, clica em uma obra para ver o diário completo, e adiciona novos relatos diários com fotos que aparecem integradas no documento.

