# Story — FR-UX-MEI (P0): Mei Infinito — KPIs, tabs sem duplicação, visão geral e certificado

**ID:** STORY-FR-UX-MEI-P0  
**Prioridade:** P0 (Must — PRD onda 1)  
**Fonte:** `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` §6 (FR-UX-MEI-01 a 04)  
**Especificação UX:** `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` §3.2, §4.1, §4.3–4.4, §5  
**Relacionado:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` (fluxo MEI; sem alteração de regra fiscal)

## User story

**Como** utilizador na área **Mei Infinito** (`/guias-mei`),  
**quero** ver um resumo numérico claro sem repetição nos separadores, cartões da visão geral com estado e ações explícitas, e o certificado (incl. “servidor”) integrado ao fluxo,  
**para** orientar-me rápido e saber o que é informativo versus o que posso clicar.

## Contexto técnico

- **Ficheiro principal:** `frontend/src/pages/GuidesMei.tsx`  
- **Tokens / CSS:** `frontend/src/index.css` (`admin-stat-card`, `planner-tab`, `admin-toolbar`, badges, etc.)  
- **Estado já existente:** `meiPeriods`, `dasPendentesCount`, `filteredNfseList`, `certificateScopeLabel`, `hasUserCertificate`, `hasServerCertificate`, `workspaceTabs` (ajustar `badge` conforme spec §3.2)  
- **Sem novos endpoints:** apenas apresentação e *copy* condicionada a dados já disponíveis no componente.

## Critérios de aceite

### FR-UX-MEI-01 — Métrica canónica

- [x] O *grid* do hero (`admin-stat-grid`) permanece a **fonte dos valores numéricos brutos** para períodos DAS, pendências DAS, notas exibidas (se `canViewNfse`) e informação de status de certificado conforme UI atual.
- [x] Os itens do **Fluxo do MEI** **não** repetem o mesmo número para a mesma métrica já mostrada no hero (substituir `tab.badge` por estado textual / atalho, conforme tabela da spec §3.2; exceção acordada em produto: uma única fonte — hero **ou** tab, não ambos com o mesmo dígito).

### FR-UX-MEI-02 — Visão geral operacional

- [x] Cada cartão (Certificado e DAS, NFS-e se aplicável, Parcelamentos) inclui **2–3 linhas** de estado útil e/ou *empty state* com mensagem compreensível.
- [x] Cada cartão tem **ação primária** explícita (botão ou link claro, p.ex. “Abrir Certificado e DAS”) — implementar **Opção A** (cartão + botão interno) **ou** **Opção B** (cartão `button` + “Abrir”/ícone → sempre visível), conforme `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` §4.4.

### FR-UX-MEI-03 — Affordance

- [x] Cartões de KPI do hero **não** sugerem clique (`cursor-pointer`, *hover* de “botão” removido ou reduzido a feedback neutro conforme spec §4.1).

### FR-UX-MEI-04 — Certificado do servidor

- [x] Quando `certificateScopeLabel` indicar certificado do servidor (ou equivalente), existe **linha de *copy* ou link** no hero ou na visão geral que explica o destino e encaminha mentalmente para `activeWorkspace === 'das'` (sem botão sem rótulo).
- [x] Não introduzir controlo isolado sem relação com a secção Certificado.

## Fora de escopo

- `role="tablist"` / `aria-selected` completo (P1).  
- `localStorage` de última tab (P2).  
- Novas APIs ou mudança de lógica de negócio DAS/NFS-e.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/index.css` (se ajustar `.admin-stat-card` ou tabs)

## Definition of Done

- QA manual em `/guias-mei`: confirmar ausência de duplicação numérica hero vs badges de tab; cartões da visão geral com CTA; KPIs sem aparência de botão.  
- `npm run lint` e `npm run typecheck` no `frontend`; `npm test` incluindo `App.mei-gate.test.tsx` sem regressão.

## Qualidade / CodeRabbit

- Extrair subcomponentes apenas se reduzir risco de regressão em `GuidesMei.tsx` (evitar refactor massivo não pedido).  
- Garantir que condicionais `canViewNfse` preservam layout com 3 vs 4 tabs.

---

