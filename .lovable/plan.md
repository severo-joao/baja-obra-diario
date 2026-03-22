
Objetivo: impedir que o cabeçalho da tela de exportação (“Exportar Relatório / Selecione a obra...”) entre na primeira página do PDF e deixar a impressão limitada apenas ao conteúdo A4.

1. Ajustar a estrutura da `ExportPage`
- Marcar o bloco do título da página como `no-print`
- Garantir que o card de filtros e botão continue `no-print`
- Manter somente o `#print-area` como conteúdo imprimível
- Se necessário, também marcar o estado vazio (“Nenhum relato encontrado”) como `no-print`, para ele nunca competir com a impressão

2. Reforçar o isolamento da impressão no CSS
- Atualizar o `@media print` em `src/index.css` para tratar `#print-area` como a única região visível da página impressa
- Remover qualquer influência visual do container da tela (margens, paddings, gaps, overflow)
- Garantir que cada `.a4-page` continue ocupando exatamente uma folha A4

3. Revisar o `ReportViewerPage` pelo mesmo padrão
- Confirmar que toolbar e cabeçalho já estão fora da impressão
- Aplicar a mesma lógica estrutural para evitar regressões entre “visualizar” e “exportar”

4. Resultado esperado
- O PDF não mostrará mais o texto da interface da tela
- A primeira página começará diretamente no relatório A4
- Apenas as páginas do relatório serão exportadas

Arquivos a ajustar:
- `src/pages/ExportPage.tsx`
- `src/index.css`
- `src/pages/ReportViewerPage.tsx` (revisão de consistência)

Detalhe técnico
Hoje o problema não é mais página em branco; agora é vazamento de elementos da interface para o print. A causa visível é que o bloco de título em `ExportPage.tsx` não está com `no-print`, então ele continua sendo renderizado antes do `#print-area` quando o navegador monta a impressão.
