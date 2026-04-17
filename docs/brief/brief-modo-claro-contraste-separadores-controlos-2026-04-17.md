# Brief: modo claro — contraste de linhas, separadores e controlos (caixas, interruptores, botões)

**Data:** 2026-04-17  
**Origem:** pedido de produto (Atlas / analista)  
**Produto:** Meu Financeiro (`frontend/`, Tailwind + tokens em `src/index.css`)  
**Relaciona com:** `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`, epic/stories **VIS-THEME** em `docs/stories/`, PRD de revisão visual de temas (2026-04-17)

---

## 1. Resumo executivo

O **tema claro** continua a apresentar **contornos e realces pouco perceptíveis**: linhas de separação, bordas de caixas e periféricos de **interruptores** e **botões secundários/outline** ficam **demasiado próximos da cor de fundo** (`bg-slate-100` no `body`, superfícies `white/80`, gradientes claros). O utilizador percebe o layout como “plano” e perde hierarquia entre blocos.

Este brief define o **problema**, o **âmbito** e os **critérios de aceite** para uma iteração focada **só no modo claro** (sem alterar a intenção visual do escuro, salvo regressão cruzada).

---

## 2. Diagnóstico

| Área | Sintoma | Causa provável (técnica) |
|------|---------|---------------------------|
| **Fundo vs superfície** | Caixas e cartões “derretem” no fundo | `body` em `slate-100` com cartões em `white/80` ou `slate-50/80`; bordas `slate-200` sem opacidade extra ficam com **delta de luminância baixo** junto ao fundo. |
| **Separadores e divisórias** | Linhas quase invisíveis | Uso generalizado de `border-slate-200` (e variantes `/70`–`/90`) sobre fundos também claros; em alguns blocos, **ausência de borda** ou só sombra suave. |
| **Botões secundários / outline** | Contorno do botão confunde-se com o fundo | `.planner-button-secondary` e padrões `border-slate-200` sobre `bg-white/70` — contraste de **stroke** fraco. |
| **Interruptores (toggle)** | Trilho ou “polegar” pouco distinto | Componentes ou `role="switch"` que dependem de cinzentos médios (`slate-300`–`400`) sobre fundos claros semelhantes; falta de **anel ou borda** explícita no estado inativo/off no claro. |
| **Tokens** | Inconsistência entre `--color-surface-border` e classes utilitárias | Token em `:root` já aponta para `slate-300`, mas muitas classes ainda usam **`slate-200`** diretamente, não o token nem um par canónico reutilizável. |

**Nota:** O brief anterior já reforçou shell (header, sidebar, bottom nav) e tokens globais; este documento **acentua o gap restante no modo claro** em **controlos e caixas** reutilizados em admin, planner e formulários.

---

## 3. Objetivos (o que “bom” significa)

1. **Legibilidade de contorno:** qualquer utilizador sem zoom consegue ver **onde termina um bloco** e **onde começa outro** (caixa, toolbar, linha de tabela), no tema claro.
2. **Controlos reconhecíveis:** interruptores e botões não preenchidos têm **limite visível** no estado repouso (off / secondary), sem depender só da cor de preenchimento.
3. **Consistência:** preferir **um par canónico** de bordas para o claro (alinhado a `--color-surface-border` ou classe utilitária única, ex. `.ui-border-section` já existente) e aplicá-lo aos padrões de cartão, secção e fila de tabela.
4. **Não regredir o escuro:** alterações passam por **checklist rápido** tema escuro nas mesmas telas (ver critérios).

---

## 4. Âmbito de mudança sugerido (entrega)

| Camada | Ação sugerida |
|--------|----------------|
| **Tokens / base** | Rever `:root` e, se necessário, **alinhar** `--color-surface-border` ao tom usado nas classes (ou inverter: atualizar classes para consumir `rgb(var(--color-surface-border))` onde fizer sentido). |
| **Componentes reutilizáveis (`index.css`)** | Revisar **modo claro** de: `.planner-surface`, `.planner-card`, `.planner-card-muted`, `.planner-button-secondary`, `.admin-toolbar`, `.admin-table-shell`, `.admin-table-row`, `.admin-stat-card`, `.admin-empty-state` — garantir borda ou separador **≥ perceptibilidade** vs `body` (sem peso excessivo). |
| **Interruptores** | Localizar implementação (Radix, headless ou nativo) e, no **tema claro**, reforçar **borda do trilho** ou **contraste fundo/borda** no estado off; manter foco visível (`focus-ring`). |
| **Páginas com classes ad hoc** | Onde persistirem `border-slate-200/80` isolados em TSX longos (ex.: fluxos MEI), **substituir** pelo par canónico ou por classe de secção já definida na UX spec. |
| **QA** | Amostragem com ferramenta tipo WebAIM nos pares **fundo/borda** e **texto ícone** nos controlos tocados (**NFR-VIS-THEME-01** na documentação existente). |

**Fora de escopo explícito deste brief:** nova paleta de marca; redesign de componentes; auditoria WCAG integral do site.

---

## 5. Critérios de aceite (verificáveis)

- [ ] Em **tema claro**, numa página representativa (ex.: dashboard admin + um formulário com toggle), **todas** as caixas principais (cartão, toolbar, tabela) mostram **contorno ou separação** claramente distinguível do fundo da página.
- [ ] **Botões secundários** (incl. `.planner-button-secondary`) têm **borda ou fundo** perceptível em repouso sobre `bg-slate-100` / cartão claro.
- [ ] **Interruptores** em repouso (off) no claro têm **trilho ou contorno** visível; estado on mantém distinção óbvia.
- [ ] **Sem regressão grave** no tema escuro nas mesmas áreas (checklist manual curto).
- [ ] Evidência ou nota de **amostragem de contraste** (ligações à story P0 de QA VIS-THEME ou ficheiro em `docs/qa/` conforme processo do projeto).

---

## 6. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Bordas “pesadas” no claro (queixa NFR-VIS-THEME-02) | Aumentar contraste com **tom único** (ex. `slate-300`) e **1px**, evitar dupla borda + sombra forte ao mesmo tempo. |
| Divergência TSX vs CSS | Preferir **classe utilitária de secção** ou token; documentar o par no fecho da story. |

---

## 7. Próximos passos de governação

1. **PO / UX:** validar este brief e encaixar no epic **VIS-THEME** (nova story ou extensão da **02** — divisórias/bordas).  
2. **Frontend:** implementação incremental em `index.css` + componentes de switch; depois varredura pontual em TSX.  
3. **QA:** repetir checklist §8 da UX spec onde aplicável, com foco extra em **modo claro**.

---

## 8. Referências no repositório

- Brief anterior (contexto geral): `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`  
- Stories: `docs/stories/story-vis-theme-p1-guidesmei-divisorias-bordas.md`, `story-vis-theme-p1-modais-fecho-e-classes-ui.md`, `story-vis-theme-p0-qa-regressao-visual-e-contraste.md`  
- Estilos base: `frontend/src/index.css` (`:root`, `@layer components`)
