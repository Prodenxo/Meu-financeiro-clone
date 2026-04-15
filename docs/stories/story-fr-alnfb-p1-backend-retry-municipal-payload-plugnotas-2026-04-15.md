# Story — FR-ALNFB (P1): Backend — retry municipal seguro e payload PlugNotas

**ID:** STORY-FR-ALNFB-P1-BE-RETRY-MUNICIPAL  
**Prioridade:** P1  
**Estimativa / risco (planning):** **M–L** — toca policy, documentos ativos, orquestração `empresa.service` e contrato de resposta; **risco de merge** com a story 1.1 em `empresa-cadastro-runtime-decision.js` (mitigação na secção Qualidade).  
**Epic:** Cadastro de empresa PlugNotas com fallback municipal condicionado (PRD §9)  
**Depende de:** [story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md](./story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md) — **Definition of Ready:** cenários `prefeitura_login_required_fallback_available` / `prefeitura_login_required_blocked` e `runtimeDecision` em erro/pré-upstream conforme essa story estão disponíveis na base de código (merge ou branch alinhada).  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) — **Story 1.3**, **FR-ALNFB-06**, **FR-ALNFB-07**, **DP-ALNFB-04**, **CR-ALNFB-02**, **CR-ALNFB-05**  
**UX:** _(comportamento de envio alinhado a)_ [`docs/specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §6.5–6.7  
**Arquitetura:** [`docs/technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §6.2, §7–8.5, §10–11

## User story

**Como** responsável pelo serviço de backend,  
**quero** que o BFF aceite o **retry municipal** guiado e monte o payload correto para o PlugNotas,  
**para** que a empresa possa ser cadastrada com **`nfseNacional=false`** quando o município exigir autenticação municipal (**FR-ALNFB-06**).

## Fronteira com [STORY-FR-ALNFB-P1-BFF-RUNTIME-DECISION](./story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md) (classificação / pré-upstream)

| Entrega | Story de **classificação** (1.1) | Esta story (**retry municipal** / 1.3) |
|--------|-----------------------------------|----------------------------------------|
| Cenários `prefeitura_login_required_fallback_available` vs `blocked` antes do `POST /empresa` | Sim | Não duplicar regras da matriz §7.2 para **ausência** de credenciais |
| `runtimeDecision` quando o BFF **não** chama upstream ou falha classificada | Sim | Consumir como pré-requisito |
| Aceitar **login/senha**, validar policy, montar `nfseMode=municipal`, chamar PlugNotas, sucesso com `success_municipal` / `fallback_sync` | Fora do âmbito da 1.1 | **Sim — núcleo desta story** |
| `empresa-cadastro-runtime-decision.js` | Cenários pré-upstream + extensão do tipo `runtimeDecision` | **Apenas** ajustes para anexar/confirmar cenários de **sucesso** municipal **após** resposta upstream, se ainda não cobertos pela 1.1 (evitar dois PRs a reescrever a mesma tabela de decisão) |

**Independência da UI:** o critério de aceite desta story verifica-se com **testes no BFF** (fixtures/mocks PlugNotas, `POST /api/mei-notas/setup/emissao-fiscal/empresa` com payload municipal válido). Não é obrigatório GuidesMei estar terminado; a story [frontend](./story-fr-alnfb-p1-frontend-ui-credenciais-prefeitura-condicional-2026-04-15.md) integra o mesmo contrato depois.

## Escopo desta story

- **`prefeituraPortalCredentials.js`:** de bloqueio absoluto para **validação e redaction condicionada** (arquitetura §8.2): aceitar `login`/`senha` só quando flag ligada, NFS-e ativa, preflight confirmar auth municipal e **`attemptMode`/modo municipal** (tabela §7.2).  
- **`plugnotas-empresa-documentos-ativos.js`:** suportar `nfseMode` **`nacional` | `municipal`** (arquitetura §8.3): municipal → `nfseNacional=false`, `consultaNfseNacional=false`.  
- **`plugnotas-mei-empresa-policy.js`:** policy orientada por `attemptMode`; sem ambiguidade nacional+municipal (**CR-ALNFB-05**).  
- **`empresa.service.js`:** resolver `attemptMode`, executar preflight, validar credenciais, montar payload final, `POST /empresa` e eventual `PATCH /empresa/:cnpj`, devolver `runtimeDecision` em sucesso com **`success_municipal`** / **`fallback_sync`** quando aplicável (arquitetura §8.5–8.6).  
- **Rotas:** manter `POST /api/mei-notas/setup/emissao-fiscal/empresa` e envelope brownfield; **sem** nova rota paralela (**CR-ALNFB-01**–**02**). O `mei-notas.controller.js` só entra no file list se forem necessários testes de integração na rota existente — **sem** mudança de contrato público (arquitetura §8.6).  
- **FR-ALNFB-07:** validação presença, trim, paridade `login+senha`; rejeitar strings vazias e payload ambíguo.  
- Causalidade **POST → PATCH → GET** preservada (**FR-ALNFB-10**); `persistDocumentosAtivosMirrorAfterEmpresa()` só após sucesso (arquitetura §8.6).  
- Logs com redaction obrigatória (**NFR-ALNFB-01**).

## Critérios de aceite

- [ ] **FR-ALNFB-06:** retry municipal envia `nfse.config.nfseNacional=false` e `nfse.config.consultaNfseNacional=false` + `nfse.config.prefeitura.login/senha` apenas no trilho municipal válido.  
- [ ] **CR-ALNFB-05:** não aceitar `nfseNacional=true` com credenciais municipais no mesmo payload de forma ambígua.  
- [ ] **FR-ALNFB-07:** validação coerente (trim, paridade, ausência de vazio).  
- [ ] Credenciais **nunca** devolvidas ao frontend em respostas; redaction em logs.  
- [ ] **Evidências binárias (estender testes existentes — ver “Testes prioritários” abaixo):**  
  - [ ] Com preflight coerente com auth municipal, flag ligada e **credenciais válidas** no modo municipal: resposta de sucesso inclui `runtimeDecision.scenario` **`success_municipal`** ou **`fallback_sync`** (conforme ramo real e arquitetura §6.3).  
  - [ ] Com **credenciais presentes** quando o preflight **não** exige login/senha (caso inelegível): rejeição com **`payload_contrato`** (ou equivalente estável já usado no BFF), sem chamar PlugNotas de forma ambígua.  
- [ ] **Integration verification (PRD Story 1.3):** shape final preserva `documentosAtivos` e blocos `nfse`/`nfe`/`nfce`; causalidade POST/PATCH/GET; caminho nacional sem regressão.  
- [ ] Testes automatizados: policy, montagem documentos ativos por modo, fluxo serviço (mocks PlugNotas conforme padrão do repo) — **sem dependência** da UI; cobrir os ficheiros listados em **Testes prioritários**.  
- [ ] Gates `AGENTS.md`.

## Testes prioritários (repo)

| Ficheiro | Papel |
|----------|--------|
| [`backend/tests/mei-notas-empresa-http.test.js`](../../backend/tests/mei-notas-empresa-http.test.js) | Integração HTTP da rota `POST /api/mei-notas/setup/emissao-fiscal/empresa` — cenários feliz/erro e `runtimeDecision` na resposta. |
| [`backend/tests/prefeituraPortalCredentials.test.js`](../../backend/tests/prefeituraPortalCredentials.test.js) | Policy de credenciais (aceitar/rejeitar conforme elegibilidade e modo). |
| [`backend/tests/plugnotas-empresa-documentos-ativos-extract.test.js`](../../backend/tests/plugnotas-empresa-documentos-ativos-extract.test.js) | Montagem/coerência dos blocos `nfse`/`nfe`/`nfce` por modo (`nacional` vs `municipal`). |

**Nota:** [`backend/tests/plugnotas-empresa.test.js`](../../backend/tests/plugnotas-empresa.test.js) pode receber casos adicionais se o padrão do serviço PlugNotas centralizar asserts — ajustar pelo @dev ao tocar em `empresa.service.js`.

## Tasks (implementação)

1. [ ] Refatorar `prefeituraPortalCredentials.js` para validação condicionada (arquitetura §8.2).  
2. [ ] Implementar `nfseMode` em `plugnotas-empresa-documentos-ativos.js` e política MEI (§8.3–8.4).  
3. [ ] Completar ramo municipal em `empresa.service.js` (ordem: normalizar → documentosAtivos → attemptMode → preflight → decisão → upstream).  
4. [ ] Estender **Testes prioritários** (`mei-notas-empresa-http`, `prefeituraPortalCredentials`, `plugnotas-empresa-documentos-ativos-extract`) com os dois ramos das evidências binárias + regressão nacional.  
5. [ ] Verificar cenários matriz arquitetura §12.2 (incl. credenciais fora de caso elegível → `payload_contrato`).

## Fora de escopo

- Copy e estados visuais completos na UI → story frontend.  
- Atualização extensa de runbook → story P2.

## File list (checklist)

- [ ] `backend/src/services/plugnotas/prefeituraPortalCredentials.js`  
- [ ] `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`  
- [ ] `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js`  
- [ ] `backend/src/services/plugnotas/empresa.service.js`  
- [ ] `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` — **só** extensões de **sucesso** municipal / pós-upstream alinhadas à tabela “Fronteira” acima (não rever a matriz pré-upstream da story 1.1)  
- [ ] `backend/src/controllers/mei-notas.controller.js` — **opcional**; apenas se testes de integração na rota existente o exigirem (**sem** alteração de rota nem de envelope)  
- [ ] `backend/tests/mei-notas-empresa-http.test.js`  
- [ ] `backend/tests/prefeituraPortalCredentials.test.js`  
- [ ] `backend/tests/plugnotas-empresa-documentos-ativos-extract.test.js`  
- [ ] _(opcional)_ `backend/tests/plugnotas-empresa.test.js`

## Definition of Done

- Retry municipal end-to-end no BFF validado com testes; bandeira desligada mantém comportamento legado (arquitetura §11.1).  
- Nenhuma credencial em fixture “real”.

## Qualidade / CodeRabbit

- Rever interação **flag backend** vs **preflight**: quando flag off, permanece `prefeitura_login_required_blocked` (arquitetura §11.1).  
- Garantir **NFR-ALNFB-05** (ambiente produção/homologação) nos ramos de decisão.  
- **Conflito de stories:** antes de merge, confirmar com a branch da story 1.1 que `empresa-cadastro-runtime-decision.js` não foi alterado em duplicado (rebase ou coordenação @dev).

---

## Dev Agent Record

### Status

Draft

### Completion Notes List

- _(preencher pelo dev)_

### File List (final)

- _(preencher pelo dev)_

---

## QA Results

**2026-04-15 — follow-up QA / NFR-ALNFB-01**

- **Resposta BFF (`raw`):** o corpo espelhado do PlugNotas em sucesso de cadastro/atualização de empresa passa por `sanitizePlugnotasEmpresaJsonForClientResponse` (`prefeituraPortalCredentials.js`), removendo `prefeitura.login` e `prefeitura.senha` em qualquer ramo aninhado antes de devolver ao cliente.
- **Testes:** `prefeituraPortalCredentials.test.js` (sanitizador + trilho municipal com ctx explícito); `mei-notas-empresa-http.test.js` (eco fictício no mock POST `/empresa` — credenciais ausentes em `data.raw`).
