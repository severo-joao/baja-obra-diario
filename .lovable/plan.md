
## Plano: corrigir exportação em branco do PDF

### Causa do problema
O documento está saindo em branco porque o CSS de impressão atual faz:

```css
body > * {
  display: none !important;
}
```

No app, todo o conteúdo está dentro de `#root`. Como `#print-area` fica dentro de `#root`, ao esconder `body > *` você esconde também o container inteiro da aplicação antes mesmo do navegador conseguir imprimir as páginas.

### O que vou ajustar

#### 1. Corrigir o CSS de impressão em `src/index.css`
Trocar a estratégia de ocultação global por uma que preserve `#root` e esconda apenas a interface do app.

Implementação:
- remover `body > * { display: none !important; }`
- manter `#root` visível no print
- esconder header, sidebar, controles e cards de filtro com `.no-print`
- forçar `#print-area` a ocupar a página inteira no print
- garantir que cada `.a4-page` tenha dimensões A4 fixas e quebra correta

Estrutura esperada:
```text
print
└── #root visível
    └── #print-area visível
        ├── página 1
        ├── página 2
        └── ...
```

#### 2. Reforçar o isolamento visual das páginas A4
No print:
- `#print-area` vira bloco simples, sem flex/gap do preview
- `.a4-page` usa `210mm × 297mm`
- `margin: 0 auto`
- `page-break-after: always`
- última página sem quebra extra desnecessária

#### 3. Garantir que apenas os controles fiquem fora da impressão
Em `ExportPage.tsx` e `ReportViewerPage.tsx`, revisar a marcação para que:
- toolbar, botão imprimir e filtros permaneçam com `no-print`
- apenas as páginas A4 fiquem dentro de `#print-area`

### Ajuste secundário importante
Também há avisos no console de `ref` sendo passado para `A4ReportPage` e `ReportEntrySection`, que são function components sem `forwardRef`. Isso não parece ser a causa do branco, mas vale corrigir logo depois para evitar comportamento inesperado com bibliotecas de impressão/renderização.

### Resultado esperado
Depois da correção:
- o PDF deixa de sair em branco
- cada relato imprime em sua própria folha A4
- sidebar/header não aparecem na exportação
- o preview continua normal na tela

### Arquivos a ajustar
- `src/index.css`
- `src/pages/ExportPage.tsx`
- `src/pages/ReportViewerPage.tsx`

### Detalhe técnico
A correção principal é trocar uma regra de print “destrutiva” por uma regra “seletiva”. Hoje o CSS esconde o nó pai do conteúdo imprimível. A solução é preservar a árvore React renderizada e ocultar apenas os elementos não imprimíveis.