## Dev Agent Record

### Status

Ready for Review — critérios de aceite fechados pós-QA (2026-03-30)

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- FR-UX-MEI-01: *badges* dos tabs do Fluxo do MEI sem repetir os mesmos números do hero (Visão geral / DAS / NFS-e com texto; Parcelamentos mantém contagem só no tab por não haver KPI equivalente no hero).
- FR-UX-MEI-02: Visão geral operacional em **Opção A** — `admin-toolbar` + texto 2–3 linhas + CTAs `Abrir Certificado e DAS`, `Abrir NFS-e`, `Abrir Parcelamentos`; *empty states* NFS-e e parcelamentos.
- FR-UX-MEI-03: `.admin-stat-card` sem *hover* de elevação/sombra (só leitura).
- FR-UX-MEI-04: No hero, quando `hasServerCertificate && !hasUserCertificate`, parágrafo com botão que chama `setActiveWorkspace('das')` e *copy* sobre certificado do servidor.
- Pós-QA: checklists dos critérios de aceite atualizados; texto do cartão Parcelamentos (visão geral) sem duplicar o número exibido no *badge* do tab.

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/index.css`

### Debug Log References

- `npm run lint` e `npm run typecheck` (frontend) — OK; avisos pré-existentes noutros ficheiros.
- `npx vitest run --environment jsdom src/App.mei-gate.test.tsx` — 3 testes passaram.

### Change Log

- **2026-03-30** — Implementação P0 conforme critérios; sem alteração de API.
- **2026-03-30** — Pós-QA: critérios de aceite marcados; cartão Parcelamentos na visão geral sem repetir contagem numérica já indicada no tab.

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-03-30  
**Decisão de gate:** **PASS** (com observações menores)

### Rastreio critérios → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| FR-UX-MEI-01 (hero canónico) | **OK** | `admin-stat-grid` mantém `meiPeriods.length`, `dasPendentesCount`, `filteredNfseList.length` (se NFSe), `certificateScopeLabel` em `GuidesMei.tsx`. |
| FR-UX-MEI-01 (tabs sem duplicar dígitos do hero) | **OK** | *Badges* Visão geral / DAS / NFS-e são textuais; Parcelamentos usa `N pedidos` só no tab (sem KPI equivalente no hero — alinhado à spec UX §3.2). |
| FR-UX-MEI-02 (visão geral) | **OK** | Cartões com 2–3 linhas de corpo, *empty states* NFS-e/parcelamentos, CTAs **Abrir …** (Opção A) em `admin-toolbar` + `planner-button-secondary`. |
| FR-UX-MEI-03 (KPIs só leitura) | **OK** | `.admin-stat-card` em `index.css` sem `hover` de elevação/sombra. |
| FR-UX-MEI-04 (certificado servidor) | **OK** | Bloco `hasServerCertificate && !hasUserCertificate` no hero com *copy* + botão que define `activeWorkspace` para `'das'`; cartão visão geral reforça o mesmo tema. |

### Testes executados (gate)

- `npx vitest run --environment jsdom src/App.mei-gate.test.tsx` — **3/3 pass** (2026-03-30).

### Observações (não bloqueantes)

1. **Checklist da story:** os itens em **Critérios de aceite** permanecem `[ ]` no ficheiro; recomenda-se **@po** ou **@sm** marcar `[x]` após aceitação formal (ou manter processo atual do repo).
2. **Parcelamentos:** o número de pedidos aparece no *badge* do tab e, com dados, na terceira linha do cartão da visão geral — não duplica o hero (que não tem esse KPI); aceitável; se no futuro o hero ganhar KPI de parcelamentos, rever duplicação.
3. **A11y tabs** (`tablist` / `aria-selected` / foco reforçado): fora de escopo P0; coberto pela story P1.

### Riscos

- **Baixo:** alterações apenas de apresentação; sem novas superfícies de dados ou API.

### Segue para merge

- **Sim**, do ponto de vista QA deste *slice*, desde que *lint/typecheck* do pacote alterado estejam verdes no pipeline da equipa e exista *smoke* manual rápido em `/guias-mei` (modo claro/escuro, com e sem `canViewNfse` se possível).
