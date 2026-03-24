

## Plano: Corrigir erro ao salvar relato com fotos pelo link externo

### Problema
O `catch` em `handleSave` engole o erro real sem logar, tornando impossível diagnosticar. O upload de imagens funciona no preview mas pode falhar na URL publicada por problemas de CORS ou tamanho de arquivo. Além disso, o `handleSave` não exibe detalhes do erro.

### Alterações

**1. `src/pages/ExternalReportPage.tsx`**
- No `catch`, adicionar `console.error` para logar o erro real
- Mostrar a mensagem de erro real no toast (quando disponível) em vez da mensagem genérica
- Exemplo: `catch (err: any) { console.error("Erro:", err); toast.error(err?.message || "Erro ao salvar relato."); }`

**2. `src/hooks/use-reports.ts` — `useUploadEntryImages`**
- Adicionar tratamento de erro mais detalhado no upload de cada imagem
- Logar o erro de upload no console para debug

Essas mudanças vão revelar o erro real. Se for CORS, tamanho de arquivo ou permissão de storage, a mensagem vai aparecer e podemos corrigir na sequência.

### Técnico
- Mudança pontual em 2 arquivos
- Nenhuma migração necessária

