# Story — VIS-THEME (P1): Modais — fecho legível e classes UI opcionais

**ID:** STORY-VIS-THEME-01  
**Prioridade:** P1  
**Epic:** E-VIS-THEME-1  
**Estado (backlog):** Pronta para desenvolvimento (refinada após feedback PO)  
**Estimativa:** S–M (1–3 dias úteis, conforme uso de classe global opcional e nº de ficheiros)  
**Dono sugerido:** Frontend  
**Depende de:** — (pode iniciar em paralelo a shell já entregue na Onda 0)  
**Fonte:** `docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md` (FR-VIS-THEME-02, FR-VIS-THEME-04)  
**Especificação UX:** `docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md` §5.3, §5.4, §6, §7  
**Arquitetura:** `docs/technical/architecture-revisao-visual-temas-claro-escuro-2026-04-17.md` §5.1  
**QA consolidada (Onda 1):** [STORY-VIS-THEME-03](./story-vis-theme-p0-qa-regressao-visual-e-contraste.md) — o ficheiro opcional `docs/qa/evidence-vis-theme-01-contraste.md` pode ser referenciado na evidência global dessa story.

## User story

**Como** utilizador que alterna entre tema claro e escuro,  
**quero** que o **fecho** do modal e outros **controlos só-ícone** no cabeçalho do modal tenham **contraste legível** e área tocável adequada,  
**para** conseguir fechar ou usar essas ações sem procurar o ícone “invisível”.

## Definições (refinamento PO)

- **Modal abrangido (obrigatório):** `MeiCatalogoProdutoModal.tsx`, `MeiCatalogoClienteModal.tsx`.  
- **Ação secundária equivalente (âmbito desta story):** botão **`button` com apenas ícone Lucide** no **chrome do modal** além do fecho **ou** o próprio fecho quando for o único só-ícone no header. O **fecho (X)** conta como só-ícone no header; se for o **único**, o critério “outros só-ícones” abaixo fica **N/A** (ver critério de aceite correspondente). **Não** inclui ícones dentro do corpo do formulário com rótulo de texto ao lado (ver §5.4 da UX spec para esse caso).  
- **Âmbito alargado (opcional, mesmo PR):** no máximo **3** ficheiros `.tsx` adicionais que sejam **modais** ou **diálogos fullscreen** com o mesmo padrão problemático (fecho/`absolute`+cinza fraco), desde que o total de ficheiros de componente tocados **não exceda 5** (2 obrigatórios + 3). Acima disso: **nova story** ou aprovação explícita de PO.  
- **Pré-requisito para alargar:** comentário no PR com lista dos ficheiros extra e justificativa em **uma linha** por ficheiro.

## Contexto técnico

- Ícones Lucide usam `currentColor`; aplicar classes `text-*` no controlo pai conforme UX spec §5.3 (ex.: claro `text-slate-500` / hover `text-slate-800`; escuro `text-slate-300` / hover `text-slate-50`).  
- **Evitar** `text-slate-400` como **único** estado sobre fundos escuros quando o contraste for insuficiente.  
- **Opcional:** introduzir `.ui-modal-icon-dismiss` em `frontend/src/index.css` (UX spec §6) e reutilizar nos fechos abrangidos — documentar na UX spec §6 no merge.  
- **Paridade:** não envolver `.planner-card` com segunda borda sem necessidade (**FR-VIS-THEME-04**).

## Critérios de aceite

- [x] **Fecho:** em cada modal obrigatório, o botão de fechar cumpre §5.3 da UX spec (`aria-label`, área tocável ≥ 44×44 px ou `p-2` equivalente, cores default/hover).  
- [x] **Só-ícone no header (além do fecho):** **Se** existir noutro botão só-ícone no cabeçalho do modal (definição acima), cumpre §5.3 (contraste e toque). **Se não existir** (apenas o fecho no header): indicar **N/A** na descrição do PR com **uma linha** por modal obrigatório, por exemplo: `ClienteModal: N/A — só ícone de fecho no header.`  
- [ ] Tema **claro** e **escuro** verificados manualmente em todos os modais alterados. *(Pendente no PR / QA.)*  
- [ ] **NFR-VIS-THEME-01:** registo obrigatório na **descrição do PR** (secção “Contraste” ou equivalente): para **cada** modal onde foi alterado `text-*` ou `border-*` em controlo interativo, indicar par **fundo + primeiro plano** e resultado **passa WCAG 2.2 AA texto normal** (ratio ou “pass AA”) **ou** correção aplicada. *(Rascunho para colar no PR em “Completion Notes” desta story.)* Opcionalmente duplicar o mesmo sumário em `docs/qa/evidence-vis-theme-01-contraste.md` (criar se a equipa quiser arquivo persistente além do Git hosting).  
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes no `frontend`.  
- [x] Nenhuma alteração funcional de negócio (só classes / eventual classe CSS global documentada).

## Fora de escopo

- Refactor de lógica de formulário, validação ou chamadas API nos modais.  
- `GuidesMei.tsx` (covered por [STORY-VIS-THEME-02](./story-vis-theme-p1-guidesmei-divisorias-bordas.md)).

## File list (checklist implementação)

- [x] `frontend/src/components/MeiCatalogoProdutoModal.tsx` (**obrigatório**)  
- [x] `frontend/src/components/MeiCatalogoClienteModal.tsx` (**obrigatório**)  
- [ ] Até **3** modais/diálogos extra — só se cumprir limite de 5 ficheiros e critério da secção “Definições”  
- [x] `frontend/src/index.css` (se `.ui-modal-icon-dismiss` ou ajuste global)  
- [x] `docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md` (atualizar §6 se nova classe)  
- [x] `docs/qa/evidence-vis-theme-01-contraste.md` (**opcional** — arquivo de evidência NFR)

