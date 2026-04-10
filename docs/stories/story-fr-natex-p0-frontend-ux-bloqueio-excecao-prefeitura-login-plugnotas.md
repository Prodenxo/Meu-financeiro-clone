# Story — FR-NATEX (P0): Frontend/UX — NFS-e Nacional por padrão e bloqueio da exceção `prefeitura.login`

**ID:** STORY-FR-NATEX-P0-FRONTEND-UX-BLOQUEIO-EXCECAO-PREFEITURA-LOGIN-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md`](./story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md), [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md), [`docs/specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md), [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md)  
**Fonte PRD:** [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md) — **FR-NATEX-01**, **FR-NATEX-02**, **FR-NATEX-03**, **FR-NATEX-04**, **FR-NATEX-06**, **FR-NATEX-09**, **NFR-NATEX-02**, **NFR-NATEX-04**, **NFR-NATEX-05**  
**UX:** [`docs/specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) — secções 4, 5, 6, 7, 8, 9, 10 e 11  
**Arquitetura:** [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) — secções 3, 4, 7, 8 e 10

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @ux-design-expert |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |

---

## User story

**Como** utilizador da Guia MEI,  
**quero** ver o fluxo de emissão como NFS-e Nacional por padrão e receber uma mensagem clara quando o emissor exigir credencial municipal não suportada,  
**para** entender o limite do fluxo sem ser levado a preencher dados de prefeitura que o produto não aceita.

---

## Contexto

- O PRD e a spec UX fixaram que não haverá login/senha de prefeitura no frontend.
- A arquitetura exige que a UI trate `prefeitura.login obrigatório` como exceção bloqueada, e não como erro de rota.
- O frontend deve preservar a causalidade entre `POST` falho e `GET` negativo, além de reforçar a narrativa nacional-first.

---

## Critérios de aceite

### Jornada e superfície

- [x] A tela continua apresentando **NFS-e Nacional** como modo padrão.
Critério de encerramento: existe callout ou conteúdo equivalente na superfície principal da Guia MEI, conforme a spec UX, sem alterar a estrutura base da jornada.
- [x] Não existem campos de login/senha de prefeitura na jornada.
Critério de encerramento: nenhum formulário, CTA, hint, ação secundária, painel auxiliar ou texto sugere recolha dessas credenciais no frontend.

### Exceção bloqueada

- [x] Um erro explícito de `prefeitura.login` / `prefeitura.senha` gera narrativa de exceção municipal não suportada.
Critério de encerramento: a UI não fala em endpoint errado, não pede credenciais e orienta próximo passo operacional.
- [x] A copy distingue esse caso de erro de ambiente e erro de payload genérico.
Critério de encerramento: a classificação frontend consome contrato mínimo backend → UI explicitamente nomeado nesta story, no mínimo `plugnotasCode = prefeitura_login_required_blocked`, `plugnotasRequest.method`, `plugnotasRequest.path` e `httpStatus`; heurística textual só pode atuar como fallback compatível, sem colisão com narrativa IBGE ou ambiente.
- [x] O `GET` negativo posterior não é apresentado como causa raiz.
Critério de encerramento: existe teste automatizado cobrindo `POST` falho seguido de `GET` sem empresa, mantendo a causalidade correcta.

### Acessibilidade

- [x] O callout nacional e o alerta principal seguem o padrão acessível já usado na aplicação.
- [x] Não há duplicação desnecessária de alertas com o mesmo conteúdo.

### Qualidade

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`

---

## Dev Notes

### File Locations

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`

### Technical Constraints

- Não criar campos de login/senha de prefeitura.
- Não criar nova rota visual para tratar exceção municipal.
- Reutilizar a superfície única Guia MEI e os padrões de alerta existentes.
- A narrativa deve continuar consumindo contrato backend → UI estável.
- O contrato mínimo esperado da story backend é: `plugnotasCode = prefeitura_login_required_blocked`, `plugnotasRequest.method`, `plugnotasRequest.path` e `httpStatus`.

---

## Tasks / Subtasks

1. [x] Inserir o callout/narrativa de NFS-e Nacional por padrão na superfície indicada pela spec UX.
2. [x] Garantir ausência explícita de qualquer entrada de login/senha de prefeitura na jornada.
3. [x] Ajustar a classificação frontend para o caso `prefeitura.login` / `senha` obrigatório como exceção bloqueada.
4. [x] Preservar a causalidade `POST` falho → `GET` negativo sem reabrir a tese de endpoint errado.
5. [x] Adicionar ou ajustar testes automatizados para:
   `a)` callout nacional,  
   `b)` ausência de campos de credenciais,  
   `c)` erro de exceção bloqueada afirmando explicitamente:
   presença do título/copy de bloqueio,
   ausência de texto sugerindo inserir login/senha,
   ausência de narrativa de endpoint/rota errada,  
   `d)` `GET` negativo após `POST` falho.
6. [x] Executar os gates do projeto e atualizar esta story.

---

## File list (esperada / a confirmar na execução)

- [x] `frontend/src/pages/GuidesMei.tsx`
- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- [x] `frontend/src/lib/fiscalUserError.ts`
- [x] `frontend/src/utils/nfEmissionCompany.ts`
- [x] `frontend/src/utils/guiaMeiCadastroDocumentosAtivos.ts`
- [x] `frontend/src/components/PlugnotasMunicipalRequirementOperacaoCopy.tsx`
- [x] `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- [x] `frontend/src/lib/fiscalUserError.test.ts`
- [x] `frontend/src/utils/nfEmissionCompany.test.ts`
- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- [x] `docs/stories/story-fr-natex-p0-frontend-ux-bloqueio-excecao-prefeitura-login-plugnotas.md`

