# Test design — Story P1 — `nfse.config.prefeitura` (trilhos B / C / D)

**Objetivo:** materializar as recomendações de QA (2026-04-08) para quando **FR-PREF-API-01** for implementado. **Não** substitui testes reais até existir código e schema fechados no ADR.

**Story:** [`docs/stories/story-fr-pref-p1-plugnotas-nfse-config-prefeitura-payload-bcd.md`](../stories/story-fr-pref-p1-plugnotas-nfse-config-prefeitura-payload-bcd.md)

---

## 1. Contrato — frontend (`nfEmissionCompany`)

| ID | Given | When | Then |
|----|--------|------|------|
| TD-P1-FE-01 | Payload MEI com CNPJ/endereço válidos e trilho activo | `buildNfEmissionEmpresaPayload` (ou equivalente) | `nfse.config` inclui `prefeitura` com *shape* igual ao exemplo do ADR (campos acordados). |
| TD-P1-FE-02 | Conta “só nacional” / flag desactivada (trilho **B** com *kill switch* off) | Montagem do payload | `nfse.config` **não** inclui `prefeitura` (baseline preservado). |
| TD-P1-FE-03 | Trilho **C**: utilizador não preencheu campos opcionais de prefeitura | Submit | Validação local ou ausência de ramo conforme spec UX §7. |

---

## 2. Contrato — BFF / backend (espelho ADR)

| ID | Given | When | Then |
|----|--------|------|------|
| TD-P1-BE-01 | Body recebido do cliente com `nfse.config.prefeitura` | Montagem/repasse para Plugnotas | JSON enviado a `POST/PATCH /empresa` coincide com ADR (sem campos extra não documentados). |
| TD-P1-BE-02 | Trilho **B**: derivação a partir de `codigoCidade` (ou regra ADR) | Servidor monta payload | Teste unitário com cidade de exemplo → objeto `prefeitura` esperado. |
| TD-P1-BE-03 | `documentosAtivos` e política “apenas NFS-e” | Qualquer caminho P1 | Sem regressão: mesma estrutura de `documentosAtivos` que baseline (**NFR-PREF-02**). |

---

## 3. Trilho **B** — *kill switch* (env)

| ID | Given | When | Then |
|----|--------|------|------|
| TD-P1-B-01 | `FEATURE_*` ou env documentado desligado | Cadastro empresa | Nenhuma derivação automática de `prefeitura`; comportamento igual ao pré-P1. |
| TD-P1-B-02 | Env ligado + dados suficientes | Cadastro empresa | Derivação aplicada conforme ADR. |

*(Nome exacto da variável: definir na implementação e documentar em `operacao-mei-nfse.md` ou ADR.)*

---

## 4. UI — trilhos **C / D** (spec UX §7)

| ID | Given | When | Then |
|----|--------|------|------|
| TD-P1-UI-01 | Erro `prefeitura-config` (P0) + fluxo D | Utilizador vê bloco condicional | `role="region"` e rótulo alinhado a “só se o emissor exigir” (ou equivalente aprovado). |

---

## 5. Gates

Após implementação: `npm run lint`, `npm run typecheck`, `npm test` (repo).
