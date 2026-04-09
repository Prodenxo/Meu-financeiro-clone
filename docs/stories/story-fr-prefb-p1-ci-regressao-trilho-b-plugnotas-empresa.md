# Story — FR-PREFB (P1): Regressão CI — trilho B Plugnotas empresa (`nfsePrefeituraPayload` + `plugnotas-empresa`)

**ID:** STORY-FR-PREFB-P1-CI-REGRESSAO-TRILHO-B-PLUGNOTAS  
**Prioridade:** P1  
**Depende de:** [story-fr-prefb-p1-operacao-mei-nfse-env-trilho-b-derive-ibge.md](./story-fr-prefb-p1-operacao-mei-nfse-env-trilho-b-derive-ibge.md) *(opcional em paralelo — sem conflito de código se doc-only)*  
**Relaciona com:** [story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md](./story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md) — implementação base  
**Fonte PRD:** [`docs/prd/PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../prd/PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) — **FR-PREFB-QA-01**; **NFR-PREFB-02**, **NFR-PREFB-03** *(política de logs — sem alteração de código salvo gap detectado)*  
**UX:** [`docs/specs/ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../specs/ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) — secção 6 (QA UX: regressão PREF-L1)  
**Arquitetura:** [`docs/technical/architecture-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../technical/architecture-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) — §7

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` (**NFR-PREFB-02** / `AGENTS.md`) |
| **revisão** | @architect — se for necessário alterar testes ou serviço, manter ordem `normalizePayloadEnderecoCodigoCidade` → `applyNfsePrefeituraIbgeIfEnabled` |

---

## User story

**Como** responsável pela qualidade do repositório,  
**quero** confirmar que os testes de contrato do trilho B continuam a passar e que os gates globais estão verdes após o incremento documental PREFB,  
**para** que **FR-PREFB-QA-01** bloqueie regressões em `POST`/`PATCH` empresa com `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`.

---

## Contexto

- **FR-PREFB-QA-01:** manter verdes `backend/tests/nfsePrefeituraPayload.test.js` e `backend/tests/plugnotas-empresa.test.js` (casos com env `true` / `false`).  
- Se a story de **doc** não tocar código, esta story pode consistir em **executar gates e registar resultado**; só há trabalho de código se CI falhar ou PO pedir teste adicional explícito.  
- **Frontend:** spec UX §6 exige regressão em `nfseNacionalPlugnotasErrorHints.test.tsx` / painéis para variante **prefeitura-config** — incluir no mesmo comando `npm test` do monorepo (frontend + backend conforme `package.json` raiz).

---

## Critérios de aceite

### Testes backend (obrigatório)

- [ ] `backend/tests/nfsePrefeituraPayload.test.js` — todos os casos passam.  
- [ ] `backend/tests/plugnotas-empresa.test.js` — inclui asserts POST/PATCH com `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` conforme implementação actual; **sem** regressão “sem env não envia prefeitura”.

### Gates repositório

- [ ] **NFR-PREFB-02:** `npm run lint`, `npm run typecheck`, `npm test` verdes na raiz do projeto (ou comando único documentado no repo se diferente).

### UX / hints (regressão mínima)

- [ ] Testes existentes em `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts` (e painéis relacionados, se aplicável) passam — variante **prefeitura-config** inalterada em comportamento (**spec UX §6**).

### Se nada falhar

- [ ] Registar no **Dev Agent Record** “CI verde em &lt;data&gt;; sem alteração de código”.  
- [ ] Se algo falhar, corrigir com diff mínimo + nota na **Change Log** da story.

---

## Tasks (indicativas)

1. [x] `npm run lint`  
2. [x] `npm run typecheck`  
3. [x] `npm test` (ou scripts equivalentes do repo)  
4. [x] Se falha: isolar pacote (backend vs frontend), corrigir ou escalar. *(N/A — gates verdes)*  
5. [x] Preencher **QA Results** e **Dev Agent Record**. *(Dev Agent Record preenchido; QA Results reservado a @qa)*

---

## File list (indicativo)

- *Nenhum* se CI já verde.  
- Possíveis se regressão:  
  - `backend/tests/nfsePrefeituraPayload.test.js`  
  - `backend/tests/plugnotas-empresa.test.js`  
  - `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` *(improvável neste incremento doc-first)*

---

## CodeRabbit Integration

- Se houver alteração de teste: focar em estabilidade de `process.env` (restore após cada teste) e paridade POST/PATCH.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- *Nenhum ficheiro de código alterado* — regressão confirmada apenas por execução de gates na raiz do repositório.

### Notes

- **CI verde em 2026-04-09** (`npm run lint`, `npm run typecheck`, `npm test` na raiz). Sem alteração de código necessária para **FR-PREFB-QA-01**.
- Lint: exit 0 (frontend com avisos pré-existentes; 0 errors). Backend: `node --check src/server.js` OK.
- Testes workspaces executados com sucesso (~50s); inclui `backend/tests/nfsePrefeituraPayload.test.js`, `backend/tests/plugnotas-empresa.test.js` e pacote frontend (incl. `nfseNacionalPlugnotasErrorHints.test.ts`).
- **Resposta aos pontos QA (secção QA Results, observações não bloqueantes):** (1) *Warnings* ESLint no frontend — **sem acção nesta story**; dívida técnica pré-existente; reduzir avisos seria âmbito de story de higiene separada (não **FR-PREFB-QA-01**). (2) **NFR-PREFB-03** — confirmado: nenhuma alteração de logging necessária neste incremento.

### Change Log

- 2026-04-09 — Story criada pelo SM a partir do PRD §14 e **FR-PREFB-QA-01**.
- 2026-04-09 — @dev: gates executados; sem diff; status **Ready for Review**.
- 2026-04-09 — @dev: após revisão QA (**PASS**), registada resposta formal às observações não bloqueantes; continuação sem diff de código.

---

## QA Results

**Revisor:** Quinn (@qa)  
**Data da revisão:** 2026-04-09  
**Decisão de gate:** **PASS**

### Resumo

A story cumpre o âmbito **verificação de regressão / gates** sem alteração de código. O **Dev Agent Record** está coerente com evidência reproduzível nos testes alvo.

### Rastreio de requisitos

| Requisito | Evidência |
|-----------|-----------|
| **FR-PREFB-QA-01** | `backend/tests/nfsePrefeituraPayload.test.js` — 7/7 pass (re-execução QA). `backend/tests/plugnotas-empresa.test.js` — 35/35 pass; inclui `POST`/`PATCH` com `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` e `nfse.config.prefeitura.codigoIbge`. |
| **NFR-PREFB-02** (`AGENTS.md`) | Gates confirmados pelo @dev na entrega; QA revalidou subconjunto crítico (testes acima + `nfseNacionalPlugnotasErrorHints.test.ts` 55/55). |
| Spec UX §6 (hints **prefeitura-config**) | `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts` — 55 testes pass na re-execução QA. |

### Comandos executados nesta revisão (QA)

```text
cd backend && node --test tests/nfsePrefeituraPayload.test.js   # pass 7
cd backend && node --test tests/plugnotas-empresa.test.js       # pass 35
cd frontend && npx vitest run src/utils/nfseNacionalPlugnotasErrorHints.test.ts  # pass 55
```

### Observações (não bloqueantes)

- **Lint:** na entrega anterior, `npm run lint` reportou *warnings* no frontend (0 errors); não há diff nesta story — dívida pré-existente, fora do escopo **PREFB-CI**.
- **NFR-PREFB-03:** sem alteração de código de logging; nada a auditar neste incremento.

### Conclusão

Aprovação para fecho do ponto **FR-PREFB-QA-01** conforme documentado. Próximo passo operacional: **@github-devops** para push/PR se ainda não integrado.

— Quinn, guardião da qualidade
