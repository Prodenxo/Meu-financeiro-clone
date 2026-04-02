# Story — LIM-MEI-03: Integração — Mei Infinito (`GuidesMei`) e atualização pós NFS-e

**ID:** STORY-LIM-MEI-03  
**Prioridade:** P0 (Must — PRD onda 1)  
**Depende de:** **LIM-MEI-01**, **LIM-MEI-02**  
**Fonte:** `docs/prd/PRD-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md` §5.1, §7 (FR-LIM-01, FR-LIM-08), §12  
**Especificação UX:** `docs/specs/ux-spec-mei-infinito-limite-faturamento-2026-04-02.md` §3, §4, §8, §13

## User story

**Como** utilizador na área **Mei Infinito** (`/guias-mei`),  
**quero** ver o bloco de **limite de faturamento** no sítio certo da página (sem números repetidos sem valor) e ver o indicador **atualizar** quando emitir ou cancelar NFS-e,  
**para** confiar no progresso mostrado sem recarregar a página.

## Contexto técnico

- **Ficheiro principal:** `frontend/src/pages/GuidesMei.tsx` (e hooks/estado já existentes para lista NFS-e).  
- **Colocação (PO + UX):** exatamente **uma** das opções — **A)** hero **L1** (extensão do hero após `admin-stat-grid`, p.ex. faixa ou 5.º KPI) **ou** **B)** apenas **visão geral** **L3** com linha no hero sem valores duplicados e link/scroll (**UX §3.1**). A story deve implementar **a variante escolhida** e documentar a constante/feature flag no *Completion Notes* se aplicável.  
- **FR-UX-MEI-01:** se o bloco estiver só em L3, o hero **não** mostra o mesmo par utilizado/limite/% (**UX §3.2**).  
- **FR-LIM-08:** após emissão ou cancelamento de NFS-e que altere o somatório do ano, o indicador atualiza (invalidação do estado, *refetch* conforme **LIM-MEI-01**); evitar *polling* agressivo (**UX §8**, **NFR-LIM-02**).  
- **Loading:** estado de carregamento discreto no bloco sem saltar layout do hero (**UX §8**).

## Critérios de aceite

### Integração de UI

- [ ] O componente de **LIM-MEI-02** está integrado em `GuidesMei` na variante **A ou B** acordada; existe **apenas um** bloco com utilizado/limite/% para este indicador (**FR-LIM-01** + **FR-UX-MEI-01**).  
- [ ] Em mobile, o bloco respeita **UX §11** (coluna única, CTAs tocáveis ≥ 44×44 px onde houver controlo).

### FR-LIM-08 — Atualização

- [ ] Após **emitir** NFS-e com sucesso (fluxo já existente na página), o progresso do limite **reflete** a nova nota sem reload completo da app.  
- [ ] Após **cancelar** NFS-e (se o fluxo existir e alterar o somatório do ano), o progresso **reflete** a remoção.  
- [ ] Não introduzir *polling* desnecessário; preferir invalidação ligada ao mesmo estado que alimenta a lista (**UX §8**).

### Regressão e qualidade

