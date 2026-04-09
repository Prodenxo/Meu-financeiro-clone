# Story — FR-ENDP (P0): Frontend/UX — diagnóstico de cadastro Plugnotas sem narrativa de “rota errada”

**ID:** STORY-FR-ENDP-P0-FRONTEND-UX-DIAGNOSTICO-CADASTRO-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md`](./story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md), [`docs/prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md), [`docs/specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md), [`docs/technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)  
**Fonte PRD:** [`docs/prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — **FR-ENDP-02**, **FR-ENDP-04**, **FR-ENDP-05**, **FR-ENDP-06**, **NFR-ENDP-01**, **NFR-ENDP-03**  
**UX:** [`docs/specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — secções 2, 4, 5, 6, 7, 8 e 10  
**Arquitetura:** [`docs/technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — secções 3, 6, 7, 8 e 9

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
**quero** mensagens e estados de erro que expliquem o cadastro da empresa no emissor sem sugerir que existe uma “rota nova” ou “rota errada”,  
**para** entender se a falha parece ser do ambiente/configuração ou dos dados enviados e saber o próximo passo correto.

---

## Contexto

- A spec UX exige preservar a Guia MEI como superfície única de cadastro.
- A UI deve manter a causalidade entre `POST` cadastro, `PATCH` fallback e `GET` consulta.
- O frontend não pode sugerir chamada direta ao Plugnotas nem expor jargão de infraestrutura para o utilizador final.

---

## Critérios de aceite

### Narrativa e copy

- [x] A UI continua tratando a ação como “cadastrar/configurar empresa no emissor”.
- [x] Nenhuma copy nova sugere “endpoint errado”, “POST /empresa”, “addCompany” ou integração direta browser → Plugnotas.
- [x] Existe distinção clara entre erro de ambiente/configuração e erro de payload/contrato, conforme contrato mínimo de metadados recebido do backend.
Critério de encerramento: a implementação frontend consome contrato estável documentado na story backend, no mínimo `plugnotasRequest.method`, `plugnotasRequest.path` e `plugnotasCode` quando presentes, para decidir a narrativa apresentada ao utilizador.

### Causalidade e fallback

- [x] Quando o backend resolver por `PATCH`, a UX mantém narrativa de sucesso operacional/sincronização, sem abrir fluxo paralelo.
Critério de encerramento: existe teste automatizado cobrindo resposta de sucesso operacional após fallback `PATCH`, verificando que a UI não apresenta mensagem de “cadastro falhou” nem fluxo manual alternativo.
- [x] Quando o `POST` falha e a consulta posterior não encontra empresa, a mensagem preserva causalidade: cadastro não concluiu, portanto a empresa ainda não aparece.
Critério de encerramento: existe teste automatizado cobrindo `POST` falho seguido de `GET` sem empresa, verificando que a mensagem apresentada mantém a ordem causal correta.

### Acessibilidade

- [x] O bloco principal de erro segue o padrão acessível já usado na aplicação.
- [x] Não há duplicação desnecessária de alertas com o mesmo conteúdo.

### Qualidade

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`

---

## Dev Notes

### File Locations

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/utils/plugnotasEmitenteSetup.ts`
- `frontend/src/services/meiNotasService.ts`
- testes de `GuidesMei` e `FiscalIntegrationErrorAlert`

### Technical Constraints

- Não criar nova rota visual de cadastro.
- Não introduzir browser → Plugnotas.
- Reutilizar padrões existentes de alertas/tiers sempre que possível.
- Não assumir contrato de erro implícito; a leitura frontend deve seguir apenas os metadados estáveis definidos na story backend ENDP.

---

## Tasks / Subtasks

1. [x] Revisar a copy e a classificação de estados de erro do cadastro da empresa.
2. [x] Ajustar a UI para distinguir ambiente/configuração vs payload/contrato usando explicitamente o contrato backend → UI definido na story ENDP backend.
3. [x] Garantir coerência de causalidade entre `POST` falho e `GET` negativo posterior.
4. [x] Preservar narrativa única em caso de fallback `PATCH`.
5. [x] Adicionar ou ajustar testes automatizados cobrindo, no mínimo:
   `a)` erro de ambiente/configuração,
   `b)` erro de payload/contrato,
   `c)` sucesso operacional após fallback `PATCH`,
   `d)` `POST` falho seguido de `GET` sem empresa.
6. [x] Executar os gates do projeto e atualizar esta story.

---

## File list (esperada / a confirmar na execução)

- [x] `frontend/src/pages/GuidesMei.tsx`
- [x] `frontend/src/lib/fiscalUserError.ts`
- [x] `frontend/src/utils/apiClientError.ts`
- [x] `frontend/src/utils/plugnotasIntegrationErrorMessage.ts`
- [x] `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- [x] `frontend/src/lib/fiscalUserError.test.ts`
- [x] `frontend/src/utils/apiClientError.test.ts`
- [x] `frontend/src/utils/plugnotasIntegrationErrorMessage.test.ts`
- [x] `docs/stories/story-fr-endp-p0-frontend-ux-diagnostico-cadastro-plugnotas.md`

