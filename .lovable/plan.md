

## Problema

O erro "Invalid key" ocorre porque o nome do arquivo contém **espaços e caracteres acentuados** ("lâmina feriado - es.png"). O Supabase Storage não aceita esses caracteres no path.

## Solução

Sanitizar o nome do arquivo antes de usar no path de upload, removendo acentos e substituindo espaços/caracteres especiais por underscores.

### Alteração: `src/hooks/use-reports.ts` — `useUploadEntryImages`

Na linha que monta o `path`, sanitizar `file.name`:
- Remover acentos com `normalize("NFD").replace(/[\u0300-\u036f]/g, "")`
- Substituir espaços e caracteres especiais por `_`
- Converter para minúsculas

Exemplo do path antes:
```
177295cb.../75ea...-lâmina feriado - es.png
```

Depois:
```
177295cb.../75ea...-lamina_feriado_-_es.png
```

O `filename` original (com acentos) continua salvo na tabela `report_images` para exibição — só o path do storage é sanitizado.

Arquivo único, mudança de 3 linhas.

