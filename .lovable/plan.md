

## Plano: Substituir logo do sidebar pela imagem enviada

### O que será feito
Trocar o ícone "B" em fundo laranja no canto superior esquerdo do sidebar pela imagem de logo enviada (BAJA02.png).

### Alterações

**1. Copiar imagem para o projeto**
- Copiar `user-uploads://BAJA02.png` para `src/assets/baja-logo.png`

**2. `src/components/layout/AppSidebar.tsx`**
- Importar a imagem: `import bajaLogo from "@/assets/baja-logo.png"`
- Substituir o `div` com o "B" (linhas 50-52) por uma tag `<img>` usando a imagem importada, mantendo as mesmas dimensões (`w-9 h-9`) e `rounded-lg`

**3. `src/components/report/A4ReportPage.tsx`** (opcional)
- Substituir também o box com "B" no header do relatório A4 pela mesma imagem, para consistência visual nos PDFs exportados

