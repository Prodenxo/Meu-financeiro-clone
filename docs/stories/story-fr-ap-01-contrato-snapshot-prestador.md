# Story — FR-AP-01: Contrato do snapshot `nfseEmitente` para autopreenchimento do prestador

**ID:** STORY-FR-AP-01  
**Prioridade:** P0 (bloqueante)  
**Tipo:** alinhamento técnico/contrato (backend + integração)  
**Depende de:** [story-fr-p-03-04-nfse-emitente-user-mei-certificates.md](./story-fr-p-03-04-nfse-emitente-user-mei-certificates.md)  
**Fonte:** `docs/prd/PRD-autopreenchimento-prestador-user-mei-certificates-2026-03-31.md` (FR-AP-01, FR-AP-02, §7)

## User story

**Como** equipa de produto e engenharia,  
**quero** consolidar o contrato do `nfseEmitente` devolvido em `GET /mei-guide/certificate/status`,  
**para** o frontend preencher automaticamente os campos do prestador com mapeamento estável e sem ambiguidades.

## Contexto técnico

- O PRD define `user_mei_certificates` como fonte de hidratação inicial do prestador.
- O endpoint de status já retorna `nfseEmitente`; esta story fixa o contrato e normalização para evitar regressão.
- Mapeamento mínimo esperado (origem -> formulário): `cert_document`, `razao_social`, `fiscal_email`, `logradouro`, `numero`, `ibge_municipio`, `cep`, `complemento`, `bairro`, `cidade`, `uf`.
- Normalização esperada: CNPJ/CEP em dígitos; UF em maiúsculas.

## Critérios de aceite

- [ ] Contrato de `nfseEmitente` documentado no código (tipo/interface ou comentário canónico) e coerente com o PRD §7.
- [ ] `GET /mei-guide/certificate/status` devolve `nfseEmitente` com os campos necessários ao autopreenchimento do prestador.
- [ ] Ausência de dados não quebra retorno: endpoint segue funcional com `nfseEmitente` ausente/nulo (fallback para frontend).
- [ ] Normalizações acordadas (CNPJ/CEP/UF) aplicadas no snapshot retornado.
- [ ] Teste(s) backend cobrindo presença e ausência de `nfseEmitente`.

## Fora de escopo

- Implementação de UX de preenchimento no formulário NFS-e.  
- Reformulação de layout em `GuidesMei`.

## File list (checklist implementação)

- [ ] `backend/src/services/mei-guide.service.js`
- [ ] `backend/src/services/mei-certificate-store.js`
- [ ] `backend/tests/` (arquivo(s) de status/snapshot emitente)
- [ ] (Opcional) documentação técnica em `docs/technical/` se houver divergência de contrato

## Definition of Done

- `cd backend && npm run lint`  
- `cd backend && npm test`

## Qualidade / CodeRabbit

- Garantir que o contrato não expõe dados sensíveis além do necessário para emissão.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Contrato **`NfseEmitenteApiSnapshot`** documentado em JSDoc em `mei-certificate-store.js` (campos do PRD + `certDocument` opcional a partir de `cert_document`).
- **`getEmitenteNfseSnapshot`:** passa a selecionar `cert_document`; **`emitenteDbRowHasNfseData`** considera CNPJ/CPF na linha como dado válido (snapshot já não fica `null` só com documento gravado).
- **`emitenteRowToApiShape`:** normaliza **CEP** (só dígitos), **UF** (2 maiúsculas), **IBGE** (preferência por dígitos); inclui **`certDocument`** quando há `cert_document` com ≥11 dígitos.
- **`getCertificateStatus`:** comentário de referência ao typedef no `mei-guide.service.js`.
- Testes em `mei-certificate-emitente.test.js`: normalização, `certDocument`, presença só com documento, ausência de dados.
- **Pós-QA (concerns):** `emitenteDbRowHasNfseData` **ignora** isoladamente `optante_simples_nacional` (evita snapshot vazio exceto default); teste **só optante não basta**. Tipagem **`certDocument`** em `NfseEmitenteSnapshot` (`guidesMeiService.ts`). Teste HTTP mock Supabase não adicionado: `node --test` corre ficheiros em paralelo e partilha cache de módulos — risco de flakiness; permanece como follow-up opcional (FR-AP-03 / `--test-concurrency=1`).

