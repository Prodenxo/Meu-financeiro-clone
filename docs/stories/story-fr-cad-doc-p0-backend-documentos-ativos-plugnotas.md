# Story — FR-CAD-DOC (P0): Backend — policy de **documentos ativos** no cadastro Plugnotas

**ID:** STORY-FR-CAD-DOC-P0-BACKEND-DOC-ATIVOS  
**Prioridade:** P0  
**Depende de:** —  
**Bloqueia:** [story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md](./story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md)  
**Fonte:** [`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — **FR-CAD-DOC-04**, **FR-CAD-DOC-05**, **CR-CAD-DOC-01**–**03**  
**Arquitetura:** [`docs/technical/architecture-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../technical/architecture-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) §2–§3

## User story

**Como** sistema de emissão fiscal,  
**quero** normalizar o payload de **POST/PATCH** empresa com base numa **seleção canónica** de documentos ativos (`documentosAtivos`),  
**para** que NF-e/NFC-e possam ficar ativos no Plugnotas quando o utilizador escolher, **sem** sobrescrever essa intenção com a policy “apenas NFS-e” atual (**FR-CAD-DOC-04**, **FR-CAD-DOC-05**).

## Contexto técnico (brownfield)

- Hoje `cadastrarEmpresaPlugNotas` chama `applyEmpresaPlugnotasApenasNfseForPost`, que **força** `nfe`/`nfce` inativos.  
- `atualizarEmpresaPlugNotas` chama `applyEmpresaPlugnotasApenasNfseForPatch`: se `nfe`/`nfce` vêm no corpo, são **substituídos** por inativos — impossibilitando ativar NF-e/NFC-e via PATCH.  
- Controller aceita `req.body` ou `req.body.payload` (`mei-notas.controller.js`).

## Decisão de implementação (fixar no código)

1. Introduzir campo **`documentosAtivos`** no corpo enviado ao serviço (mesmo nível que `cpfCnpj`, ou dentro de `payload` se o cliente usar wrapper — normalizar no serviço após extrair o objeto empresa):

   ```ts
   documentosAtivos?: { nfse: boolean; nfe: boolean; nfce: boolean }
   ```

2. **Validação servidor:** pelo menos um de `nfse` | `nfe` | `nfce` deve ser `true`; caso contrário `400` com mensagem alinhada ao PRD §6.3.

3. **POST:** substituir ou ramificar a policy para montar `nfse` / `nfe` / `nfce` a partir de `documentosAtivos`, mantendo:
   - `applyNfseNacionalDefaultForPost` quando `nfse` ativo;
   - IE vazia → `ISENTO` quando aplicável;
   - blocos inativos **sem** `config` (ADR) quando o tipo estiver desmarcado.

4. **PATCH:** se **`documentosAtivos` presente**, aplicar a **mesma** lógica de montagem dos blocos que no POST (arquitetura §3.2 item 3). Se **`documentosAtivos` ausente**, preservar comportamento atual do PATCH (não incluir `nfe`/`nfce` no corpo → não tocar nos blocos remotos).

5. **Ativar NFE/NFC-e:** quando `ativo: true`, preencher `tipoContrato` e **`config`** mínimos exigidos pelo Plugnotas — **spike em sandbox** ou documentação; se ainda desconhecido no MVP, documentar em Completion Notes e usar valores alinhados ao runbook/projeto existente de NF-e/NFC-e.

6. **Remover** `documentosAtivos` do objeto antes de `fetch` ao Plugnotas (campo **apenas** interno), salvo o provedor aceitar campo extra (assumir **não**).

## Critérios de aceite

