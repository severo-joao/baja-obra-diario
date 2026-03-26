

## Plano: Trocar logo e remover quadro branco

### Alterações

**1. Substituir logo** — Copiar `user-uploads://BAJA02_BRANCO.png` → `src/assets/baja-logo.png`

**2. `src/components/layout/AppSidebar.tsx`** (linhas 58-61)

Atual:
```jsx
<div className="bg-white rounded-lg flex-shrink-0 w-[84px] h-[84px] flex items-center justify-center p-[3px]">
  <img src={bajaLogo} alt="BAJA Logo" className="w-full h-full object-fill my-[5px] mx-[5px] text-sidebar-border bg-sidebar border-sidebar border-0" />
</div>
```

Novo:
```jsx
<img src={bajaLogo} alt="BAJA Logo" className="w-[84px] h-[84px] object-contain flex-shrink-0" />
```

- Remove o `<div>` branco wrapper
- Logo diretamente no fundo escuro do sidebar com tamanho mantido

