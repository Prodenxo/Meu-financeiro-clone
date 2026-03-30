# Story — CAT-MEI-01: Spike — persistência do catálogo NFS-e e contrato REST de escrita

**ID:** STORY-CAT-MEI-01  
**Prioridade:** P0 (bloqueante)  
**Tipo:** Spike / investigação técnica (sem entrega de UI final)  
**Depende de:** —  
**Fonte:** `docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md` §11, §14 (história 1.1)  
**Especificação UX:** `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` §7 (campos UX de referência)

## User story

**Como** equipa de produto e engenharia,  
**quero** documentar **onde** o catálogo de clientes e de serviços/produtos persiste e **que** operações de escrita o backend pode expor com segurança,  
**para** desbloquear implementação sem retrabalho ou bloqueio a meio do épico.

## Contexto técnico

- Hoje existem apenas `GET /mei-notas/catalogo/clientes` e `GET /mei-notas/catalogo/produtos` (`backend/src/routes/mei-notas.routes.js`).
- O PRD assume **uma fonte de verdade** espelhada nos GETs atuais; o spike deve **confirmar** (Supabase, provedor Plugnotas/outro, ou híbrido).
- Saída obrigatória: documento versionado em `docs/` (ADR curto, apêndice técnico ou secção no PRD — **um** artefato canónico referenciado pelas stories seguintes).

## Critérios de aceite

- [x] Está documentada a **origem da persistência** do catálogo (leitura e escrita) e o fluxo de dados até ao utilizador.
- [x] Está definido (ou explicitamente marcado como “não suportado”) o suporte a **POST/PATCH** (e DELETE se aplicável) para **clientes** e **produtos/serviços**, com **caminhos REST propostos** e corpo de pedido/resposta de exemplo **ou** referência ao código do integrador.
- [x] Lista-se **matriz mínima** de campos obrigatórios/opcionais alinhada ao que a emissão NFS-e exige (ligação ao risco “município” do PRD §13).
- [x] Registo de **go/no-go**: se o provedor não suportar CRUD, o documento descreve **alternativa** (ex.: persistência apenas local + sync) ou **escopo reduzido** acordado.
- [x] As stories **CAT-MEI-02** a **CAT-MEI-05** podem referenciar este artefato como contrato sem ambiguidade.

## Fora de escopo

- Implementação de rotas ou páginas (fica para CAT-MEI-02+).  
- Alteração de contratos GET existentes salvo conclusão do spike o exigir (nesse caso documentar migração).

## File list (checklist implementação)

- [x] `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` — artefato canónico do spike
- [x] Referência cruzada em `docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md` (§11.1 + changelog + risco §13)

## Definition of Done

- Revisão por par (dev + referência técnica MEI/NFS-e se existir na equipa) **ou** revisão QA documentada (secção **QA Results** abaixo).  
- Stories **CAT-MEI-02** a **CAT-MEI-05** com ligação explícita ao artefato canónico `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` (caminhos/payloads alinhados ao doc; sem contradição).

## Qualidade / CodeRabbit

- O spike não introduz secrets nem dados reais de clientes; exemplos anonimizados.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Spike concluído: catálogo persiste em **Supabase** (`mei_nfse_clientes`, `mei_nfse_produtos`); leitura via `listarCatalogo*`; escrita atual só por **upsert** pós-`emitirNota` (`upsertClienteCatalogo` / `upsertProdutosCatalogo`). **Go** para `POST`/`PATCH` na API Node com service role, sem CRUD de catálogo na Plugnotas.
- Contrato proposto, `dedupe_key`, matriz de campos e exemplos JSON em `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`.
- PRD atualizado (v1.1): §11.1, risco §13, changelog.
- **CAT-MEI-02:** implementar conforme doc técnico; atualizar story 02 apenas se o contrato real divergir (nova versão do doc).
- **Pós-QA (dev):** stories **CAT-MEI-03, 04 e 05** passam a referenciar o artefato canónico no contexto; critérios de aceite desta story marcados `[x]`; **CAT-MEI-02** reforçada com regra **PATCH cliente sem alterar `documento`** (doc §7.2).
- **Revisão por par (DoD):** cumprida via **QA Results** (Quinn, 2026-03-30, gate PASS com ressalvas tratadas).

