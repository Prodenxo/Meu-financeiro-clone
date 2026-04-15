# Story — FR-RTCAD (P0): Full-stack — contrato runtime nacional oficial no cadastro empresa PlugNotas

**ID:** STORY-FR-RTCAD-P0-CONTRATO-RUNTIME-NACIONAL-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Draft  
**Depende de:** [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/stories/story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md`](./story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md), [`docs/stories/story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md`](./story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md), [`docs/stories/story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md`](./story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md)  
**Fonte PRD:** [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — **FR-RTCAD-01**, **FR-RTCAD-02**, **FR-RTCAD-05**, **NFR-RTCAD-04**, **NFR-RTCAD-05**, **CR-RTCAD-01**, **CR-RTCAD-02**, **CR-RTCAD-03**  
**UX:** [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 5, 6.1, 8, 9.2, 9.3, 13 e 14  
**Arquitetura:** [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 5, 6, 10, 11.4, 13 e 14

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | testes frontend/backend, revisão de contrato e gates do projeto |

---

## User story

**Como** equipa responsável pelo setup fiscal da Guia MEI,  
**quero** migrar o cadastro da empresa para o contrato oficial nacional do PlugNotas em frontend, backend e testes,  
**para** que o runtime deixe de depender do shape legado `nfse.nacional` e passe a emitir um contrato único, previsível e compatível com o fornecedor.

---

## Contexto

- Hoje o frontend e o backend continuam a usar `nfse.nacional` como sinal principal do modo nacional.
- A arquitetura nova exige tolerância temporária ao shape legado na entrada, mas contrato oficial único na saída.
- Durante o rollout brownfield, o backend pode receber simultaneamente shape legado e shape oficial; quando ambos existirem, o shape oficial deve ter precedência explícita em código e testes.
- A regra do MVP para `nfse.config.consultaNfseNacional` precisa ser única entre frontend, backend e testes.
- O caminho nacional corrigido não deve continuar a depender de `nfse.config.prefeitura.codigoIbge` como via principal; qualquer uso residual dessa via fica restrito a legado controlado/transição.
- Esta story não cobre preflight municipal nem classificação final da UX; ela prepara a base contratual para as stories seguintes.

---

## Critérios de aceite

### Contrato oficial nacional

- [ ] O frontend deixa de montar `nfse.nacional` como sinal primário do runtime.
Critério de encerramento: `frontend/src/utils/nfEmissionCompany.ts` passa a escrever `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional` como contrato principal de saída, sem introduzir campos de credenciais municipais.
- [ ] O backend deixa de encaminhar `nfse.nacional` ao PlugNotas.
Critério de encerramento: o payload efetivamente enviado em `POST /empresa` e `PATCH /empresa/:cnpj` usa o contrato oficial em `nfse.config.*`, mesmo quando a entrada ainda trouxer shape legado.
- [ ] Existe regra única e explícita para `consultaNfseNacional`.
Critério de encerramento: frontend, backend e testes aplicam a mesma política do MVP, documentada em código, sem branches divergentes por camada.
- [ ] A precedência entre shape oficial e shape legado fica explícita para o rollout brownfield.
Critério de encerramento: quando o backend receber simultaneamente `nfse.nacional` e `nfse.config.*`, o shape oficial prevalece de forma determinística; o shape legado permanece apenas como compatibilidade transitória de entrada, e a suíte cobre explicitamente esse caso.

### Compatibilidade brownfield

- [ ] A rota pública e o fallback atual permanecem compatíveis.
Critério de encerramento: a story não altera `POST /api/mei-notas/setup/emissao-fiscal/empresa`, não remove `POST /empresa`, não remove `PATCH /empresa/:cnpj` e não mexe no retry parcial já existente da fase `empresa`.
- [ ] O contrato legado continua apenas como compatibilidade transitória de entrada.
Critério de encerramento: se `nfse.nacional` ainda chegar ao backend durante rollout, ele é adaptado internamente, mas deixa de ser o shape canónico de saída e de teste.
- [ ] O hot path nacional deixa de depender de `nfse.config.prefeitura.codigoIbge` como via principal.
Critério de encerramento: o caminho nacional oficial usa `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional` como contrato canónico; `nfse.config.prefeitura.codigoIbge` não é requisito do payload nacional oficial, e qualquer helper legado que ainda o toque fica restrito a transição/rollback, sem voltar a ser motor principal da implementação.
- [ ] A story não infere que o runtime já suporta a fase 2 municipal.
Critério de encerramento: não há inclusão de `prefeitura.login` ou `prefeitura.senha`, nem flags novas que expandam o escopo além do MVP.

### Qualidade

- [ ] Executar `npm run lint`.
- [ ] Executar `npm run typecheck`.
- [ ] Executar `npm test`.
- [ ] Cobrir regressão de contrato em frontend e backend.
Critério de encerramento: a suíte cobre, no mínimo, `(a)` builder frontend no shape oficial, `(b)` adaptação backend de entrada legado -> saída oficial, `(c)` regra única de `consultaNfseNacional` em `POST` e `PATCH`, e `(d)` preservação dos blocos atuais de documentos/fallback sem regressão funcional.

---

## Dev Notes

### File Locations

- `frontend/src/utils/nfEmissionCompany.ts`
- `frontend/src/utils/nfEmissionCompany.test.ts`
- `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js`
- `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`

### Technical Constraints

- Não alterar a rota pública do BFF.
- Não introduzir mudança de banco.
- Não reabrir credenciais municipais.
- Não deixar `nfse.nacional` sair para o upstream como contrato canónico.
- Se entrada legado e oficial coexistirem, o shape oficial tem precedência obrigatória.
- Não manter `nfse.config.prefeitura.codigoIbge` como dependência principal do caminho nacional oficial.
- Preservar a compatibilidade com o fluxo de documentos ativos e com o fallback `POST` -> `PATCH`.

### Testing

- Validar o shape gerado pelo frontend com `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional`.
- Validar que o backend adapta entrada legada sem voltar a propagar `nfse.nacional` ao PlugNotas.
- Validar explicitamente a precedência do shape oficial quando entrada legado e oficial coexistirem.
- Validar `POST` e `PATCH` para a mesma política de `consultaNfseNacional`.
- Validar que o payload nacional oficial não volta a depender de `nfse.config.prefeitura.codigoIbge` como requisito do hot path.
- Confirmar ausência de regressão nas suites já existentes de cadastro empresa PlugNotas.

---

## Tasks / Subtasks

1. [ ] Atualizar o builder frontend para produzir o contrato oficial nacional em `nfse.config.*`.
2. [ ] Atualizar as constantes/policies backend que ainda tratam `nacional` como chave oficial do payload.
3. [ ] Adaptar `empresa.service.js` e helpers correlatos para aceitar shape legado na entrada, garantir precedência do shape oficial quando ambos coexistirem e emitir apenas o shape oficial na saída para o PlugNotas.
4. [ ] Garantir uma política única e compartilhada para `consultaNfseNacional` em `POST` e `PATCH`.
5. [ ] Remover `nfse.config.prefeitura.codigoIbge` do hot path nacional oficial, mantendo qualquer uso residual apenas como legado controlado de transição/rollback.
6. [ ] Atualizar testes frontend e backend para o contrato oficial, para a compatibilidade brownfield e para a precedência entre shapes.
7. [ ] Executar os gates do projeto e atualizar esta story com file list, notas e resultados.

---

## File list (esperada / a confirmar na execução)

- [ ] `frontend/src/utils/nfEmissionCompany.ts`
- [ ] `frontend/src/utils/nfEmissionCompany.test.ts`
- [ ] `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js`
- [ ] `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`
- [ ] `backend/src/services/plugnotas/empresa.service.js`
- [ ] `backend/tests/plugnotas-empresa.test.js`
- [ ] `docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Coerência do contrato oficial entre frontend, backend e testes.
- Ausência de regressão no fallback `POST` -> `PATCH`.
- Compatibilidade brownfield sem manter `nfse.nacional` como shape canónico.

---

## Dev Agent Record

### Status

QA Fixes Applied

### File list

- `frontend/src/utils/nfEmissionCompany.ts`
- `frontend/src/utils/nfEmissionCompany.test.ts`
- `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js`
- `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`

### Debug Log References

- `npm test -- src/utils/nfEmissionCompany.test.ts` (workspace `frontend`)
- `npm test -- tests/plugnotas-empresa.test.js` (workspace `backend`)
- `npm run lint`
- `npm run typecheck`
- `npm test`

### Completion Notes

- Story criada para a base contratual do Epic 1 RTCAD.
- Não iniciar preflight municipal nem ampliação de UX antes de o contrato oficial nacional estar consistente em frontend, backend e testes.
- Qualquer tolerância a `nfse.nacional` nesta story deve ser estritamente transitória e interna ao backend.
- Refinamento PO aplicado: precedência do shape oficial sobre o legado ficou explícita para rollout brownfield, e o hot path nacional deixou de admitir `nfse.config.prefeitura.codigoIbge` como via principal.
- Frontend e backend convergiram para o contrato oficial de saída em `nfse.config.nfseNacional` + `nfse.config.consultaNfseNacional`; a chave raiz `nfse.nacional` deixou de sair para o upstream.
- A política MVP de `consultaNfseNacional` ficou centralizada: quando o bloco `nfse` está ativo no cadastro empresa, `nfseNacional` e `consultaNfseNacional` saem alinhados no mesmo shape oficial em `POST` e `PATCH`.
- O backend passou a tratar `nfse.nacional` apenas como compatibilidade transitória de entrada; quando há shape oficial e legado simultaneamente, o fluxo mantém o contrato oficial canónico e descarta a chave legada no payload final.
- A derivação de `nfse.config.prefeitura.codigoIbge` saiu do hot path oficial e ficou restrita ao rollback brownfield via shape legado + flags já existentes; a regressão cobre tanto o bloqueio legado quanto a ausência de `prefeitura` no caminho oficial.
- Gates executados com sucesso após os fixes: `npm run lint`, `npm run typecheck` e `npm test`.

### Change Log

- 2026-04-14 — Story criada por @sm a partir do PRD, spec UX e arquitetura da iniciativa RTCAD, com foco no contrato runtime nacional oficial do cadastro empresa PlugNotas.
- 2026-04-14 — Story refinada por @sm segundo avaliação @po: regra de precedência entre shape oficial e legado explicitada e dependência de `nfse.config.prefeitura.codigoIbge` removida do hot path nacional principal.
- 2026-04-14 — @dev aplicou os fixes do QA para contrato oficial nacional: builder frontend e backend passaram a emitir `nfse.config.nfseNacional` + `nfse.config.consultaNfseNacional`, o hot path oficial deixou de derivar `prefeitura.codigoIbge`, e a suíte foi atualizada para brownfield/preferência do shape oficial.

---

## QA Results

- 2026-04-14 — Revisão QA (`@qa`) — **Gate: FAIL**
- Escopo revisto: `frontend/src/utils/nfEmissionCompany.ts`, `frontend/src/utils/nfEmissionCompany.test.ts`, `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js`, `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`, `backend/src/services/plugnotas/empresa.service.js`, `backend/tests/plugnotas-empresa.test.js`.
- Evidência executada: `npm test -- src/utils/nfEmissionCompany.test.ts` (workspace `frontend`) e `npm test -- backend/tests/plugnotas-empresa.test.js` (workspace `backend`) — ambas verdes, mas ainda ancoradas no contrato legado.
- Achados:
  - **Alto:** o contrato oficial nacional não foi implementado; frontend e backend continuam a produzir/assumir `nfse.nacional` como chave canónica, sem adoção de `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional`.
  - **Alto:** a compatibilidade brownfield exigida pela story não está coberta; não há adaptação explícita entrada legado -> saída oficial nem precedência determinística do shape oficial quando coexistir com o legado.
  - **Médio:** o hot path nacional continua acoplado ao trilho `prefeitura.codigoIbge` por helper ativo no fluxo principal de `POST` e `PATCH`, sem isolamento claro como legado controlado/transição.
  - **Médio:** a suíte de regressão reforça o contrato antigo (`nfse.nacional`) e não cobre `consultaNfseNacional`, shape oficial nem precedência entre shapes.
