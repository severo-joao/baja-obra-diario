

## Plano: Remover nome do arquivo e borda das imagens no relatório

### Alterações em `src/components/report/ReportEntrySection.tsx`

1. **Remover o `<p>` com o filename** (linha 110-112) — elimina o texto que aparece embaixo de cada imagem
2. **Remover a borda do container da imagem** — trocar `className="border rounded overflow-hidden"` por `className="rounded overflow-hidden"` e remover o `style={{ borderColor: "#E5E7EB" }}` (linha 100)

### Resultado
- Sem nome de arquivo embaixo das fotos
- Sem borda ao redor das imagens

