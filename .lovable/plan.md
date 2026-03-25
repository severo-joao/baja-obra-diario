

## Plano: Layout colapsável na página de Relatórios

### O que muda
Trocar o layout atual (cards abertos com todos os relatos visíveis) por um layout com **Accordion** — cada obra aparece como um item colapsado mostrando apenas o nome e quantidade de relatos. Ao clicar, expande para mostrar a lista de relatos e os botões de ação.

### Alteração

**`src/pages/ReportsPage.tsx`**
- Importar `Accordion, AccordionItem, AccordionTrigger, AccordionContent` de `@/components/ui/accordion`
- Envolver a lista de obras com relatório num `<Accordion type="multiple">`
- Cada obra vira um `<AccordionItem>`:
  - **Trigger**: nome da empreitada, nome do cliente, badge com quantidade de relatos
  - **Content**: lista de relatos (entradas) com botões de ação (Novo Relato, Ver Relatório, Excluir)
- Seção "Obras sem relatório" permanece igual (já é compacta)

Nenhuma outra alteração necessária — o componente Accordion já existe no projeto.

