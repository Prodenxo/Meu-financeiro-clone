# Story — FR-NAT (P1): Documentação — **`operacao-mei-nfse`**: modo NFS-e Nacional vs municipal

**ID:** STORY-FR-NAT-P1-OPERACAO-DOC-NFSE  
**Prioridade:** P1  
**Depende de:** Entrega preferível após [story-fr-nat-p0-plugnotas-erro-municipal-copy-hints.md](./story-fr-nat-p0-plugnotas-erro-municipal-copy-hints.md) (para alinhar âncoras e vocab com código).  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — **FR-NAT-DOC-01**  
**UX:** [`docs/specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — referência a âncoras  
**Arquitetura:** [`docs/technical/architecture-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../technical/architecture-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — **NFR-N04**, §8

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev (ou @po com revisão @dev para precisão técnica) |
| **quality_gate** | @qa — revisão de conteúdo + link `#` quebrado |
| **quality_gate_tools** | N/A código; opcional `npm run validate:*` se o repo validar docs |

---

## User story

**Como** utilizador ou suporte a consultar o guia interno de operação fiscal,  
**quero** encontrar uma secção que distinga **NFS-e Nacional** e **fluxo municipal** no cadastro Plugnotas, com ponteiro para o PRD e troca de mensagens típicas,  
**para** resolver bloqueios de cadastro sem abrir ticket sem contexto.

---

## Contexto

- `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` em `nfseNacionalPlugnotasErrorHints.ts` deve corresponder a âncora real em `docs/operacao-mei-nfse.md`.  
- **NFR-N04:** doc deve admitir que painel e API podem divergir até haver evidência fechada.

---

## Critérios de aceite

- [ ] **FR-NAT-DOC-01:** `docs/operacao-mei-nfse.md` inclui secção (ou amplia existente) que:  
  - Descreve modo **NFS-e Nacional** no produto (cadastro MEI, sem IM/prefeitura no formulário).  
  - Contrasta com exigências **municipais** que a API ainda pode devolver.  
  - Referencia PRD [`PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) e, se útil, ADR spike nacional.  
- [ ] Âncora utilizada pela app (`#...`) existe e coincide com constante no frontend **ou** a constante é actualizada na mesma PR.  
- [ ] Revisão ortográfica PT-BR; sem promessa legal de emissão autorizada.

---

## Tasks (indicativas)

1. [x] Mapear âncoras actuais em `operacao-mei-nfse.md` (#plugnotas-nfse-nacional-erros-mensagens, etc.).  
2. [x] Redigir subsecção “Nacional vs municipal” + troubleshooting.  
3. [x] Garantir paridade com `nfseNacionalPlugnotasErrorHints.ts` (comentário no código se âncora mudar).  
4. [x] PR só com ficheiros `docs/` (+ ajuste de constante em TS se necessário).

---

## File list (indicativo)

- [ ] `docs/operacao-mei-nfse.md`  
- [ ] Opcional: `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — só se `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` precisar sincronizar  

---

## Fora de escopo

- Implementação UI dos painéis — stories P0.  
- Tradução para outros idiomas.

---

## CodeRabbit Integration

- N/A código extenso; se tocar em TS, mesma PR deve manter lint.

---

## Dev Agent Record

*(preencher por executor)*

### Status

Ready for Review

### Completion Notes

- `docs/operacao-mei-nfse.md`: secção **Modo NFS-e Nacional no formulário vs exigência municipal na API** (`#nfse-nacional-vs-municipal-cadastro`), PRD/UX/arquitetura/ADR; âncora `#emissor-nfse-nacional-spike-nat01` adicionada (paridade com `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` e `guia-mei-nfse-nacional.html`); bullet de escopo IM alinhado ao PRD NAT; tabela de mensagens + troubleshooting 2b.4 coerente com modo nacional; linhas municipais na tabela de heurística.
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`: comentário de cabeçalho com IDs de âncora na operação.
- Sem alteração da constante `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` (já coincidia com `public/guia-mei-nfse-nacional.html`; falta de ID no `.md` corrigida na doc).
- Follow-up QA (2026-04-08): em `operacao-mei-nfse.md`, terminologia uniformizada para **utilizador** (escopo, checklist 400, resumo Guia MEI), alinhado ao user story e à observação de estilo do gate PASS. A task indicativa «PR só `docs/`» mantém exceção aceita: comentário de cabeçalho em `nfseNacionalPlugnotasErrorHints.ts` só para sincronizar âncoras doc ↔ código (critério de aceite já previa TS na mesma PR).

### File List

- `docs/operacao-mei-nfse.md`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story P1 para **FR-NAT-DOC-01**. |
| 2026-04-08 | @dev | Doc operação: nacional vs municipal + âncoras sincronizadas. |
| 2026-04-08 | @dev | Follow-up QA: PT harmonizado (**utilizador**) em `operacao-mei-nfse.md`; registro explícito da exceção TS para âncoras (task indicativa). |

---

## QA Results

**Revisor:** Quinn (@qa)  
**Data:** 2026-04-08  
**Gate:** **PASS**

### Rastreio aos critérios de aceite

| Critério | Resultado | Evidência |
|----------|-----------|-----------|
| **FR-NAT-DOC-01** — secção nacional vs municipal | **PASS** | `docs/operacao-mei-nfse.md`: `#### Modo NFS-e Nacional no formulário vs exigência municipal na API` (`#nfse-nacional-vs-municipal-cadastro`); produto sem IM/prefeitura no formulário PRD; API municipal; ligações a PRD, UX spec, arquitetura, ADR spike. |
| **Âncora app ↔ doc** | **PASS** | `<a id="emissor-nfse-nacional-spike-nat01"></a>` presente (par a `plugnotas-nfse-nacional-spike-nat01`); alinhado a `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` em `nfseNacionalPlugnotasErrorHints.ts`; tabela de mensagens documenta ambas as âncoras + fallback `guia-mei-nfse-nacional.html`. |
| **PT-BR / tom legal** | **PASS** | NFR-N04 e aviso explícito contra promessa de homologação/legalidade em todos os municípios; sem alegação de emissão autorizada. |
| **Paridade hints / doc** | **PASS** | Comentário no cabeçalho de `nfseNacionalPlugnotasErrorHints.ts` com `#plugnotas-nfse-nacional-erros-mensagens` e `#nfse-nacional-vs-municipal-cadastro`; tabela em `operacao-mei-nfse.md` inclui linhas municipal **FR-NAT-ERR-01** e referência a `PlugnotasMunicipalRequirementOperacaoCopy.tsx`. |
| Troubleshooting **2b.4** | **PASS** | Texto alinhado ao modo nacional + link interno para `#nfse-nacional-vs-municipal-cadastro`. |

### Observações (não bloqueantes)

- **CONCERNS — Estilo:** O ficheiro `operacao-mei-nfse.md` mistura **utilizador** e **usuário** em bullets próximos (escopo vs checklist); opcional harmonizar numa passagem editorial futura.
- **CONCERNS — Task indicativa:** O critério “PR só com `docs/`” foi estendido com um comentário em TS (baixo risco; lint já coberto pelo pipeline habitual).

### Verificações executadas nesta revisão

- Leitura estática de `docs/operacao-mei-nfse.md` (âncoras, links relativos `prd/`, `specs/`, `technical/`, `adr/`).
- Cruzamento com `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` (`NFSE_NACIONAL_OPERACAO_DOC_ANCHOR`).
- Confirmação de existência dos ficheiros referenciados no PRD/UX (nomes de ficheiro na pasta `docs/`).
