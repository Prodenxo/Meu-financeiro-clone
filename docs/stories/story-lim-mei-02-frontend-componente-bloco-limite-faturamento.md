# Story — LIM-MEI-02: Frontend — componente do bloco canónico «Limite de faturamento» (MEI)

**ID:** STORY-LIM-MEI-02  
**Prioridade:** P0 (Must — PRD onda 1)  
**Depende de:** **LIM-MEI-01** (tipos, regras de estado e dados de entrada)  
**Fonte:** `docs/prd/PRD-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md` §5.1, §7 (FR-LIM-01 a FR-LIM-07)  
**Especificação UX:** `docs/specs/ux-spec-mei-infinito-limite-faturamento-2026-04-02.md` §3–§7, §9–§11

## User story

**Como** utilizador na área **Mei Infinito**,  
**quero** um **único** bloco claro que mostre progresso do faturamento contabilizado face ao limite de referência do ano, com período, base de cálculo, vigência, estados de proximidade e aviso legal,  
**para** perceber em poucos segundos se estou confortável, em atenção ou em situação crítica, sem tratar o indicador como valor oficial da Receita.

## Contexto técnico

- **Contrato de dados:** props/resultado alinhados a **LIM-MEI-01** (total utilizado, limite, %, ano civil, vigência, estado de proximidade, flags de loading/erro).  
- **FR-UX-MEI-01:** este bloco é a **zona canónica** para valor monetário principal e percentagem do limite — não duplicar os mesmos números noutros sítios (**integração final em LIM-MEI-03**).  
- **Tokens / CSS:** `docs/specs/ux-spec-mei-infinito-limite-faturamento-2026-04-02.md` §10 (`admin-section-card`, `planner-card`, `admin-badge-*`, `admin-alert-*`, sem novo tema global).  
- **Barra de progresso:** semântica §5.4 (`role="progressbar"`, `aria-*` coerentes; edge > 100 % com mensagem explícita).

## Critérios de aceite

### FR-LIM-01 — Bloco canónico (conteúdo)

- [x] Um componente (ou composição) apresenta **progresso** vs **limite de referência** no **ano corrente**, com unidade monetária e percentagem e/ou barra.  
- [x] **Período** (ano civil) visível no título ou subtítulo (**FR-LIM-02**).  
- [x] **Vigência** do limite de referência ou data de atualização visível (**FR-LIM-03**).

### FR-LIM-02 — Base de cálculo

- [x] Linha explícita da **base MVP** (ex.: soma das NFS-e emitidas nesta conta no ano civil), com **tooltip/popover** acessível ao teclado para detalhe sem esconder a linha base (**UX §5.1 item 5, §9**).

### FR-LIM-04 — Proximidade

- [x] Três níveis (*Seguro / Atenção / Crítico* ou rótulos aprovados por PO) com **mensagem** e **estilo** distintos; limiares vindos da config **LIM-MEI-01** (**NFR-LIM-01** contraste).

### FR-LIM-05 — Disclaimer

- [x] **Disclaimer** informativo sempre descobrível (rodapé do bloco ou linha sob os valores), conforme PRD §6 e UX §6 (sem depender só de hover).

### FR-LIM-06 — Acessibilidade

- [x] Leitores de ecrã: região com título; anúncio coerente de valores, %, estado e período; **aria-live** `polite` em atualizações se aplicável (**UX §9**).  
- [x] Ordem de foco: título → progresso → base → disclaimer → CTAs (**UX §9**).  
- [x] Links *Saber mais* / *Ir para NFS-e* (se existirem) com foco visível.

### FR-LIM-07 — Empty state

- [x] Quando não há notas no ano (ou total zero conforme contrato), mensagem honesta + opcional CTA *Emitir NFS-e*; ainda assim mostrar limite/vigência se o contrato o previr (**UX §5.2**).

### Estados de dados UX §5.2

- [x] Estado **erro/indisponível** com `role="alert"` e mensagem neutra, alinhado a padrões da página.

### Qualidade