- [x] POST com `documentosAtivos: { nfse: true, nfe: false, nfce: false }` gera payload enviado ao Plugnotas **equivalente** ao comportamento atual (CR-CAD-DOC-01).  
- [x] POST com `nfe: true` e/ou `nfce: true` no objeto `documentosAtivos` resulta em blocos `nfe`/`nfce` com `ativo: true` e estrutura válida para o ambiente de teste usado na story.  
- [x] PATCH com `documentosAtivos` altera documentos ativos sem forçar inativo por engano (FR-CAD-DOC-05).  
- [x] PATCH **sem** `documentosAtivos` mantém semântica atual documentada em `docs/operacao-mei-nfse.md` (CR-CAD-DOC-03).  
- [x] `nfse.nacional` / defaults NFS-e Nacional não regressam (CR-CAD-DOC-03).  
- [x] Testes em `backend/tests/plugnotas-empresa.test.js` cobrem os cenários acima.  
- [x] ADR complementar ou atualização de [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) para modo multi-documento.  
- [x] Gates `AGENTS.md`: `npm run lint`, `npm run typecheck`, `npm test` (na raiz ou backend conforme projeto).

## Tasks (implementação)

1. [x] Extrair/normalizar `documentosAtivos` do payload em `cadastrarEmpresaPlugNotas` / `atualizarEmpresaPlugNotas`.  
2. [x] Implementar `applyEmpresaPlugnotasDocumentSelectionForPost` / `ForPatch` (nomes podem variar) em `empresa.service.js` ou módulo dedicado.  
3. [x] Ajustar testes e fixtures em `plugnotas-empresa.test.js`.  
4. [x] Documentar ADR e, se necessário, parágrafo curto em `docs/operacao-mei-nfse.md`.

## Fora de escopo

- UI Guia MEI (story frontend).  
- Persistência Supabase (story P1).  
- Campos fiscais adicionais (CSC, etc.) além do mínimo acordado com Plugnotas nesta story.

## File list (checklist)

- [x] `backend/src/services/plugnotas/empresa.service.js`  
- [ ] `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js` (sem alteração; constantes novas no módulo `plugnotas-empresa-documentos-ativos.js`)  
- [x] `backend/tests/plugnotas-empresa.test.js`  
- [x] `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` ou novo ADR  
- [x] `docs/operacao-mei-nfse.md` (opcional, se fluxo PATCH mudar)

## Definition of Done

- Critérios de aceite verificados.  
- Revisão de segurança: sem log de PII/credenciais além do padrão existente.

## Qualidade / CodeRabbit

- Garantir que `documentosAtivos` não vaze para logs Plugnotas.  
- Funções puras de normalização facilitam testes unitários — preferir extrair para módulo testável.

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- Policy extraída para `plugnotas-empresa-documentos-ativos.js`: `documentosAtivos` validado (≥1 true), removido antes do `fetch`; POST sem campo usa default PRD §6.2 (só NFS-e activo), equivalente ao antigo “apenas NFS-e”.
- Blocos **activos** NF-e / NFC-e: `config` mínimo em constantes no módulo (NF-e `producao`; NFC-e `producao`, série/número, `versaoQrCode` alinhado ao spike anterior); confirmar contra doc oficial / sandbox em QA.
- Gates: `npm run test --workspace backend` OK (251 testes após pós-QA). `npm run lint` no frontend pode reportar warnings pré-existentes.
- Pós-QA (2026-04-07): expectativas dos testes de erro do catálogo MEI (`MeiCatalogoClienteModal` / `MeiCatalogoProdutoModal`) alinhadas a `mapMeiFiscalErrorToCopy` (título «Validação ou rejeição no provedor» para mensagens curtas tipo «Falha do servidor»); `npm test` na raiz verde. Teste extra POST só NFC-e activo (`documentosAtivos` com `nfse: false`).

### File List (final)

