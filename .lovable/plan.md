

## Plano: Correções de segurança e configuração

### Problema 1 — `.env` no git

**Situação atual:** O `.gitignore` não inclui `.env`. O arquivo `.env` é gerenciado automaticamente pelo Lovable Cloud e não contém chaves sensíveis como `SERVICE_ROLE_KEY` (essas ficam apenas no backend). As variáveis `VITE_*` são chaves públicas (anon key e URL), projetadas para serem expostas no frontend — não representam risco de segurança. Mesmo assim, é boa prática excluir `.env` do git.

Nenhuma chave hardcoded foi encontrada nos arquivos `.ts`/`.tsx` do projeto — o `client.ts` já usa `import.meta.env`.

**Alterações:**

**1. `.gitignore`** — Adicionar `.env` e `.env.*` (exceto `.env.example`)

**2. Criar `.env.example`** — Com placeholders:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id_here
```

### Problema 2 — Dependências e scripts

**Situação atual:** Tudo já está correto:
- `package.json` tem scripts `dev`, `build`, `lint`, `test` ✓
- `@eslint/js@^9.32.0` está em devDependencies ✓
- `eslint@^9.32.0` compatível com ESLint 9 ✓
- `eslint.config.js` usa formato flat config do ESLint 9 ✓

Nenhuma alteração necessária para o Problema 2.

### Resumo
- 1 arquivo editado (`.gitignore`)
- 1 arquivo criado (`.env.example`)
- Nenhuma funcionalidade alterada