- [x] `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados (**NFR-LIM-03**).  
- [x] Testes (RTL ou equivalente) cobrindo empty, um estado de proximidade e progressbar/aria essenciais.

## Fora de escopo

- Decisão **hero (L1) vs visão geral (L3)** e eliminação de duplicação com o resto da página — **LIM-MEI-03**.  
- Lógica de **refetch** após emitir/cancelar NFS-e — **LIM-MEI-03**.  
- Novo endpoint se não for pré-requisito do componente isolado.

## File list (checklist implementação)

- [x] Componente(s) em `frontend/src/` (caminho exato na implementação)  
- [x] Ajustes pontuais em `frontend/src/index.css` apenas se tokens locais forem necessários (**UX §10**, variante `.admin-limit-progress-track` ou similar)  
- [x] Ficheiros de teste associados

## Definition of Done

- Revisão visual/copy mínima com PO nas strings finais (disclaimer e microcopy **UX §7**).  
- Checklist **UX spec §13** aplicável ao bloco satisfeita ao nível do componente.

## Qualidade / CodeRabbit

- Evitar hex solto; reutilizar tokens existentes (**NFR-LIM-04**).  
- Não alarmismo na copy; CTAs calmos (**PRD §2**).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação LIM-MEI-02)

### Completion Notes List

- Componente `MeiLimiteFaturamentoBlock`: progresso vs limite, período/vigência, base MVP com detalhe expansível (teclado + Esc), disclaimer sempre visível, `role="progressbar"` + `aria-live`, estados proximidade (badges `admin-*`), empty e erro.
- Integração na **Visão geral** (`overview`) em `GuidesMei.tsx` com `computeMeiLimiteProgresso` + `getVigenciaLabelParaAno`; colocação hero vs duplicação fica para LIM-MEI-03.
- CSS local: `.admin-limit-progress-track` / `.admin-limit-progress-fill` em `index.css`.
- `npm run typecheck` e `npm test` (frontend) passam; testes novos em `MeiLimiteFaturamentoBlock.test.tsx`.
- Follow-up QA (2026-04-02): removido import `Link` não utilizado em `GuidesMei.tsx` (ESLint). Revisão de copy com PO (DoD) e CodeRabbit em WSL permanecem como passos de processo antes do merge, conforme observações QA.

### File List (implementação)

- `frontend/src/components/MeiLimiteFaturamentoBlock.tsx`
- `frontend/src/components/MeiLimiteFaturamentoBlock.test.tsx`
- `frontend/src/index.css`
- `frontend/src/pages/GuidesMei.tsx`

### Debug Log References

—

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | Story criada pelo SM (River) a partir do PRD e da spec UX limite de faturamento. |
| 2026-04-02 | Bloco UI + testes + integração overview. |
| 2026-04-02 | Follow-up QA: lint `GuidesMei.tsx` (import `Link` removido). |

---

## QA Results

### Revisão QA — 2026-04-02 (Quinn)

**Gate:** **PASS** (com observações não bloqueantes)

#### Rastreio aos critérios de aceite

| Critério | Evidência |
|----------|-----------|
| FR-LIM-01 (progresso, ano, vigência) | `MeiLimiteFaturamentoBlock.tsx`: título, subtítulo com ano + `vigenciaLabel`, valores e barra quando há limite. |
| FR-LIM-02 (base MVP + detalhe) | Linha fixa «Base (MVP)» + botão expansível com `aria-expanded` / `aria-controls` / `Esc`; não é tooltip flutuante, cumpre intenção UX de detalhe acessível ao teclado. |
| FR-LIM-04 (proximidade) | Badges `admin-badge-*` + mensagens por banda; limiares via `MeiLimiteProgresso.banda` (LIM-MEI-01). Rótulo «Confortável» alinhado a alternativa à palavra «Seguro» na story. |
| FR-LIM-05 (disclaimer) | Bloco «Aviso:» sempre visível, sem depender de hover. |
| FR-LIM-06 (a11y) | `section` com `aria-labelledby`; `aria-live="polite"` em região sr-only; `role="progressbar"` com `aria-valuemin`/`max`/`now` (valor da barra vem de `percentualUtilizadoParaBarra`, com clamp 0–100 em LIM-MEI-01); botões/links com `focus-visible`. |
| FR-LIM-07 (empty) | Mensagem quando `notasConsideradas === 0` e total 0; barra a 0% se limite configurado; vigência no subtítulo. |
| Erro UX §5.2 | `role="alert"` quando `errorMessage` definido. |
| Qualidade | `npm run typecheck` e `npm test` (frontend): **270 testes passaram** nesta revisão. `npm run lint`: **0 erros** (avisos pré-existentes no pacote). |

#### Testes automatizados (componente)

`MeiLimiteFaturamentoBlock.test.tsx`: empty + `progressbar`/aria, estado seguro, CTA «Ir para NFS-e», erro com alert, expansão da base. Cobertura alinhada ao critério «empty + proximidade + progressbar». Lógica numérica adicional em `meiLimiteFaturamento.test.ts` (LIM-MEI-01).

#### Integração `GuidesMei.tsx`

Bloco na **Visão geral** quando `canViewNfse`; `meiLimiteBundle` com `computeMeiLimiteProgresso` + `getVigenciaLabelParaAno`; `loading` / `errorMessage` (erro operação NFS-e) e `onIrParaNfse` → workspace NFS-e — coerente com a story.

#### Observações (não bloqueantes)

1. **DoD:** revisão de copy com PO (disclaimer e microcopy) permanece como passo humano antes de merge, se ainda não fechado.  
2. **Lint:** `GuidesMei.tsx` — import `Link` não utilizado (aviso ESLint no ficheiro; fora do núcleo do bloco, mas vale limpar num PR próximo).  
3. **CodeRabbit (WSL):** não executado nesta revisão; recomendável correr antes do merge se for política da equipa.  
4. **Teste de integração/E2E** específico ao bloco na página: não obrigatório pela story; aceitável com testes de componente + utilitários.

#### Conclusão

Implementação **adequada** aos critérios e aos contratos LIM-MEI-01; qualidade de testes e acessibilidade **sólidas**. **PASS** com as observações acima.
