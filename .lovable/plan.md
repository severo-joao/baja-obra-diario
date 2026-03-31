

## Plano: Replicar layout A4 do frontend no endpoint export-report

### Problema
O endpoint `export-report` gera um PDF com layout básico (cabeçalho navy simples, texto corrido). O frontend exporta com layout A4 estilizado: borda navy, linha vertical esquerda, triângulo decorativo no rodapé, logo, info da empresa, seções com títulos uppercase e borda laranja accent, fotos embutidas, e rodapé com endereço.

### Solução
Reescrever a geração do PDF no `export-report` para replicar o layout do componente `A4ReportPage` + `ReportEntrySection` usando comandos jsPDF:

### Elementos visuais a replicar por página

1. **Borda navy inset** — `doc.setDrawColor(26,43,74)` retângulo a 3mm das bordas
2. **Linha vertical esquerda** — linha navy a ~15mm da esquerda, do header ao footer
3. **Triângulo decorativo** — canto inferior esquerdo, triângulo navy via `doc.triangle()`
4. **Header** — logo placeholder (texto "BAJA" estilizado, já que não há acesso ao arquivo PNG) + "Baja Engenharia & Construções" + CNPJ à direita
5. **Título** — "RELATÓRIO DIÁRIO DE OBRA" centralizado, uppercase, navy
6. **Bloco info** — grid com Obra, Cliente, Data, Relato # em fundo cinza claro
7. **Seções** — títulos uppercase navy 8pt, seções "Atividades" e "Observações" com borda laranja (#E87722) à esquerda
8. **Ferramentas** — listadas como badges (retângulos arredondados cinza com texto)
9. **Fotos** — download das imagens via fetch e embed como JPEG no PDF (grid 2 colunas ou centralizada se 1)
10. **Rodapé** — endereço da empresa + "Página X de Y"

### Estrutura: 1 entry = 1 página (como no frontend)
Cada relato ocupa sua própria página A4, igual ao frontend.

### Alterações

**`supabase/functions/export-report/index.ts`** — Reescrita completa da geração PDF:
- Cada entry gera uma nova página com o layout completo (borda, linha, triângulo, header, footer)
- Download e embed de imagens reais (fetch URL → arrayBuffer → base64 → addImage)
- Seções com accent border laranja para Atividades e Observações
- Paginação "Página X de Y"
- Fallback: se imagem falhar no download, mostrar URL como texto

### Limitações
- Fonte será Helvetica (jsPDF built-in), não Inter — visualmente próximo mas não idêntico
- Logo: será buscado do storage público ou renderizado como texto estilizado se não disponível no servidor

