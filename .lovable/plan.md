

## Plano: Corrigir autenticação html2pdf.app

### Problema
A função `generatePdfViaHtml2Pdf` envia a API key no header `Authentication`, mas a documentação do html2pdf.app exige que o `apiKey` seja passado **dentro do body JSON**. Também usa o parâmetro `url` quando a API espera `html`.

### Correção em `supabase/functions/export-report/index.ts`

Alterar a função `generatePdfViaHtml2Pdf` (linhas 42-70):

**Antes:**
```typescript
headers: {
  "Content-Type": "application/json",
  Authentication: apiKey,
},
body: JSON.stringify({
  url: printUrl,
  ...
}),
```

**Depois:**
```typescript
headers: {
  "Content-Type": "application/json",
},
body: JSON.stringify({
  apiKey: apiKey,
  html: printUrl,
  landscape: false,
  format: "A4",
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  waitFor: 5000,
}),
```

Mudanças:
1. Remover header `Authentication`
2. Adicionar `apiKey` no body JSON
3. Renomear `url` → `html` (aceita URL conforme docs)
4. Usar nomes de parâmetros corretos da API (`format` em vez de `paper_size`, `marginTop` em vez de `margin_top`, `waitFor` em vez de `wait_for`)

### Arquivo
| Arquivo | Ação |
|---------|------|
| `supabase/functions/export-report/index.ts` | Corrigir `generatePdfViaHtml2Pdf` |

