# Story — FR-P-03 / FR-P-04: Dados mínimos NFS-e em `user_mei_certificates`

**ID:** STORY-FR-P-03-04  
**Prioridade (PRD):** Should  
**Fonte:** `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md`, PRD §5.2  
**Relacionado:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`  
**Correção ops/DB (schema remoto):** `docs/stories/story-prd-correcao-supabase-schema-tipo-logradouro.md` — migrações `user_mei_certificates` + `tipo_logradouro` por ambiente Supabase.

## User stories

**FR-P-03 — Como** MEI configurando emissão NFS-e,  
**quero** que razão social, endereço, regime, IM, IBGE, etc., fiquem guardados no Supabase alinhados ao formulário,  
**para** reabrir a app e ver os mesmos dados sem reintroduzi-los manualmente sempre.

**FR-P-04 — Como** MEI com certificado já enviado,  
**quero** atualizar só dados fiscais/endereço sem enviar novo ficheiro `.pfx`,  
**para** corrigir cadastro no emissor/localmente sem fricção desnecessária.

## Contexto técnico

- **Migração:** `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql` (aplicar em ambientes antes da release de código).
- **Backend:** `backend/src/services/mei-certificate-store.js` — estender `saveCertificate` com merge cuidadoso **ou** `patchEmitenteNfse(userId, partial)`; expandir `loadCertificate` / getter dedicado; normalização: CNPJ/CEP dígitos, `uf` 2 letras maiúsculas.
- **Rotas:** `mei-guide.routes.js` + serviço `mei-guide.service.js` — upload com payload NFS-e; opcional `PATCH` só dados fiscais; `getCertificateStatus` devolve campos para pré-preencher.
- **Fluxo Plugnotas (opcional nesta story ou follow-up):** após sucesso `cadastrarEmpresa` / `atualizarEmpresa`, espelhar payload em Supabase — **decisão de produto:** registar em comentário/ADR se fonte de verdade é (A) espelho pós-Plugnotas ou (B) Supabase primeiro.
- **Frontend:** `GuidesMei.tsx` / serviços `guidesMeiService` / `meiNotasService` — contrato alinhado; unificar «Rua» e «Logradouro» → coluna `logradouro`.
- **Segurança:** RLS em `user_mei_certificates` — utilizador só acede à própria linha; senha do certificado continua encriptada (AES-GCM existente).

## Critérios de aceite

- [ ] Migração aplicada; colunas e `COMMENT ON COLUMN` presentes (já no script).
- [ ] Persistência dos campos da tabela de mapeamento do brief (secção 1) no fluxo acordado (upload com NFS-e e/ou patch dedicado).
- [ ] Leitura devolve campos para a UI pré-preencher.
- [ ] Fluxo «atualizar sem novo certificado» **não** remove nem exige `pfx_base64` / passphrases existentes.
- [ ] Regressão: fluxos MEI/NFSe existentes (`docs/operacao-mei-nfse.md`) sem quebra; testes backend estendidos onde aplicável.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` (backend/frontend conforme alterações).

## Fora de escopo

- Mudança da política fiscal Plugnotas (ADRs existentes); novo motor de emissão.

## Definition of Done

- Checklist + revisão RLS; tipos Supabase regenerados se o projeto usar `supabase gen types`.

## Qualidade / CodeRabbit

- Cuidado com `upsert` que zere colunas com `null`; testes de update parcial.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor dev (implementação)

### Completion Notes List

- Persistência dos campos NFS-e em `user_mei_certificates`: `saveCertificate` aceita `emitente`; `patchEmitenteNfseFields` para updates parciais; `getEmitenteNfseSnapshot` + `nfseEmitente` em `GET /mei-guide/certificate/status`.
- Nova rota `PATCH /mei-guide/certificate/emitente-nfse` (JSON) para FR-P-04.
- Frontend: `uploadMeiCertificate` envia FormData com campos do formulário quando NFS-e visível; após «Atualizar cadastro sem novo certificado» chama PATCH; hidratação única do formulário a partir de `nfseEmitente` ao carregar status; reset ao remover certificado.
- **Fonte de verdade (produto):** dados fiscais são gravados na app quando o utilizador envia o certificado (com emitente) ou faz PATCH; espelho opcional pós-Plugnotas não foi exigido nesta entrega.
- **Correções pós-QA:** coluna `tipo_logradouro` + migração; mensagem explícita se Plugnotas OK e PATCH local falhar; sincronização do formulário a partir de `nfseEmitente` na resposta do upload e do PATCH; teste de rota `PATCH .../emitente-nfse` (middlewares + handler).