- [ ] `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados (**NFR-LIM-03**).  
- [ ] Testes existentes da rota `/guias-mei` (ex.: `App.mei-gate.test.tsx`) permanecem verdes ou atualizados explicitamente.  
- [ ] Checklist **UX §13** (integração + refresco) verificado em QA manual breve.

### NFRs

- [ ] Sem regressão visual gritante nos KPIs existentes do hero (**NFR-LIM-04**).

## Fora de escopo

- Alterações ao catálogo ou regras fiscais reais.  
- Bloqueio de emissão por percentagem (**fora do MVP**).  
- P1: outras fontes de receita / ajuste manual.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] Ficheiros auxiliares tocados por estado/*query* (se existirem)  
- [x] Testes atualizados/novos

## Definition of Done

- PO confirma variante **A vs B** e ausência de duplicação de números.  
- Critérios de release **PRD §12** aplicáveis a esta integração cumpridos em conjunto com **LIM-MEI-01** e **LIM-MEI-02**.

## Qualidade / CodeRabbit

- Alterações focadas; evitar refactor alargado não pedido em `GuidesMei.tsx` (**Dev agent: extrair só se reduzir risco**).  
- Validar teclado e SR no contexto real da página, não só no componente isolado.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação LIM-MEI-03)

### Completion Notes List

- **Variante escolhida: B (L3 + hero sem duplicação).** Bloco canónico `MeiLimiteFaturamentoBlock` mantém-se só na **Visão geral**; no **hero** foi adicionada faixa informativa + botão «Abrir limite na Visão geral» que faz `setActiveWorkspace('overview')` + scroll para `#mei-limite-faturamento-anchor` — sem R$ nem % no hero (FR-UX-MEI-01).
- **FR-LIM-08:** emissão já fazia `loadNfseList()` após sucesso; **cancelamento** passa a `await loadNfseList()` após API OK (refetch do mesmo estado que alimenta `meiLimiteBundle`, sem polling novo).
- Testes `GuidesMei.limite-integracao.test.tsx`: (1) hero + âncora L3; (2) **FR-LIM-08** — após fluxo cancelar com `confirm`/`prompt` mockados, `listarNfse` é chamado mais vezes do que após o mount (mitigação observação QA). `npm run typecheck` e `npm test` (frontend) a verde.
- DoD PO, checklist UX §13 manual no browser e CodeRabbit WSL permanecem passos de processo/revisão.

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.limite-integracao.test.tsx`

### Debug Log References

—

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | Story criada pelo SM (River) a partir do PRD e da spec UX limite de faturamento. |
| 2026-04-02 | Variante B: atalho hero + âncora L3; refetch lista após cancelar NFS-e; teste de integração. |
| 2026-04-02 | Follow-up QA: teste automatizado refetch `listarNfse` pós-cancelar (`GuidesMei.limite-integracao.test.tsx`). |

---

## QA Results

### Revisão QA — 2026-04-02 (Quinn)

**Gate:** **PASS** (com observações não bloqueantes)

#### Rastreio aos critérios

| Área | Evidência |
|------|-----------|
| Integração UI (variante A ou B) | **Variante B** documentada no Dev Agent Record: bloco `MeiLimiteFaturamentoBlock` só na **Visão geral** (`#mei-limite-faturamento-anchor`); hero com faixa textual + botão «Abrir limite na Visão geral» — **sem** R$, limite ou % duplicados no hero (FR-UX-MEI-01). KPI «Notas exibidas» continua a ser contagem de linhas filtradas, não o par utilizado/limite do indicador. |
| UX §11 (mobile / toque) | Botão do atalho com `min-h-[44px]`; layout da faixa em coluna em `flex-col` e `sm:flex-row`. |
| FR-LIM-08 — emitir | `handleEmitNfse`: após sucesso, `await Promise.all([loadNfseList(), loadNfseCatalog()])` — `nfseList` atualiza `meiLimiteBundle` via `useMemo` (sem reload da app). |
| FR-LIM-08 — cancelar | `handleCancelNfse`: após `cancelarNfse` OK, `await loadNfseList()` com comentário LIM-MEI-03; sem polling novo. |
| Sem polling agressivo | Apenas refetch explícito nos fluxos acima + efeitos já existentes em `loadNfseList`. |
| Regressão / qualidade | `npm run typecheck` OK; `App.mei-gate.test.tsx` + `GuidesMei.limite-integracao.test.tsx` executados nesta revisão: **12 testes** OK. |
| NFR-LIM-04 | Grelha `admin-stat-grid` mantida; faixa adicional abaixo não altera os quatro KPIs de forma disruptiva. |

#### Testes automatizados

- `GuidesMei.limite-integracao.test.tsx`: copy do hero (incl. regra «não repetimos valores em R$ nem percentagem»), clique no atalho, presença de `#mei-limite-faturamento-anchor` e `#mei-panel-overview`.
- **Lacuna aceitável:** não há teste que conte chamadas a `listarNfse` após cancelar (exigiria mock de `window.confirm`/`prompt` e spy); o comportamento é verificável por revisão de código e QA manual no fluxo NFS-e.

#### Observações (não bloqueantes)

1. **DoD:** confirmação explícita do **PO** (variante B e ausência de duplicação percebida pelo utilizador) permanece passo humano.  
2. **Nota em processamento após emitir:** o somatório do limite (LIM-MEI-01) só inclui notas **concluídas**; após emitir, a lista pode atualizar antes do status definitivo — comportamento esperado, não regressão desta story.  
3. **UX §13:** checklist manual de integração + refresco em browser real continua recomendado antes do merge.  
4. **CodeRabbit (WSL):** não executado nesta revisão.

#### Conclusão

Implementação **alinhada** a LIM-MEI-03 (variante B, refetch pós-cancelamento, coerência com refetch pós-emissão). **PASS** com observações acima.