### File List (implementação)

- `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` (novo)
- `docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md` (§11.1, §13, §16, nota rodapé)
- `docs/stories/story-cat-mei-03-frontend-pagina-clientes-catalogo.md` (ligação ao doc técnico)
- `docs/stories/story-cat-mei-04-frontend-pagina-servicos-produtos-catalogo.md` (ligação ao doc técnico)
- `docs/stories/story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md` (ligação ao doc técnico)
- `docs/stories/story-cat-mei-02-backend-post-patch-catalogo.md` (nota PATCH `documento` imutável)

### Debug Log References

- Análise estática: `backend/src/services/mei-notas.service.js`, `backend/src/routes/mei-notas.routes.js`, migrações `20260312103000_*`, `20260312114000_*`.

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da spec UX. |
| 2026-03-30 | Spike implementado: doc técnico + atualização PRD; status Ready for Review. |
| 2026-03-30 | Pós-QA dev: rastreio CAT-MEI-03–05, aceite `[x]`, DoD revisão por par via QA, reforço CAT-MEI-02 PATCH. |

---

## QA Results

**Revisão:** Quinn (QA) — 2026-03-30  
**Tipo de entrega:** Documentação / spike (sem código de produto)

### Decisão de gate

**PASS com ressalvas (CONCERNS)**

### Rastreio aos critérios de aceite

| Critério | Evidência | Resultado |
|----------|-----------|-----------|
| Origem da persistência e fluxo até ao utilizador | `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` §§2–4; alinhado a `mei-notas.service.js` (`listarCatalogo*`, `getDb` + service role) | **OK** |
| POST/PATCH/DELETE definidos ou marcados | §1 e §7 (proposta REST + exemplos JSON); DELETE MVP excluído; técnica de DELETE/RLS documentada | **OK** |
| Matriz mínima de campos + risco município | §6 + parágrafo sobre prefeitura/provedor | **OK** |
| Go/no-go e alternativa | §1 — **Go** com persistência local Supabase; não depende de CRUD Plugnotas para catálogo | **OK** |
| Stories seguintes sem ambiguidade | **CAT-MEI-02** referencia o doc técnico no contexto. **CAT-MEI-03, 04, 05** ainda **não** citam o artefato canónico (rastreio fraco até implementação). | **CONCERNS** |

### Definition of Done (story)

- **Revisão por par:** não há registo explícito (comentário em PR, aprovação, ou segunda assinatura). Recomendação: confirmar verbalmente ou documentar na PR antes de merge.
- **CAT-MEI-02:** ligação ao spike presente — **OK**.

### NFR / qualidade documental

- Sem secrets nem PII em exemplos — **OK**.
- Referências a ficheiros e migrações verificáveis — **OK**.
- Prefixo `/api/mei-notas` coerente com `backend/src/routes/index.js` — **OK**.

### Ações recomendadas (não bloqueantes)

1. Opcional: adicionar em **CAT-MEI-03, 04 e 05** uma linha “Contrato canónico: `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`” (SM/dev).
2. Opcional: marcar os checkboxes dos **critérios de aceite** no corpo desta story como concluídos após aceitação formal (PO/SM), para consistência com o estado real.
3. Na implementação **CAT-MEI-02**, validar no código se `PATCH` de `documento` fica **imutável** como recomendado no doc §7.2.

### Resumo

O spike cumpre o objetivo: **uma** fonte canónica em `docs/technical/`, PRD v1.1 atualizado, conclusão **go** fundamentada no repositório. **Aprovar para avançar CAT-MEI-02**, com ressalvas de rastreio nas stories 03–05 e evidência de revisão por par.
