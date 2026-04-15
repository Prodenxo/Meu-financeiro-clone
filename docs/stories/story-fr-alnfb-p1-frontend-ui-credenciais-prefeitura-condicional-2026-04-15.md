# Story — FR-ALNFB (P1): Frontend — UI condicional de credenciais municipais (Guia MEI)

**ID:** STORY-FR-ALNFB-P1-FE-UI-PREFEITURA  
**Prioridade:** P1  
**Estimativa / risco (planning):** **M–L** — vários estados em `GuidesMei`, acessibilidade e serviço; **risco de integração** com [story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md) no primeiro POST municipal real — coordenar com @dev se UI e retry forem na mesma sprint (secção Fronteira).  
**Epic:** Cadastro de empresa PlugNotas com fallback municipal condicionado (PRD §9)  
**Depende de:** [story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md](./story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md) — **Definition of Ready:** BFF devolve `runtimeDecision` com `prefeitura_login_required_fallback_available` / `prefeitura_login_required_blocked` em ambiente de desenvolvimento ou **mocks HTTP estáveis** nos testes; tipagem em `meiNotasService.ts` alinhada ao contrato §6.3 da arquitetura.  
**Bloqueia:** — (pode avançar em paralelo com retry BFF após contrato estável)  
**Fonte PRD:** [`docs/prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) — **Story 1.2**, **FR-ALNFB-05**, **FR-ALNFB-07**, **FR-ALNFB-08**, **FR-ALNFB-09**, **NFR-ALNFB-01**, **NFR-ALNFB-03**, **CR-ALNFB-03**–**04**  
**UX:** [`docs/specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §5–7, §9–11, critérios §13  
**Arquitetura:** [`docs/technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §9.1–9.5

## User story

**Como** MEI bloqueado por exigência municipal após tentativa nacional,  
**quero** que a tela de setup abra **login** e **senha** da prefeitura **apenas** quando o BFF classificar o caso como fallback disponível,  
**para** continuar o cadastro sem fluxo municipal por defeito nem abertura por heurística local (**FR-ALNFB-05**, UX §8).

## Fronteira com BFF (stories 1.1 e 1.3)

| Entrega | [1.1 — classificação BFF](./story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md) | **Esta story (1.2 — UI)** | [1.3 — retry / payload municipal](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md) |
|--------|--------------------------------------------------|---------------------------|--------------------------------------------------|
| Produz `runtimeDecision` e cenários `prefeitura_login_required_*` | Sim | **Consome** na resposta | Reforça contrato no POST com credenciais |
| Abre painel e campos municipais na Guia MEI | Não | **Sim — núcleo** | Não (foco backend) |
| `attemptMode` municipal + `nfse.config` + credenciais no payload PlugNotas | Não | **Cola** via `mergePrefeituraPortalCredentialsIntoEmpresaPayload` até consolidar no builder (1.3) | **Sim** (builder canónico) |
| Primeiro fluxo feliz POST municipal end-to-end | Não | Opcional na mesma sprint | Tipicamente **sim** (coordenar) |

**`nfEmissionCompany.ts` (arquitetura §9.3):** esta story **não** implementa o builder em modo **`municipal`** nem envia credenciais no payload — isso fica na story **1.3** (e testes do builder em `nfEmissionCompany.test.ts` para esse modo). Aqui só se exige **não regredir** o caminho nacional / `documentosAtivos` (**CR-ALNFB-04**).

## Escopo desta story

- **GuidesMei:** hierarquia ALNFB-L1–L6 (UX §5.1): `Documentos ativos`, callout nacional (ALNFB-UX-L0/L1), painel de classificação, bloco municipal condicional, formulário base, barra de ações.  
- Revelar bloco **Credenciais da prefeitura** só quando: **NFS-e** ativa, **`runtimeDecision.scenario === prefeitura_login_required_fallback_available`**, flag frontend **`VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED`** e ausência de conflito superior (UX §8; arquitetura §11.2).  
- Copy principal para **fallback disponível** (UX §6.4, §9.3) e **fallback indisponível** (UX §6.8) via `fiscalUserError` / mapeamento; **não** abrir formulário no estado “indisponível” (**FR-ALNFB-09**).  
- Estados de loading distintos: tentativa nacional (L1) vs retry municipal (L5); CTA primário no passo municipal: **“Concluir cadastro com dados da prefeitura”**; secundário **“Voltar e revisar dados”** (UX §7.5).  
- **Sidecar** de credenciais fora do form base (`PrefeituraPortalCredentialsForm`, arquitetura §9.2); **sem** `localStorage` / `sessionStorage` / querystring / logs (**NFR-ALNFB-01**, UX §10).  
- Invalidar estado municipal ao mudar **município**, **codigoIbge** ou desligar **NFS-e** (UX §5.2).  
- Ajustar `plugnotasRetryBlockedByScenario` para **não** bloquear `prefeitura_login_required_fallback_available`; continuar a bloquear cenários terminais definidos na arquitetura §9.1.  
- `nfseNacionalPlugnotasErrorHints.ts`: apenas hints; **nunca** autorizar sozinho a abertura do formulário (UX §8, §7.3).

## Critérios de aceite

- [x] **FR-ALNFB-05:** `login` e `senha` só após classificação compatível (`runtimeDecision`) + condições UX §8.  
- [x] **FR-ALNFB-08:** utilizador distingue claramente primeiro passo nacional vs segundo passo municipal (callout some em L3; painel explica causa humana).  
- [x] **FR-ALNFB-07 / UX L4:** validação conjunta `login+senha`; mensagens inline sugeridas (UX §6.5); foco no primeiro erro.  
- [x] **FR-ALNFB-09:** se fallback indisponível, copy compreensível **sem** insinuar erro de endpoint (PRD §6.1 FR-ALNFB-09).  
- [x] **NFR-ALNFB-03 / UX §13:** `role="alert"` no painel principal; bloco municipal com `role="region"` e `aria-labelledby`; labels associadas.  
- [x] **CR-ALNFB-03–04:** quem só usa NFS-e nacional não vê credenciais nem fricção extra; coerência `documentosAtivos` não regrede.  
- [x] Testes: unitários (`fiscalUserError`, `prefeituraPortalCredentialsUi`) + regressão `nfEmissionCompany.test.ts` inalterada para modo municipal na story 1.3.  
- [x] Gates `AGENTS.md`.

## Testes prioritários (repo)

| Ficheiro | Papel |
|----------|--------|
| [`frontend/src/pages/GuidesMei.documentos-ativos.test.tsx`](../../frontend/src/pages/GuidesMei.documentos-ativos.test.tsx) | RTL FR-CAD-DOC (regressão). |
| [`frontend/src/pages/GuidesMei.alnfb-prefeitura-ui.test.tsx`](../../frontend/src/pages/GuidesMei.alnfb-prefeitura-ui.test.tsx) | RTL FR-ALNFB — bloco credenciais + foco UX §6.5. |
| [`frontend/src/utils/nfEmissionCompany.test.ts`](../../frontend/src/utils/nfEmissionCompany.test.ts) | Apenas **regressão** do caminho nacional / `documentosAtivos`; **sem** novos casos de `attemptMode: 'municipal'` aqui (ficam na story 1.3). |
| [`frontend/src/lib/fiscalUserError.test.ts`](../../frontend/src/lib/fiscalUserError.test.ts) | Cenários `runtimeDecision` + `prefeitura_login_required_fallback_available`. |
| [`frontend/src/utils/prefeituraPortalCredentialsUi.test.ts`](../../frontend/src/utils/prefeituraPortalCredentialsUi.test.ts) | Validação conjunta + merge payload municipal. |

## Tasks (implementação)

1. [x] Tipar resposta API com `runtimeDecision` (`meiNotasService.ts`, arquitetura §9.4).  
2. [x] Estado `PlugnotasPendingRetry` enriquecido com `retryKind: 'municipal'` onde aplicável (arquitetura §9.1).  
3. [x] Implementar callout nacional, painel L3/L7, card credenciais, CTAs e loading states (UX §6–7).  
4. [x] `fiscalUserError.ts` + precedência `runtimeDecision` sobre `plugnotasCode` (arquitetura §9.5).  
5. [x] Estender **Testes prioritários** com cenários e mocks estáveis.  

## Fora de escopo

- Montagem final do payload municipal (`attemptMode` municipal, `nfse.config.prefeitura.*`) e policy backend → [story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md).  
- Runbook e matriz QA operacional → story P2.

## File list (checklist)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/services/meiNotasService.ts` + `frontend/src/types/empresaCadastroRuntimeDecision.ts`  
- [x] `frontend/src/lib/fiscalUserError.ts`  
- [x] `frontend/src/utils/apiClientError.ts` (`runtimeDecision` em `ApiClientError`)  
- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`  
- [x] `frontend/src/utils/prefeituraPortalCredentialsUi.ts` + `prefeituraPortalCredentialsUi.test.ts`  
- [x] `frontend/src/pages/GuidesMei.documentos-ativos.test.tsx` — regressão FR-CAD-DOC mantida  
- [x] `frontend/src/pages/GuidesMei.alnfb-prefeitura-ui.test.tsx` — RTL ALNFB (bloco credenciais + foco no primeiro erro)  
- [x] `frontend/src/utils/nfEmissionCompany.test.ts` — sem alterações (não regressão nacional)  

## Definition of Done

- Fluxo manual ou testado com mock: nacional → erro classificado `fallback_available` → bloco aparece → validação inline → **pronto para ligar** ao POST municipal na story [1.3](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md) (primeiro green path end-to-end pode ser na 1.3 ou sprint coordenada).  
- Nenhum valor de senha em testes ou snapshots sensíveis.

## Qualidade / CodeRabbit

- Verificar que strings proibidas (UX §9.2: “endpoint errado”, etc.) não entram na copy.  
- Garantir que telemetria (se existir) não envia `login`/`senha` (UX §10).  
- **Coordenação com 1.3:** se o PR da UI precisar de alteração mínima em `nfEmissionCompany.ts` para o CTA municipal, alinhar com o PR da story de retry para evitar drift de contrato.

---

## Dev Agent Record

### Status

Implementado

### Completion Notes List

- `ApiClientError` + `meiNotasService`: `runtimeDecision` propagado a partir de `errors.runtimeDecision`.
- `resolveMeiFiscalScenario` / `mapMeiFiscalErrorToCopy`: precedência `runtimeDecision.scenario`; cenário `prefeitura_login_required_fallback_available` com copy dedicada.
- `GuidesMei`: `retryKind: 'municipal'` quando BFF devolve fallback disponível + `VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED`; bloco credenciais (`role="region"`), validação conjunta, CTAs, loading municipal; retry com `mergePrefeituraPortalCredentialsIntoEmpresaPayload` (cola fora de `nfEmissionCompany.ts` — story 1.3 pode consolidar builder).
- Invalidação credenciais ao mudar IBGE ou desmarcar NFS-e (efeito local).

### File List (final)

- `frontend/src/types/empresaCadastroRuntimeDecision.ts`  
- `frontend/src/utils/apiClientError.ts`  
- `frontend/src/services/meiNotasService.ts`  
- `frontend/src/lib/fiscalUserError.ts` + `fiscalUserError.test.ts`  
- `frontend/src/utils/prefeituraPortalCredentialsUi.ts` + `prefeituraPortalCredentialsUi.test.ts`  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`  
- `frontend/src/pages/GuidesMei.tsx`  

---

## QA Results

**2026-04-15 — Quinn (revisão pós-correções dev)**  
**Gate:** Aprovado com notas documentadas.

**Verificado nesta ronda**

- UX §6.5: CTA municipal clicável com credenciais vazias; ao submeter, foco no primeiro campo com erro (`mei-prefeitura-login` ou senha) sem duplicar banner fiscal (mensagem inline na região).
- `apiClient`: `redactPrefeituraCredentialsForLogs` em falhas HTTP — `nfse.config.prefeitura.login/senha` não aparecem em claro em `console.error`.
- RTL dedicado `GuidesMei.alnfb-prefeitura-ui.test.tsx` cobre bloco “Credenciais do portal da prefeitura” e foco após retry municipal.

**Follow-up (fora desta story)**

- Primeiro POST municipal end-to-end e builder canónico em `nfEmissionCompany.ts` → story 1.3.