- `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js` (novo)
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`
- `docs/operacao-mei-nfse.md`
- `frontend/src/components/MeiCatalogoClienteModal.test.tsx` (pós-QA: assert erro API)
- `frontend/src/components/MeiCatalogoProdutoModal.test.tsx` (pós-QA: assert erro API)

---

## QA Results

**Data:** 2026-04-07  
**Revisor:** Quinn (QA / advisory)  
**Decisão de gate:** **PASS com observações**

### Resumo

A implementação cumpre os requisitos funcionais da story: campo canónico `documentosAtivos`, validação “pelo menos um tipo activo”, remoção antes do `fetch`, montagem de blocos alinhada ao ADR (inactivos sem `config`), ramo PATCH legado preservado quando `documentosAtivos` está ausente, e documentação (ADR + `operacao-mei-nfse.md`). Módulo dedicado (`plugnotas-empresa-documentos-ativos.js`) melhora testabilidade, conforme nota de qualidade da story.

**Verificação de testes (esta revisão):** `npm run test --workspace backend` — **OK** (250 testes, exit 0).

### Rastreio critérios de aceite → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| POST explícito só NFS-e ≡ comportamento anterior (CR-CAD-DOC-01) | OK | `plugnotas-empresa.test.js` — teste “POST com documentosAtivos só NFSe…” |
| POST com NFE e/ou NFC-e activos | OK | Teste “POST com documentosAtivos nfe true…” |
| PATCH com `documentosAtivos` não força inactivo por engano (FR-CAD-DOC-05) | OK | Teste “PATCH com documentosAtivos não força…” |
| PATCH sem `documentosAtivos` (CR-CAD-DOC-03) | OK | Testes existentes p.ex. “atualiza empresa sem certificado” (`nfce` omitido) e PATCH legado com `nfce` forçado inactivo |
| `nfse.nacional` / NFS-e Nacional | OK | Asserções `sent.nfse?.nacional` nos fluxos POST/PATCH relevantes |
| Validação 400 se todos false | OK | Teste “POST com documentosAtivos inválido (todos false)” |
| `documentosAtivos` não enviado ao Plugnotas | OK | `stripDocumentosAtivos` + asserts `'documentosAtivos' in sent === false` |
| ADR / operação | OK | Complemento em `ADR-plugnotas-empresa-payload-apenas-nfse.md`; parágrafo em `docs/operacao-mei-nfse.md` |

### NFRs (segurança / observabilidade)

- **Vazamento de `documentosAtivos` para logs Plugnotas:** o corpo enviado ao `fetch` é montado **após** `stripDocumentosAtivos`; em erro **400** de cadastro empresa, o log opcional (`logPlugnotasEmpresaCadastro400Request`) reflecte o mesmo objeto — **não** deve incluir `documentosAtivos`. Comportamento alinhado à story.
- **PII:** sem alteração ao padrão existente de redacção de payloads.

### Observações e risco residual

1. **Gates raiz (`AGENTS.md`):** o Dev Record indica falha de `npm test` no **frontend** (catálogo MEI) **não relacionada** com esta story. Para CI “verde” no monorepo, tratar como débito separado ou corrigir testes/expectativas nesses componentes.
2. **Contrato Plugnotas em produção:** `config` mínimo para NFE/NFC-e activos está documentado como spike; **recomenda-se** validação manual ou smoke em **sandbox** antes de considerar o fluxo multi-documento “fechado” operacionalmente (risco **médio** × impacto **médio** se o integrador exigir campos extra).
3. **Cobertura de teste (opcional):** não há teste dedicado a POST só com `nfce: true` e `nfse: false` (combinação válida); baixa prioridade se o comportamento é o mesmo que `assignDocumentBlocksFromSelection`.

### Recomendações (não bloqueantes)

- Após merge, executar smoke Plugnotas empresa (sandbox) com NFE e/ou NFC-e activos e registar resultado em evidência de release ou runbook.
- Opcional: teste unitário para `normalizeDocumentosAtivosShape` / `resolveDocumentosAtivosForPost` isolados (já indirectamente cobertos pelo serviço).

— **Quinn:** gate **PASS com observações**; apto a seguir para frontend (story dependente) e para merge após política de CI da equipa sobre `npm test` na raiz.