## Definition of Done

- Critérios de aceite satisfeitos; revisão de PR confirma **apenas** mudanças visuais.  
- Descrição do PR liga **esta story**, o **PRD** e contém evidência mínima **NFR-VIS-THEME-01** (não só “ver comentários noutro doc” sem parágrafo no PR).

## Notas de refinamento (PO → SM)

- **2026-04-17 (1.ª ronda):** âmbito máx. 5 ficheiros, só-ícone no chrome, evidência NFR no PR + opcional `docs/qa/`, estimativa e dono.  
- **2026-04-17 (2.ª ronda):** critério **N/A** quando não há segundo só-ícone no header; ligação explícita a [STORY-VIS-THEME-03](./story-vis-theme-p0-qa-regressao-visual-e-contraste.md) para evidência consolidada.

## Qualidade / CodeRabbit

- PR pequeno e focado (**NFR-VIS-THEME-03**).  
- Respeitar `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` em qualquer texto/comportamento MEI — só IU.

---

## Dev Agent Record

### Status

Implementado (aguarda PR / revisão)

### Agent Model Used

—

### Completion Notes List

- Classe `.ui-modal-icon-dismiss` em `index.css` (§5.3: cores + `min-h-11 min-w-11` + glifo × legível).
- Modais obrigatórios: só fecho no header → na descrição do PR usar linhas N/A conforme story.
- **Contraste (NFR, para colar no PR):** fundo do cartão ≈ branco (`planner-card` / slate-50) + ícone `text-slate-500` (#64748b) → pass AA sobre branco; tema escuro fundo `slate-900`/`950` + `text-slate-300` (#cbd5e1) → pass AA. Hover claro `slate-800`, escuro `slate-50` — contraste reforçado.
- **Evidência NFR persistente:** `docs/qa/evidence-vis-theme-01-contraste.md` (equivalentes sólidas §7 UX spec + tabela N/A). O PR deve ainda incluir **um parágrafo próprio** na secção Contraste (DoD), podendo referenciar esse ficheiro como anexo.
- **Seguir o QA:** testes de regressão no fecho (`aria-label` + `ui-modal-icon-dismiss`) em `MeiCatalogoClienteModal.test.tsx` e `MeiCatalogoProdutoModal.test.tsx`.

**Texto sugerido para descrição do PR (copiar/adaptar):**

**Contraste (NFR-VIS-THEME-01)**  
- `MeiCatalogoProdutoModal` — fundo equiv. claro ~#fff / escuro ~#0f172a; ícone slate-500 / dark slate-300 → pass AA (detalhe: `docs/qa/evidence-vis-theme-01-contraste.md`).  
- `MeiCatalogoClienteModal` — idem.

**Só-ícone no header (além do fecho)**  
- `MeiCatalogoProdutoModal`: N/A — só ícone de fecho no header.  
- `MeiCatalogoClienteModal`: N/A — só ícone de fecho no header.

### File List (implementação)

- `frontend/src/index.css`
- `frontend/src/components/MeiCatalogoProdutoModal.tsx`
- `frontend/src/components/MeiCatalogoClienteModal.tsx`
- `frontend/src/components/MeiCatalogoProdutoModal.test.tsx`
- `frontend/src/components/MeiCatalogoClienteModal.test.tsx`
- `docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md` (§6)
- `docs/qa/evidence-vis-theme-01-contraste.md`

### Debug Log References

—

### Change Log

- **2026-04-17** — Follow-up QA: `docs/qa/evidence-vis-theme-01-contraste.md`, testes fecho nos modais, texto modelo PR (*Completion Notes*).
- **2026-04-17** — Implementação: `.ui-modal-icon-dismiss` + modais catálogo produto/cliente (Dex).
- **2026-04-17** — Story criada (SM) a partir do PRD, UX spec e arquitetura.  
- **2026-04-17** — Refinamento: feedback PO (âmbito máx. 5 ficheiros, definição só-ícone no header, evidência NFR no PR + opcional `docs/qa/`, estimativa, dono, critérios de aceite explícitos para fecho vs header).  
- **2026-04-17** — Refinamento 2: AC com **N/A** explícito para “outros só-ícones” quando só existe fecho; meta **QA consolidada** + ficheiro opcional alinhado a STORY-VIS-THEME-03.

---

## QA Results

**Data:** 2026-04-17 · **Revisor:** Quinn (AIOX QA)

**Gate:** PASS condicional — merge após verificação manual claro/escuro, descrição do PR com NFR-VIS-THEME-01 + linhas N/A (segundo só-ícone), e CI verde.

**Rastreio:** Fecho §5.3 e paridade FR-VIS-THEME-04 satisfeitos no código; N/A só-ícones extra e NFR no PR ainda pendentes de processo; testes automatizados do fecho opcionais.

**Notas:** Para NFR, documentar no PR fundo real ou equivalente sólido sobre `planner-card` (§7 UX spec).

**Follow-up Dev (2026-04-17):** Evidência `docs/qa/evidence-vis-theme-01-contraste.md` com equivalentes sólidas §7; testes de regressão no fecho nos dois modais; texto modelo para PR em *Completion Notes*. **Pendente humano:** colar parágrafo NFR no PR, checklist visual claro/escuro no browser.

**Evidência Onda 1 (STORY-VIS-THEME-03):** [evidence-vis-theme-onda1-qa.md](../qa/evidence-vis-theme-onda1-qa.md) (checklist §8 item 8).