---

## CodeRabbit Integration

- Foco principal:
  - narrativa nacional-first
  - ausência de campos de credenciais
  - classificação de exceção bloqueada
  - causalidade `POST` → `GET`

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/utils/nfEmissionCompany.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/utils/guiaMeiCadastroDocumentosAtivos.ts`
- `frontend/src/components/PlugnotasMunicipalRequirementOperacaoCopy.tsx`
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- `frontend/src/lib/fiscalUserError.test.ts`
- `frontend/src/utils/nfEmissionCompany.test.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `docs/stories/story-fr-natex-p0-frontend-ux-bloqueio-excecao-prefeitura-login-plugnotas.md`

### Debug Log References

- 2026-04-10 — removidos os campos e o payload de credenciais municipais da jornada da Guia MEI; a superfície passou a explicitar NFS-e Nacional como padrão.
- 2026-04-10 — a classificação frontend passou a reconhecer `prefeitura_login_required_blocked` como exceção municipal bloqueada, preservando contrato backend → UI e fallback heurístico compatível.
- 2026-04-10 — adicionadas regressões para callout nacional, ausência de campos de prefeitura, copy da exceção bloqueada e causalidade `POST` falho → `GET` negativo.

### Completion Notes

- A Guia MEI deixou de renderizar qualquer campo de `login/senha` de prefeitura e o builder de payload deixou de conhecer essa parte do contrato.
- A copy de erro para `plugnotasCode = prefeitura_login_required_blocked` foi centralizada para tratar o caso como exceção municipal não suportada, sem falar em rota errada e sem sugerir recolha de credenciais.
- O hint operacional e o painel fiscal mantiveram a narrativa nacional-first com uma região dedicada para a exceção municipal bloqueada.
- Gates executados na raiz: `npm run lint`, `npm run typecheck`, `npm test`.

### Change Log

- 2026-04-10 — Story criada pelo @sm a partir do PRD NATEX, spec UX e arquitetura técnica, com foco em jornada nacional-first e bloqueio da exceção municipal no frontend.
- 2026-04-10 — Story refinada pelo @sm após avaliação do @po: contrato backend → UI explicitado, ausência de sugestão de credenciais tornada mais objetiva e assertivas mínimas de teste adicionadas para a exceção bloqueada.
- 2026-04-10 — @dev implementou o callout nacional-first, removeu credenciais municipais da UI/payload, ajustou a narrativa `prefeitura_login_required_blocked` e adicionou regressões de página, utilitários e alertas; story promovida para `Ready for Review`.

---

## QA Results

- A preencher por @qa.
