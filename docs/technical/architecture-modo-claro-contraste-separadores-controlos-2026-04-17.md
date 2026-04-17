# Arquitetura técnica — modo claro: contraste de separadores, caixas, interruptores e botões secundários

**Versão:** 1.0  
**Data:** 2026-04-17  
**Autoria:** Aria (architect / AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md`](../prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md) (FR-VIS-THEME-05 a **08**, NFR-VIS-THEME-01 a **04**)  
**UX de origem:** [`docs/specs/ux-spec-modo-claro-contraste-separadores-controlos-2026-04-17.md`](../specs/ux-spec-modo-claro-contraste-separadores-controlos-2026-04-17.md)

Este documento fixa a **arquitetura de apresentação** para a entrega **“Onda claro”**: consumo de tokens, alterações em `@layer components`, pontos de integração em TSX (nomeadamente toggle de tema) e **regressão cruzada** no escuro. **Não** há alteração de backend, contratos HTTP, base de dados, autenticação ou dependências npm obrigatórias.

**Documento ascendente:** [`architecture-revisao-visual-temas-claro-escuro-2026-04-17.md`](./architecture-revisao-visual-temas-claro-escuro-2026-04-17.md) — decisões de tema, camadas e Onda 0/1 **mantêm-se**; este ficheiro **especializa** o modo claro para FR **05+**.

---

## 1. Decisões de arquitetura (resumo)

| Decisão | Escolha | Racional |
|---------|---------|----------|
| **Âmbito de runtime** | **Apenas `frontend/`** | PRD e spec limitam-se a IU; zero impacto em `backend/`, Supabase ou pipelines por si só. |
| **Mecanismo de tema** | **Inalterado** — classe `dark` no `documentElement` + Tailwind `darkMode: 'class'` | `useThemeStore`; esta entrega **refina** aparência no **ausência** de `dark` (claro), não o protocolo de tema. |
| **Fonte de verdade para borda no claro** | **`--color-surface-border`** (`:root`) consumido em `index.css` **e/ou** classes que encapsulem `rgb(var(--color-surface-border))` | FR-VIS-THEME-05; evita divergência `slate-200` vs token (UX spec §3.2). |
| **Camada de alteração principal** | **`frontend/src/index.css`** (`@layer components`) para `.planner-*`, `.admin-*` listados no PRD | Um único sítio para paridade entre páginas (**NFR-VIS-THEME-03**: diff localizado). |
| **Camada TSX pontual** | **`Settings.tsx`** (toggle Aparência); **opcional** varredura `border-slate-200/` em ficheiros de grande superfície | FR-VIS-THEME-08 (semântica + trilho); FR-VIS-THEME-05 (anti-padrão inline). |
| **Componente Switch genérico** | **Não obrigatório** nesta fase — apenas se a equipa extrair o toggle para reutilização; até lá, implementação **local** com contrato UX (role, aria, focus) | Evita novo pacote; alinhado a design system “leve”. |
| **Observabilidade** | **N/A** (sem novas métricas) | Sucesso = checklist manual + amostragem contraste (**NFR-VIS-THEME-01**). |
| **Segurança** | **Inalterada** | CSS/React apenas; sem novos vetores. |

---

## 2. Mapa requisitos → componentes técnicos

| ID | Implicação arquitectónica |
|----|---------------------------|
| **FR-VIS-THEME-05** | Editar **tokens só se necessário**; preferir **remapear classes** em `index.css` para `border-[color:rgb(var(--color-surface-border))]` (ou `@apply` equivalente) nos contornos exteriores alvo. |
| **FR-VIS-THEME-06** | Ajustar **uma vez** por classe base (`.planner-surface`, `.planner-card`, `.admin-toolbar`, etc.) em vez de overrides por página. |
| **FR-VIS-THEME-07** | `.planner-button-secondary` (e `-compact`) em `index.css`: garantir borda/fundo distinguíveis no **selector sem `dark:`** (claro). |
| **FR-VIS-THEME-08** | `Settings.tsx`: manter **um** controlo por estado (`button` + `role="switch"` **ou** `input type="checkbox"` estilizado); não duplicar fonte de verdade do tema (continua `useThemeStore`). |
| **NFR-VIS-THEME-04** | Após alterações, validar **mesmas rotas** com classe `dark` no `html` — checklist UX spec §9. |

---

## 3. Vista em camadas (incremental sobre o doc ascendente)

```text
┌────────────────────────────────────────────────────────────────────┐
│  :root — --color-surface-border (RGB ~ slate-300) já definido      │
│          Ajuste fino opcional se QA exigir (documentar no PR)      │
├────────────────────────────────────────────────────────────────────┤
│  @layer components — CLARO: bordas de .planner-*, .admin-* alinhadas │
│          ao token onde hoje "colam" a bg-slate-100                 │
│          ESCURO: dark: inalterado salvo regressão (NFR-VIS-THEME-04) │
├────────────────────────────────────────────────────────────────────┤
│  Páginas — Settings.tsx (toggle); varredura opcional border-*      │
└────────────────────────────────────────────────────────────────────┘
```

**Regra:** não introduzir variável nova paralela (ex.: `--border-light-only`) **sem** ADR — preferir uso do token existente ou tonalidade Tailwind explícita alinhada à UX spec.

---

## 4. Fluxo técnico — interruptor de tema (FR-VIS-THEME-08)

| Peça | Responsabilidade |
|------|------------------|
| **Estado** | `useThemeStore` — única fonte de verdade (`isDarkMode`, `toggleTheme`). |
| **DOM** | Um elemento focável por toggle; após refactor: `role="switch"`, `aria-checked`, `aria-label` (UX spec §5.3). |
| **Estilo claro — off** | Trilho com borda visível **ou** `bg` suficientemente distinto de `body` (`bg-slate-100`); sem segundo estado duplicado no store. |
| **Estilo escuro — on** | Manter contraste thumb/trilho; não alterar lógica de negócio. |
| **Foco** | Reutilizar padrão global: `focus-visible` + ring (base `index.css` § focus-ring). |

**Anti-padrão:** segundo `useEffect` que sincronize tema a partir do DOM — **rejeitado**; o store continua a autoridade.

---

## 5. Estratégia de implementação (ordem recomendada)

1. **`index.css`** — classes base listadas no PRD (superfícies + `.planner-button-secondary`); validar **só tema claro** em 1–2 ecrãs (Definições, vista admin com toolbar).  
2. **`Settings.tsx`** — toggle Aparência (semântica + visual off no claro).  
3. **Varredura mecânica** — `rg "border-slate-200"` / `border-slate-200/` em `frontend/src` nos módulos prioritários (MEI, admin), substituindo apenas onde o contorno **exterior** cola ao fundo (UX spec §6).  
4. **Regressão escuro** — checklist técnico mínimo (§7 deste doc).  
5. **Evidência** — nota de PR ou `docs/qa/` com pares para **NFR-VIS-THEME-01**.

---

## 6. Descoberta e critérios de merge (apoio ao dev)

| Padrão de busca | Uso |
|-----------------|-----|
| `border-slate-200` sem `dark:` vizinho em componentes de cartão | Candidato a alinhar ao token no **bloco claro** |
| `.planner-button-secondary` | Rever primeiro em `index.css` antes de overrides em TSX |
| `bg-gray-300` + `rounded-full` (toggle) | Ficheiro `Settings.tsx` |

**Merge:** CI verde (`npm run lint`, `npm run typecheck` no `frontend`); revisão visual opcional 1 screenshot claro/escuro para toggle.

---

## 7. Regressão tema escuro (NFR-VIS-THEME-04) — verificação técnica

| Verificação | Método |
|-------------|--------|
| Classes `.dark` em `index.css` para as mesmas regras editadas | Diff: garantir que `dark:border-*` / fundos escuros **não** foram removidos inadvertidamente |
| Toggle em Definições | Alternar tema; trilho e thumb legíveis |
| Cartão admin numa rota representativa | Comparar antes/depois em screenshot se disponível |

---

## 8. Dependências e toolchain

| Item | Nota |
|------|------|
| Novas dependências npm | **Nenhuma** obrigatória |
| Tailwind | Manter `darkMode: 'class'`; arbitrary value `border-[color:rgb(var(--color-surface-border))]` permitido |
| Testes automatizados | Não exigidos pelo PRD; opcional teste RTL de `aria-checked` no toggle após semântica |

---

## 9. Riscos técnicos e mitigação

| Risco | Mitigação |
|-------|-----------|
| **Especificidade** — utilitários Tailwind no TSX a ganharem sobre `@layer components` | Reduzir override local; preferir classe componente |
| **Tabelas** — `border-t` em linhas mais claras que o shell | UX spec §3.3: coerência shell ↔ linhas; ajustar shell primeiro |
| **Diff grande** em página longa | PR incremental (**NFR-VIS-THEME-03**) |

---

## 10. Relação com outros artefatos

| Documento | Relação |
|-----------|---------|
| [`architecture-revisao-visual-temas-claro-escuro-2026-04-17.md`](./architecture-revisao-visual-temas-claro-escuro-2026-04-17.md) | Camadas gerais e Onda 0/1 |
| [`PRD-revisao-visual-temas-claro-escuro-2026-04-17.md`](../prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md) | FR **01–04**; paridade e checklist global |
| [`docs/framework/tech-stack.md`](../framework/tech-stack.md) | Stack do repo; sem mudança |

---

## 11. Histórico

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-17 | Versão inicial a partir do PRD modo claro e UX spec |