### File List

- `backend/src/services/mei-certificate-store.js`
- `backend/src/services/mei-guide.service.js`
- `backend/src/controllers/mei-guide.controller.js`
- `backend/src/routes/mei-guide.routes.js`
- `backend/tests/mei-certificate-emitente.test.js`
- `backend/tests/mei-guide-routes-emitente.test.js`
- `supabase/migrations/20260326150000_add_tipo_logradouro_user_mei_certificates.sql`
- `frontend/src/services/guidesMeiService.ts`
- `frontend/src/pages/GuidesMei.tsx`

### Change Log

- 2026-03-26 — Story STORY-FR-P-03-04: persistência emitente NFS-e + API + UI Guia MEI.
- 2026-03-26 — Ajustes QA: `tipo_logradouro`, UX erro PATCH, sync formulário pós-resposta, teste de rota emitente-nfse.

---

## QA Results

**Revisor:** Quinn (QA) — revisão estática + rastreio aos critérios de aceite (2026-03-26).

### Gate

**CONCERNS** — Implementação alinhada aos FR-P-03/FR-P-04 e pronta para merge operacional, com itens de seguimento abaixo (não bloqueiam se migração + RLS estiverem validados no ambiente alvo).

### Rastreio aos critérios de aceite

| Critério | Evidência |
|----------|-----------|
| Migração SQL | `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql` presente com `COMMENT ON COLUMN`. **Aplicação em cada ambiente** é pré-requisito operacional (não verificável só pelo repo). |
| Persistência (upload + patch) | `saveCertificate` + `emitente`; `patchEmitenteNfseFields` só UPDATE; `parseEmitenteFromPayload` no upload multipart. |
| Leitura para UI | `getEmitenteNfseSnapshot` → `nfseEmitente` em `getCertificateStatus`; frontend hidrata em `GuidesMei` com ref de primeira carga. |
| FR-P-04 sem tocar no `.pfx` | PATCH atualiza apenas fragmento normalizado; não passa por `delete`/upsert de `pfx_base64`. |
| Regressão / testes | `backend/tests/mei-certificate-emitente.test.js` cobre normalização; **sem** teste HTTP de integração dedicado à rota nova. |
| Gates | Evidência em sessão dev: `lint:backend`, `test` backend, `typecheck` frontend passaram. |

### NFRs (amostra)

- **Segurança:** Rotas com `requireAuth` + `requireMeiEnabled`; persistência via service role no backend (padrão existente). **RLS** na tabela deve ser revista manualmente no Supabase (não há alteração de política nesta story).
- **Risco de dados:** `upsert` do certificado inclui `emitente` quando enviado; updates parciais usam `omitEmpty: true` — alinhado ao aviso da story sobre não anular colunas com `null` inadvertidamente.

### Riscos / limitações identificadas

1. **`tipoLogradouro`:** Persistência só na coluna `logradouro`; na leitura API devolve `tipoLogradouro: 'Rua'` fixo — utilizador que escolheu outro tipo (ex.: Av.) perde a distinção na recarga (aceitável se documentado; já referido no Dev Agent Record).
2. **Hidratação única (`nfseEmitenteHydratedRef`):** Após a primeira carga, alterações no servidor não refletem no formulário na mesma sessão sem refresh completo ou reset do ref — baixo risco, mas e2e deveria cobrir.
3. **`MEI_CERT_ENCRYPTION_KEY` ausente:** Upload não persiste em `user_mei_certificates` (comportamento pré-existente); emitente também não grava — esperado em dev sem chave.
4. **Fluxo «Atualizar cadastro»:** Plugnotas é chamado antes do PATCH local; falha do PATCH após sucesso Plugnotas cai no `catch` genérico — utilizador pode ver mensagem pouco específica (melhoria de UX, não bloqueio funcional).

### Testes recomendados (não executados nesta revisão)

- **Manual:** `POST /mei-guide/certificate` com multipart + campos emitente; `GET /mei-guide/certificate/status` com `nfseEmitente`; `PATCH /mei-guide/certificate/emitente-nfse` sem ficheiro; remover certificado e confirmar reset do formulário.
- **Opcional:** `supabase gen types` após migração aplicada (DoD).

### Recomendações

- Curto prazo: validar RLS em `user_mei_certificates` após novas colunas (checklist DoD).
- Médio prazo: teste de integração (supertest) para `PATCH .../emitente-nfse` com Supabase mockado ou ambiente de teste.

— Quinn, guardião da qualidade 🛡️
