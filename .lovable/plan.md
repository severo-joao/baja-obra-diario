

## Plano: Corrigir imagens esticadas e adicionar logo real no PDF

### Problemas identificados

1. **Imagens esticadas**: O código usa dimensões fixas (`imgW` x `maxImgH`) sem respeitar a proporção original da imagem. O `jsPDF.addImage()` estica a imagem para caber no retângulo definido.

2. **Logo**: O header atual desenha um quadrado navy com texto "BAJA". O frontend usa `/baja-logo.png` (105x105px com `object-fit: contain`). Precisamos baixar essa imagem do site público e embutir no PDF.

### Alterações em `supabase/functions/export-report/index.ts`

**1. Calcular proporção real das imagens**

Antes de chamar `addImage`, extrair as dimensões reais da imagem (via parsing dos bytes JPEG/PNG) e calcular a largura/altura proporcional que caiba dentro do espaço disponível (`imgW` x `maxImgH`), sem distorcer.

Abordagem: usar `jsPDF.getImageProperties()` (se disponível) ou parsear manualmente os headers JPEG/PNG para obter width/height. Com as dimensões reais, calcular o "fit" mantendo aspect ratio:

```
ratio = min(maxW / realW, maxH / realH)
finalW = realW * ratio
finalH = realH * ratio
```

**2. Logo real no header**

- Buscar `baja-logo.png` via URL pública do site (`https://baja-obra-diario.lovable.app/baja-logo.png`) na função `drawHeader`
- Embutir como imagem PNG no PDF (mesma técnica `fetchImageAsBase64`)
- Tamanho ~28x28mm com `object-fit: contain` (proporção mantida)
- Fazer fetch uma vez e reutilizar para todas as páginas

**3. Retornar dimensões no `fetchImageAsBase64`**

Atualizar a função para também retornar `width` e `height` da imagem, parseando os headers do formato (JPEG SOF marker / PNG IHDR chunk), para que o caller possa calcular aspect ratio.

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/export-report/index.ts` | Editar |

