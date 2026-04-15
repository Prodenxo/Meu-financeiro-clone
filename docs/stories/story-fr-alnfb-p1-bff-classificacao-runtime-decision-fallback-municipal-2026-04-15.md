# Story — FR-ALNFB (P1): BFF — classificação estável e decisão de fallback municipal

**ID:** STORY-FR-ALNFB-P1-BFF-RUNTIME-DECISION  
**Prioridade:** P1  
**Estimativa / risco (planning):** **M–L** — altera o motor de decisão pré-upstream e o contrato de resposta; **risco de merge** com [story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md) no mesmo `empresa-cadastro-runtime-decision.js` / `empresa.service.js` — coordenar ordem de merge ou rebase (secção Qualidade).  
**Epic:** Cadastro de empresa PlugNotas com fallback municipal condicionado (PRD §9)  
**Depende de:** — **Definition of Ready (brownfield):** preflight municipal e orquestração em `empresa.service.js` já existem (RTCAD / fluxo atual); esta story **estende** classificação e `runtimeDecision`, sem reimplementar o pipeline completo nem a chamada PlugNotas em si.  
**Bloqueia:** [story-fr-alnfb-p1-frontend-ui-credenciais-prefeitura-condicional-2026-04-15.md](./story-fr-alnfb-p1-frontend-ui-credenciais-prefeitura-condicional-2026-04-15.md), [story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md)  
**Fonte PRD:** [`docs/prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) — **Story 1.1**, **FR-ALNFB-04**, **FR-ALNFB-09**, **DP-ALNFB-03**, **DP-ALNFB-05**, **DP-ALNFB-07**, **CR-ALNFB-01**–**02**  
**UX:** [`docs/specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §6.4, §6.8, §8  
**Arquitetura:** [`docs/technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §6.3–6.4, §7–8.2

## User story

**Como** time de produto e engenharia,  
**quero** uma classificação estável do BFF para cenários que exigem ou não fallback municipal,  
**para** que a UI só abra o segundo passo excecional quando o sistema tiver evidência suficiente e uma resposta contratual clara (**FR-ALNFB-04**, **FR-ALNFB-09**).

## Fronteira com [STORY-FR-ALNFB-P1-BE-RETRY-MUNICIPAL](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md) (retry + credenciais / pós-upstream)

| Entrega | **Esta story** (1.1 — classificação / pré-upstream) | Story **retry municipal** (1.3) |
|--------|------------------------------------------------------|----------------------------------|
| Cenários `prefeitura_login_required_fallback_available` vs `blocked` **antes** do `POST /empresa` | **Sim — núcleo** | Não duplicar a matriz §7.2 para ausência de credenciais |
| `runtimeDecision` em erro quando o BFF **não** chama upstream ou bloqueia com classificação | **Sim** | Consumir; estender só **sucesso** municipal após upstream se aplicável |
| Aceitar **login/senha**, `nfseMode=municipal`, montagem final e sucesso PlugNotas | **Fora de âmbito** | **Sim** |
| `empresa-cadastro-runtime-decision.js` | Cenários pré-upstream + contrato `runtimeDecision` nas respostas de erro/classificação | Ajustes **adicionais** só para ramos de **sucesso** municipal se acordados — evitar dois PRs a alterar a mesma tabela sem coordenação |

## Escopo desta story

- Introduzir e propagar o cenário estável **`prefeitura_login_required_fallback_available`** quando preflight + governança indicarem fallback elegível (arquitetura §6.4).  
- Manter **`prefeitura_login_required_blocked`** quando auth municipal for exigida mas fallback não estiver elegível / flag off (PRD **FR-ALNFB-09**, arquitetura §7.2).  
- Estender **`runtimeDecision`** em **sucesso e erro** (extensão não-breaking, arquitetura §6.3): `scenario`, `attemptMode`, `consultedMunicipio`, `upstreamCallSkipped`, etc., conforme tipo recomendado.  
- Diferenciar explicitamente: nacional puro, erro de contrato/dados, município incompatível com nacional **com** fallback disponível vs **sem** fallback (PRD Story 1.1 — AC 1).  
- Acionar classificação compatível com fallback a partir de **preflight municipal**, resposta do fornecedor ou código de erro estável equivalente (PRD Story 1.1 — AC 2).  
- Garantir que o contrato de resposta para a UI deixa claro **quando** o segundo passo municipal está disponível (PRD Story 1.1 — AC 3).  
- **Rotas:** manter `POST /api/mei-notas/setup/emissao-fiscal/empresa` e envelope brownfield; **sem** nova rota paralela (**CR-ALNFB-01**–**02**). O [`mei-notas.controller.js`](../../backend/src/controllers/mei-notas.controller.js) só entra no file list se os testes HTTP (`mei-notas-empresa-http`) ou integração o exigirem — **sem** mudança de contrato público (arquitetura §8.6).  
- **Não** incluir nesta story a UI do segundo passo nem o retry municipal completo com credenciais — ficam nas stories dependentes.

## Critérios de aceite

- [x] O backend diferencia explicitamente **nacional puro**, **erro de contrato/dados/ambiente** e **caso compatível com fallback municipal** (disponível vs bloqueado) (PRD Story 1.1 AC1).  
- [x] A classificação pode ser acionada por **preflight**, **resposta do fornecedor** ou **código estável** equivalente (PRD Story 1.1 AC2).  
- [x] Respostas BFF incluem `runtimeDecision` com cenário que permite à UI saber se deve abrir formulário municipal (**`prefeitura_login_required_fallback_available`**) ou manter terminal bloqueado (**`prefeitura_login_required_blocked`**) (PRD Story 1.1 AC3; arquitetura §6.3).  
- [x] Quando aplicável, `upstreamCallSkipped=true` no caminho “instruir UI sem chamar PlugNotas” permanece coerente com a causalidade documentada (PRD **FR-ALNFB-10**; arquitetura diagrama §4).  
- [x] **Evidências binárias (estender “Testes prioritários” abaixo):**  
  - [x] Com auth municipal exigida, **flag backend off** (ou elegibilidade negada): resposta classificada com **`prefeitura_login_required_blocked`** e `runtimeDecision` coerente (sem abrir segundo passo na UI).  
  - [x] Com auth municipal exigida, **flag on** e **sem credenciais** no payload: resposta com **`prefeitura_login_required_fallback_available`** (quando a matriz §7.2 aplicar), tipicamente com **`upstreamCallSkipped=true`** antes do `POST /empresa` ao PlugNotas.  
- [x] **Integration verification (PRD):** fluxo nacional atual continua funcional em municípios compatíveis; classificação não quebra fallback `PATCH /empresa/:cnpj`; custo operacional da triagem alinhado ao runtime existente.  
- [x] Testes automatizados cobrindo matriz mínima arquitetura §12.2 (pelo menos: nacional puro; auth municipal + flag off → blocked; auth municipal + flag on sem credenciais → `fallback_available` quando aplicável) nos ficheiros de **Testes prioritários**.  
- [x] Gates `AGENTS.md`: `npm run lint`, `npm run typecheck`, `npm test`.

## Testes prioritários (repo)

| Ficheiro | Papel |
|----------|--------|
| [`backend/tests/empresa-cadastro-runtime-rec500-regression.test.js`](../../backend/tests/empresa-cadastro-runtime-rec500-regression.test.js) | Testes diretos do motor `evaluateEmpresaCadastroMunicipioPreflight` / taxonomia de cenários — **estender** para `prefeitura_login_required_fallback_available` e flag, preservando regressões existentes (ex. REC500). |
| [`backend/tests/mei-notas-empresa-http.test.js`](../../backend/tests/mei-notas-empresa-http.test.js) | Integração HTTP do cadastro empresa: `runtimeDecision` no corpo da resposta em erro/sucesso quando aplicável. |
| [`backend/tests/plugnotas-empresa.test.js`](../../backend/tests/plugnotas-empresa.test.js) | Cobertura do serviço PlugNotas empresa / orquestração — acrescentar apenas se asserts de `empresa.service.js` ficarem centralizados aqui. |

## Tasks (implementação)

1. [x] Estender `empresa-cadastro-runtime-decision.js` com cenário `prefeitura_login_required_fallback_available` e separação available vs blocked (arquitetura §8.1).  
2. [x] Integrar decisão com flag `PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED` e regras da tabela arquitetura §7.2.  
3. [x] Garantir que respostas (erro/sucesso) incluem `runtimeDecision` conforme contrato §6.3.  
4. [x] Estender **Testes prioritários** (`empresa-cadastro-runtime-rec500-regression`, `mei-notas-empresa-http`, e `plugnotas-empresa` se necessário) com a matriz §12.2 + evidências binárias acima.  
5. [x] Redaction: nenhum segredo municipal em logs ou payloads de resposta (**NFR-ALNFB-01**).

## Fora de escopo

- UI `GuidesMei` e builder `attemptMode` municipal → stories frontend e retry dedicadas.  
- Documentação operacional completa e matriz QA final → [story-fr-alnfb-p2-qa-operacao-rollout-fallback-municipal-2026-04-15.md](./story-fr-alnfb-p2-qa-operacao-rollout-fallback-municipal-2026-04-15.md).

## File list (checklist)

- [x] `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`  
- [x] `backend/src/services/plugnotas/empresa.service.js` (orquestração / anexo `runtimeDecision`)  
- [ ] `backend/src/config/env.js` — **sem alteração** nesta story (semântica da flag via env já existente).  
- [ ] `backend/src/controllers/mei-notas.controller.js` — **sem alteração** (opcional na story original; testes HTTP cobertos sem mudar controller).  
- [x] `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js`  
- [x] `backend/tests/mei-notas-empresa-http.test.js`  
- [x] `backend/tests/plugnotas-empresa.test.js` (incl. PATCH + `runtimeDecision`)

## Definition of Done

- Contrato BFF → frontend documentado implicitamente pelos tipos/cenários novos e testes verdes.  
- Nenhuma regressão no caminho nacional com flag desligada (arquitetura §11.4).

## Qualidade / CodeRabbit

- Validar que cenários novos não conflituam com `prefeitura_ibge_apenas_insuficiente_dp02` e demais códigos existentes.  
- Garantir precedência de `runtimeDecision.scenario` sobre heurísticas textuais no consumo futuro (arquitetura §9.5).  
- **Conflito de stories:** alinhar com a branch da [story de retry municipal](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md) antes do merge — mesmo módulos `empresa-cadastro-runtime-decision.js` e `empresa.service.js`; preferir **esta story (1.1) primeiro** na sequência do epic, salvo acordo em equipa.

---

## Dev Agent Record

### Status

Implementado (motor e orquestração alinhados ao código mergeado com FR-ALNFB 1.3; esta story foca classificação pré-upstream + testes de matriz).

### Completion Notes List

- `resolveEmpresaCadastroMunicipioRuntimeDecision` + flag `PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED` cobrem `prefeitura_login_required_fallback_available` vs `blocked` (matriz §7.2 / §12.2).
- `empresa.service.js` propaga `runtimeDecision` em erro e sucesso; `evaluateEmpresaCadastroMunicipioPreflight` mantém compat REC500 (flag off por defeito).
- Testes: `empresa-cadastro-runtime-rec500-regression.test.js` estendido com cenários 1.1 (blocked vs fallback vs nacional vs dp02); `plugnotas-empresa.test.js` com integração serviço `fallback_available`; HTTP já coberto em `mei-notas-empresa-http.test.js`.

### File List (final)

- `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` _(já existente; contrato cenários)_  
- `backend/src/services/plugnotas/empresa.service.js` _(orquestração)_  
- `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js`  
- `backend/tests/plugnotas-empresa.test.js`  
- `backend/tests/mei-notas-empresa-http.test.js` _(cenários HTTP pré-existentes para fallback/blocked)_

---

## QA Results

**2026-04-15 — Story 1.1 (classificação BFF)** — **Gate:** aprovado com notas (checklists e PATCH alinhados em follow-up).

- Matriz mínima §12.2 coberta em `empresa-cadastro-runtime-rec500-regression.test.js` via `resolveEmpresaCadastroMunicipioRuntimeDecision`.
- Serviço `cadastrarEmpresaPlugNotas` com flag on → `prefeitura_login_required_fallback_available` em `plugnotas-empresa.test.js`.
- Regressão REC500 preservada (`evaluateEmpresaCadastroMunicipioPreflight` → `blocked` com flag off).
- **Follow-up QA:** teste explícito `PATCH sucesso inclui runtimeDecision coerente` em `plugnotas-empresa.test.js` (cenário `fallback_sync`, `upstreamCallSkipped=false` no sucesso upstream) — cobre integração verification “classificação não quebra PATCH”.
- **Merge:** manter coordenação com story 1.3 nos mesmos ficheiros (`empresa-cadastro-runtime-decision.js`, `empresa.service.js`); preferir merge 1.1 antes ou rebase acordado (ver secção Qualidade).
