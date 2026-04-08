# Story — FR-CID (P0): Normalização **`codigoCidade` (IBGE)** — cliente, servidor e documentação

**ID:** STORY-FR-CID-P0-IBGE-NORMALIZACAO  
**Prioridade:** P0  
**Depende de:** —  
**Bloqueia:** [story-fr-cid-p1-ibge-cidade-ux-hint-erro.md](./story-fr-cid-p1-ibge-cidade-ux-hint-erro.md) (hint de erro IBGE na UI assenta em mensagens estáveis pós-fix técnico)  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../prd/PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — **FR-CID-FE-01**, **FR-CID-FE-02**, **FR-CID-FE-03**, **FR-CID-PAY-01**, **FR-CID-BE-01**, **FR-CID-QA-01**, **FR-CID-DOC-01**, **NFR-CID-01**–**04**  
**UX:** [`docs/specs/ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../specs/ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — secções 5.1 (comportamento invisível), 4.3 (sem jargão técnico exposto)  
**Arquitetura:** [`docs/technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — §2 (contrato), §4 (file map), §6 (fluxos), §7 (testes), §8 (padding 6→7 **desligado** por defeito)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — paridade semântica FE/BE do normalizador; **não** alargar escopo a `packages/shared` sem ADR |

---

## User story

**Como** MEI que configura a empresa no emissor fiscal (Plugnotas) a partir do Guia MEI,  
**quero** que o código IBGE do município seja sempre tratado de forma consistente (tipo e formato) no cliente e no servidor,  
**para** evitar falhas técnicas no envio e rejeições do provedor causadas só por número em JSON ou caracteres não numéricos, mantendo a política fiscal actual (apenas NFS-e, documentos ativos).

---

## Contexto

- **Bug actual:** `form.codigoCidade.trim is not a function` quando o estado React tem **number**; validação usa `String()` noutro sítio e não alinha com o builder do payload.  
- **Plugnotas:** 400 com `fields.endereco.codigoCidade` / tabela IBGE pode persistir se o **conteúdo** for errado na fonte — esta story corrige **canal técnico**, não a tabela do provedor.  
- **Padding 6→7:** **não** activar até existir exemplo real + teste (**PRD** §6.2); implementar função já preparada para um *flag* ou ramo morto documentado “OFF”.  
- **NFR-CID-04:** não alterar `nfse`/`nfe`/`nfce` policy nem `documentosAtivos`.  
- **Paridade:** `emitenteRowToApiShape` em `mei-certificate-store.js` já usa `digitsOnly`; o util novo deve ser compatível (arquitetura §2.2); refactor opcional para reutilizar o mesmo módulo no store fica **fora** do critério mínimo.

---

## Critérios de aceite

### Técnico — Frontend

- [x] **FR-CID-FE-01:** `buildNfEmissionEmpresaPayload` define `endereco.codigoCidade` via `normalizeIbgeMunicipioCodigo` (sem `.trim()` directo em valor não coergido).  
- [x] **FR-CID-FE-02:** `emitenteSnapshotToForm` normaliza `codigoCidade` após mapear o snapshot para o formulário.  
- [x] **FR-CID-FE-03:** `applyBrasilApiToEmitente` e o merge de endereço do prestador a partir de `codigo_municipio` aplicam o mesmo normalizador antes de `setState`.  
- [x] **FR-CID-PAY-01:** Com `form.codigoCidade` como **number** (ex.: `3550308`), o JSON enviado ao BFF tem `endereco.codigoCidade` **string** só com dígitos (`"3550308"`).  
- [x] Novo módulo `frontend/src/utils/ibgeMunicipioCodigo.ts` + testes `ibgeMunicipioCodigo.test.ts` (idempotência, vazio, máscaras).  
- [x] Opcional: `brasilApi.ts` — tipo `codigo_municipio: string | number | null` para reflectir JSON real.

### Técnico — Backend

- [x] **FR-CID-BE-01:** Novo `backend/src/utils/ibge-municipio-codigo.js` com a **mesma** semântica que o frontend (comentário de referência à arquitectura §2).  
- [x] `cadastrarEmpresaPlugNotas` e `atualizarEmpresaPlugNotas` normalizam `payload.endereco.codigoCidade` **antes** de `requestJson` / `tryUpdateEmpresa`, sem criar `endereco` se ausente.  
- [x] Rever `plugnotas-emitente-setup.service.js`: caminho final de empresa deve passar pela normalização (arquitetura §4.2).  
- [x] Testes unitários backend para o util +, se o repo tiver padrão, inspecção de payload enviado ao fetch (spy) com número → string.  
- [x] **NFR-CID-03:** sem novos logs com PII extra.

### Documentação e qualidade

- [x] **FR-CID-DOC-01:** `docs/operacao-mei-nfse.md` — 1–3 bullets sobre 400 IBGE em `endereco.codigoCidade`, distinção formato/dados incorrectos na fonte, links PRD + arquitectura.  
- [x] **FR-CID-QA-01** satisfeito pelos testes acima.  
- [x] **NFR-CID-01:** `npm run lint`, `npm run typecheck`, `npm test` — exit 0.

### Fora desta story

- **FR-CID-UX-02** (linha de ajuda no alerta fiscal) e *hint* visual sob o campo — [story-fr-cid-p1-ibge-cidade-ux-hint-erro.md](./story-fr-cid-p1-ibge-cidade-ux-hint-erro.md).  
- **Stretch:** substituir `buildPrestadorEnderecoFromInput` por normalizador comum; alinhar `emitenteRowToApiShape` ao util — só se @dev confirmar esforço marginal na mesma sprint.

---

## Tasks (indicativas)

1. [x] Criar `normalizeIbgeMunicipioCodigo` + testes FE.  
2. [x] Integrar em `nfEmissionCompany.ts` e `GuidesMei.tsx` (snapshot, Brasil API, prestador).  
3. [x] Criar util BE espelhado + testes; integrar em `empresa.service.js` e emitente composite se necessário.  
4. [x] Actualizar `docs/operacao-mei-nfse.md`.  
5. [x] Gates + actualizar **File list** / **Dev Agent Record**.

---

## File list (indicativo)

- [x] `frontend/src/utils/ibgeMunicipioCodigo.ts` *(novo)*  
- [x] `frontend/src/utils/ibgeMunicipioCodigo.test.ts` *(novo)*  
- [x] `frontend/src/utils/nfEmissionCompany.ts`  
- [x] `frontend/src/utils/nfEmissionCompany.test.ts`  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/utils/brasilApi.ts` *(opcional tipos)*  
- [x] `backend/src/utils/ibge-municipio-codigo.js` *(novo)*  
- [x] `backend/tests/ibge-municipio-codigo.test.js` *(novo ou agrupado)*  
- [x] `backend/src/services/plugnotas/empresa.service.js`  
- [x] `backend/tests/plugnotas-empresa.test.js` *(spy `fetch` POST/PATCH `codigoCidade` — follow-up QA)*  
- [x] `backend/src/services/plugnotas/plugnotas-emitente-setup.service.js` *(sem alteração — usa `cadastrarEmpresaPlugNotas` já normalizado)*  
- [x] `docs/operacao-mei-nfse.md`

---

## CodeRabbit Integration

- Focar: paridade FE/BE; não mutar `nfse`/`documentosAtivos`; não expor PII em logs; evitar pad 6→7 sem teste real.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação)

### Completion Notes

- `normalizeIbgeMunicipioCodigo` em FE/BE com testes; `buildNfEmissionEmpresaPayload` e `emitenteSnapshotToForm` / Brasil API / prestador no `GuidesMei.tsx`.
- `empresa.service.js`: `normalizePayloadEnderecoCodigoCidade` antes de `POST`/`PATCH` Plugnotas.
- `docs/operacao-mei-nfse.md`: secção `#endereco-codigo-cidade-ibge-plugnotas` (**FR-CID-DOC-01**).
- Gates: `npm run lint`, `npm run typecheck`, `npm test` — exit 0.
- **Follow-up pós-QA (2026-04-08):** Critérios de aceite no corpo da story marcados `[x]` (obs. QA #1). Testes com spy `global.fetch` em `plugnotas-empresa.test.js` — POST e PATCH enviam `endereco.codigoCidade` como string `"3550308"` quando a entrada é número (fecha lacuna “spy fetch” da tabela QA). **CodeRabbit (obs. QA #3):** tentativa `wsl` falhou — subsistema Linux não instalado neste ambiente; merge/PR deve correr CodeRabbit onde WSL ou CI estiver disponível.

### File List

- `frontend/src/utils/ibgeMunicipioCodigo.ts`
- `frontend/src/utils/ibgeMunicipioCodigo.test.ts`
- `frontend/src/utils/nfEmissionCompany.ts`
- `frontend/src/utils/nfEmissionCompany.test.ts`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/utils/brasilApi.ts`
- `backend/src/utils/ibge-municipio-codigo.js`
- `backend/tests/ibge-municipio-codigo.test.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `docs/operacao-mei-nfse.md`

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story criada (PRD FR-CID P0/P1/P2 + arquitectura + UX comportamental). |
| 2026-04-08 | @dev | Implementação FR-CID P0 (normalização IBGE FE/BE + doc operação). |
| 2026-04-08 | @dev | Follow-up QA: checkboxes critérios `[x]`; testes POST/PATCH `codigoCidade` com spy `fetch` em `plugnotas-empresa.test.js`. |

---

## QA Results

*(preencher por @qa após implementação)*

### 2026-04-08 — Revisão @qa (Quinn)

**Decisão de gate:** **PASS**

**Evidência — gates (NFR-CID-01 / FR-CID-QA-01):** `npm run lint`, `npm run typecheck`, `npm test` — exit 0 (reexecutados na revisão).

**Rastreio aos critérios**

| ID | Verificação |
|----|-------------|
| **FR-CID-FE-01** | `buildNfEmissionEmpresaPayload` usa `normalizeIbgeMunicipioCodigo` em `endereco.codigoCidade` (`frontend/src/utils/nfEmissionCompany.ts`). |
| **FR-CID-FE-02** | `emitenteSnapshotToForm` normaliza `codigoCidade` (`GuidesMei.tsx`). |
| **FR-CID-FE-03** | Brasil API e merge do prestador aplicam o mesmo normalizador antes de `setState` (`GuidesMei.tsx`). |
| **FR-CID-PAY-01** | Coberto por teste em `nfEmissionCompany.test.ts` (número no form → string `"3550308"` no payload). |
| **Util + testes FE** | `ibgeMunicipioCodigo.ts` / `ibgeMunicipioCodigo.test.ts` — vazio, máscaras, número, idempotência. |
| **Opcional tipos Brasil API** | `codigo_municipio: string \| number \| null` em `brasilApi.ts`. |
| **FR-CID-BE-01** | `ibge-municipio-codigo.js` espelha semântica do FE (comentário cruzado à arquitetura §2). |
| **POST/PATCH empresa** | `normalizePayloadEnderecoCodigoCidade` antes de envio; early-return se não houver `endereco` ou `codigoCidade` (`empresa.service.js`). |
| **Emitente setup** | Sem alteração directa; fluxo passa por `cadastrarEmpresaPlugNotas` já normalizado (alinhado com arquitetura §4.2). |
| **Testes BE** | `backend/tests/ibge-municipio-codigo.test.js` cobre util; **não** há spy de `fetch` no payload Plugnotas (story: “se o repo tiver padrão”) — aceite como suficiente com testes de util + paridade FE. |
| **NFR-CID-03** | Alterações não introduzem logs novos com PII; apenas normalização de campo. |
| **FR-CID-DOC-01** | `docs/operacao-mei-nfse.md` — âncora `#endereco-codigo-cidade-ibge-plugnotas` com bullets 400 IBGE, formato vs dados na fonte, links PRD + arquitetura. |
| **NFR-CID-04** | Escopo limitado a `codigoCidade`; sem mudança a política `nfse` / `documentosAtivos` na revisão estática. |

**Observações (não bloqueantes)**

1. Os checkboxes dos **Critérios de aceite** no corpo da story continuam `[ ]`; o conteúdo está satisfeito no código e testes — quem gere o artefato pode alinhar marcação com o ritual DoD.  
2. **FR-CID-UX-02** permanece na story P1; fora do âmbito desta revisão.  
3. **CodeRabbit (WSL):** não executado nesta revisão; recomendado antes de merge se estiver no fluxo do projeto.