### File List (implementação)

- `backend/src/services/mei-certificate-store.js`
- `backend/src/services/mei-guide.service.js`
- `backend/tests/mei-certificate-emitente.test.js`
- `frontend/src/services/guidesMeiService.ts`

### Debug Log References

- `cd backend && npm run lint` — OK  
- `cd backend && npm test` — 211 pass  
- `cd frontend && npm run typecheck` — OK (pós-QA `certDocument`)

### Change Log

| Data | Nota |
|------|------|
| 2026-03-31 | Story criada pelo SM (River) a partir do PRD de autopreenchimento do prestador. |
| 2026-03-31 | Implementação contrato/normalização `nfseEmitente` + testes; Ready for Review. |
| 2026-03-31 | Pós-QA: heurística `emitenteDbRowHasNfseData`, teste optante-only, tipo `certDocument` no frontend. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-31  
**Tipo:** revisão estática + execução de testes focados no módulo alterado

### Decisão de gate

**PASS com CONCERNS (leves)** — implementação alinhada aos critérios de aceite; ressalvas abaixo são **não bloqueantes** para merge desta story (contrato backend + unidades).

### Rastreio aos critérios de aceite

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| Contrato documentado no código | **OK** | JSDoc `@typedef NfseEmitenteApiSnapshot` em `mei-certificate-store.js` (linhas ~180–200): campos do PRD §7 + `certDocument` opcional. |
| `GET .../certificate/status` com campos necessários | **OK** | `getEmitenteNfseSnapshot` inclui `cert_document` e colunas de emitente; `getCertificateStatus` repassa `nfseEmitente`; comentário de referência ao typedef em `mei-guide.service.js`. |
| Ausência de dados / resposta estável | **OK** | `getEmitenteNfseSnapshot` devolve `null` se erro, sem dados ou `emitenteDbRowHasNfseData` falso; `getCertificateStatus` encapsula em `try/catch` e devolve `nfseEmitente: null` sem quebrar o payload. |
| Normalização CNPJ/CEP/UF (e IBGE) | **OK** | `emitenteRowToApiShape`: CEP e `certDocument` só dígitos; UF maiúsculas 2 chars; IBGE com preferência por dígitos. Testes dedicados em `mei-certificate-emitente.test.js`. |
| Testes presença vs ausência | **Parcial OK** | Cobertura **unitária** forte: `emitenteDbRowHasNfseData` (só documento vs sem dados), `emitenteRowToApiShape` (normalização + `certDocument`). **Sem** teste HTTP integrado de `GET /mei-guide/certificate/status` nem mock de Supabase em `getEmitenteNfseSnapshot`. |

### Execução na revisão

- `cd backend && npm run lint` — OK  
- `node --test tests/mei-certificate-emitente.test.js` — **9/9** pass

### NFR / segurança

- Snapshot continua a expor apenas dados fiscais/endereço e documento já inerentes ao fluxo MEI/NFS-e; **não** inclui `pfx` nem senha — coerente com a story “contrato para emissão”.  
- **`certDocument` no JSON:** o tipo `NfseEmitenteSnapshot` no frontend (`guidesMeiService.ts`) ainda não declara `certDocument`; é **dívida esperada** para **FR-AP-02** (consumo tipado + autopreenchimento do prestador).

### Observações (não bloqueantes)

1. **`optante_simples_nacional: true` com resto vazio:** `emitenteDbRowHasNfseData` retorna **true** (boolean conta na linha). O snapshot terá sobretudo defaults de regime/simples; aceitável, mas pode gerar objeto “pobre” se só existir flag no DB — baixo risco.  
2. **Teste de integração:** um caso supertest ou stub de `createSupabaseClient` para `getEmitenteNfseSnapshot` fecharia o critério “ausência de `nfseEmitente`” ao nível de rota; opcional como **FR-AP-03** ou dívida técnica.

### Resumo

Contrato **`NfseEmitenteApiSnapshot`** consolidado, normalizações aplicadas no snapshot, regressão do status protegida com `null`/`try/catch`, e base de testes unitários adequada. **Aprovável para merge** da story FR-AP-01; seguir com **FR-AP-02** para tipagem e uso de `certDocument` no cliente.

— Quinn, guardião da qualidade 🛡️
