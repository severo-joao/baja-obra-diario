

## Plano: Logo ocupar 90% do quadrado branco

### Alteração

**`src/components/layout/AppSidebar.tsx`** (linha 59-60)
- Container branco: remover `p-1` e usar `p-[3px]` — com 56px de container, 3px de padding em cada lado = 50px para a imagem, que é ~89% do container (50/56 ≈ 0.893)
- Imagem: manter `w-full h-full object-contain`

Isso garante que a logo ocupe exatamente ~90% do quadrado branco, com margem uniforme de 3px.

