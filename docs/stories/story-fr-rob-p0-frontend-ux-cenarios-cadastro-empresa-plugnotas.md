# Story — FR-ROB (P0): Frontend/UX — cenários de cadastro empresa PlugNotas, fallback e causalidade

**ID:** STORY-FR-ROB-P0-FRONTEND-UX-CENARIOS-CADASTRO-EMPRESA-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/stories/story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md`](./story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md), [`docs/stories/story-fr-natex-p0-frontend-ux-bloqueio-excecao-prefeitura-login-plugnotas.md`](./story-fr-natex-p0-frontend-ux-bloqueio-excecao-prefeitura-login-plugnotas.md)  
**Fonte PRD:** [`docs/prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — **FR-ROB-01**, **FR-ROB-04** a **FR-ROB-09**, **NFR-ROB-01** a **NFR-ROB-05**  
**UX:** [`docs/specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — secções 5 a 12  
**Arquitetura:** [`docs/technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — secções 6, 8, 9 e 12

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | testes de frontend, revisão de copy e gates do projeto |

---

## User story

**Como** utilizador e owner da experiência da Guia MEI,  
**quero** que o frontend reconheça corretamente os cenários do cadastro empresa PlugNotas e apresente a narrativa UX adequada para sucesso, fallback, erro e exceção,  
**para** que o fluxo continue claro, nacional-first e sem diagnósticos errados de rota.

---

## Contexto

- O frontend já deixou de recolher credenciais municipais e já bloqueia a exceção NATEX.
- Falta consolidar os seis cenários obrigatórios numa interpretação única da UI, incluindo sucesso nacional, ambiente, payload, fallback e causalidade do `GET` posterior.

---

## Critérios de aceite

### Superfície e narrativa base

- [x] A Guia MEI continua apresentando **NFS-e Nacional** como padrão da jornada.
- [x] Não existem campos, hints ou CTAs para `login`/`senha` de prefeitura.
Critério de encerramento: a UI mantém a policy NATEX já vigente e não reabre affordances municipais.

### Interpretação por cenário

- [x] O frontend interpreta, no mínimo, os cenários `success_nacional`, `ambiente_configuracao`, `payload_contrato`, `fallback_sync`, `prefeitura_login_required_blocked` e `empresa_nao_cadastrada`.
Critério de encerramento: existe um ponto central de mapping entre resposta do BFF, classe do cenário e variante de UI.
- [x] O frontend usa o contrato mínimo backend -> UI.
Critério de encerramento: a classificação prioriza `plugnotasRequest.method`, `plugnotasRequest.path`, `plugnotasCode` e `httpStatus` quando disponíveis, sem depender só de heurística textual.
- [x] O fallback heurístico fica explicitamente controlado.
Critério de encerramento: heurística textual só pode ser usada como fallback quando o contrato mínimo vier ausente ou incompleto; para `prefeitura_login_required_blocked` e outros cenários já cobertos por `plugnotasCode`, a UI não pode preferir heurística ao contrato estruturado.

### Causalidade e fallback

- [x] Quando o backend resolver via `PATCH`, a UX comunica sincronização/atualização em vez de erro.
- [x] Quando houver `GET` negativo após `POST` falho, a UI mantém a causa raiz do `POST`.
Critério de encerramento: o `GET` posterior não é apresentado como falha independente nem como “rota errada”.

### Copy e acessibilidade

- [x] A copy continua evitando linguagem de endpoint/rota como narrativa principal.
- [x] O alerta principal continua acessível e único por cenário.
Critério de encerramento: `role="alert"` ou padrão equivalente já usado continua aplicado ao erro principal, com:
  `a)` um único alerta principal por submissão,  
  `b)` callout nacional fora do alerta de erro,  
  `c)` foco direccionado para o primeiro erro relevante quando houver falha de submissão.

### Qualidade

- [x] Executar `npm run lint`.
- [x] Executar `npm run typecheck`.
- [x] Executar `npm test`.
- [x] Cobrir os seis cenários mínimos de teste desta story.
Critério de encerramento: a suíte frontend cobre, no mínimo:
  `a)` sucesso nacional com copy de sucesso,  
  `b)` ambiente/configuração com narrativa de integração/ambiente,  
  `c)` payload/contrato com narrativa de revisão de dados,  
  `d)` fallback `PATCH` com narrativa de sincronização/atualização,  
  `e)` `prefeitura_login_required_blocked` com copy de exceção não suportada e sem convite para credenciais,  
  `f)` `GET` negativo posterior preservando a causa raiz do `POST`.

---

## Dev Notes

### File Locations

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/utils/apiClientError.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/utils/plugnotasEmitenteSetup.ts`
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`

### Technical Constraints

- Não criar nova rota visual.
- Não expor `POST /empresa`, `PATCH /empresa/:cnpj` ou `GET /empresa/:cnpj` como narrativa principal.
- Não reabrir coleta de credenciais municipais.
- Não espalhar a lógica de classificação em múltiplos pontos inconsistentes da UI.

---

## Tasks / Subtasks

1. [x] Centralizar a interpretação frontend dos seis cenários obrigatórios.
2. [x] Garantir que a UI consome o contrato mínimo backend -> frontend.
3. [x] Definir fallback heurístico controlado para ausência parcial do contrato.
4. [x] Ajustar copy/estados para sucesso nacional, ambiente, payload, fallback, exceção municipal e `GET` negativo posterior.
4. [x] Preservar a narrativa nacional-first e a ausência de credenciais municipais.
5. [x] Cobrir explicitamente a causalidade `POST` falho -> `GET` negativo.
6. [x] Tornar o comportamento de acessibilidade verificável para o alerta principal.
7. [x] Adicionar/atualizar regressões de página e utilitários para os seis cenários mínimos enumerados.
8. [x] Atualizar esta story com file list, notas e resultados dos gates.

---

## File list (esperada / a confirmar na execução)

- [x] `frontend/src/pages/GuidesMei.tsx`
- [x] `frontend/src/lib/fiscalUserError.ts`
- [ ] `frontend/src/utils/apiClientError.ts`
- [ ] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- [x] `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- [x] `docs/stories/story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md`

---

## CodeRabbit Integration

- Focar em:
  - coerência de narrativa entre cenários
  - ausência de copy de “rota errada”
  - fallback como sincronização
  - regressão de acessibilidade do alerta principal

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/lib/fiscalUserError.test.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- `docs/stories/story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md`

### Debug Log References

- `npm run lint`
- `npm run typecheck`
- `npm test` (executado fora do sandbox após `spawn EPERM` no runner restrito)
- `npm test -- src/lib/fiscalUserError.test.ts src/components/FiscalIntegrationErrorAlert.test.tsx src/pages/GuidesMei.certificate-connectivity.test.tsx` em `frontend/` (executado fora do sandbox)

### Completion Notes

- Centralizei a leitura dos cenários ROB em `fiscalUserError.ts` com priorização do contrato estruturado (`plugnotasCode`, `httpStatus`, `plugnotasRequest`) e fallback heurístico apenas quando o contrato vem incompleto.
- A Guia MEI passou a propagar `httpStatus` e `plugnotasRequest` no estado de erro NFS-e, permitindo copy coerente para `ambiente_configuracao`, `payload_contrato` e `empresa_nao_cadastrada` sem narrativa de rota errada.
- Os alertas fiscais agora consomem o contrato completo também nos componentes reutilizáveis, preservando acessibilidade com um único alerta principal por cenário.
- As regressões frontend cobrem sucesso/fallback já existentes e reforçam ambiente/configuração, payload/contrato e causalidade `POST` falho -> `GET` negativo.

### Change Log

- 2026-04-10 — Story criada pelo @sm a partir do PRD, spec UX e arquitetura da iniciativa ROB, com foco na interpretação frontend dos cenários do cadastro empresa PlugNotas.
- 2026-04-10 — Implementação concluída pelo @dev: classificação ROB centralizada no frontend, contrato completo propagado para a UI e regressões adicionadas para ambiente, payload e causalidade.

---

## QA Results

- 2026-04-10 — QA review by @qa
- Gate: PASS
- Nenhum finding.
- Verifiquei a centralização da interpretação ROB em `frontend/src/lib/fiscalUserError.ts`, com prioridade ao contrato estruturado (`plugnotasCode`, `httpStatus`, `plugnotasRequest`) e fallback heurístico controlado apenas quando necessário.
- Verifiquei o wiring da Guia MEI em `frontend/src/pages/GuidesMei.tsx` e dos alertas em `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, incluindo narrativa de ambiente/configuração, payload/contrato, exceção municipal bloqueada e causalidade de `GET /empresa/:cnpj` após falha prévia.
- Evidência executada nesta revisão: `npm test -- src/lib/fiscalUserError.test.ts src/components/FiscalIntegrationErrorAlert.test.tsx src/pages/GuidesMei.certificate-connectivity.test.tsx` em `frontend/` passou com 53/53 testes.
- Risco residual baixo: a story depende de o backend continuar a preservar `plugnotasCode`, `httpStatus` e `plugnotasRequest`; se esse contrato mudar, a classificação frontend deve ser revista junto com a story backend ROB.