---

## CodeRabbit Integration

- Foco principal:
  - coerência de mensagem com o backend
  - causalidade POST → GET
  - ausência de jargão técnico ao utilizador
  - preservação da superfície única Guia MEI

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/utils/apiClientError.ts`
- `frontend/src/utils/plugnotasIntegrationErrorMessage.ts`
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- `frontend/src/lib/fiscalUserError.test.ts`
- `frontend/src/utils/apiClientError.test.ts`
- `frontend/src/utils/plugnotasIntegrationErrorMessage.test.ts`

### Debug Log References

- `npm run lint` — passou; warnings antigos do frontend permaneceram sem erro.
- `npm run typecheck` — passou.
- `npm test` — passou.

### Completion Notes

- A UI passou a consumir explicitamente `errors.plugnotasRequest.method`, `errors.plugnotasRequest.path`, `errors.plugnotasCode` e `httpStatus` via `ApiClientError`, em vez de depender só de heurística textual.
- O frontend agora remove o sufixo técnico `(<METHOD> <PATH> no emissor fiscal)` da mensagem mostrada ao utilizador, evitando expor `POST /empresa` / `GET /empresa/:cnpj` na Guia MEI.
- `mapMeiFiscalErrorToCopy` passou a distinguir:
  - ambiente/configuração do emissor quando houver sinal estável de gateway/upstream no cadastro da empresa;
  - causalidade de cadastro pendente quando o backend devolver `plugnotasCode = empresa_nao_cadastrada` em `GET /empresa/:cnpj`;
  - payload/contrato mantendo a narrativa de validação do provedor, sem linguagem de “rota errada”.
- Em sucesso com `operation = updated|existing`, a Guia MEI agora usa narrativa de sincronização/sucesso operacional, sem abrir fluxo alternativo.
- Cobertura adicionada:
  - sanitização do sufixo técnico de `plugnotasRequest`;
  - leitura de `plugnotasRequest` em `ApiClientError`;
  - sucesso operacional após fallback `PATCH`;
  - fluxo `POST` falho seguido de `GET` sem empresa, sem expor endpoint técnico.

### Change Log

- 2026-04-09 — Story criada pelo @sm a partir do PRD ENDP, spec UX e arquitetura técnica.
- 2026-04-09 — Story refinada pelo @sm após avaliação do @po: dependência backend nomeada, contrato mínimo backend→UI explicitado e cenários mínimos de teste adicionados.
- 2026-04-09 — @dev implementou o consumo explícito de `plugnotasRequest`/`plugnotasCode` no frontend, ajustou a narrativa de fallback `PATCH`, removeu sufixos técnicos da UI e executou os gates; story promovida para `Ready for Review`.

---

## QA Results

- A preencher por @qa.
