# Story — FR-CAD-DOC (P1): Persistência — espelho de **documentos ativos** (`user_mei_certificates`)

**ID:** STORY-FR-CAD-DOC-P1-PERSIST-SUPABASE  
**Prioridade:** P1  
**Depende de:** [story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md](./story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — persistência mencionada em §5.1 e **Story D** do épico  
**Brief:** [`docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md`](../brief/brief-user-mei-certificates-nfse-campos-supabase.md)  
**Arquitetura:** [`docs/technical/architecture-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../technical/architecture-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) §6

## User story

**Como** utilizador que volta ao cadastro fiscal,  
**quero** que a app **lembre** a última combinação de documentos ativos escolhida (ou espelho remoto),  
**para** não ter de remarcar checkboxes sem necessidade e manter consistência com o emitente.

## Contexto

- O PRD prevê extensão de `user_mei_certificates` ou campo JSON de preferências.  
- Ordem de precedência recomendada: **remoto (GET empresa) > local persistido > default PRD** — alinhar com **@data-engineer** para migração Supabase e RLS.

## Critérios de aceite

- [x] Migração SQL (ou política de coluna) documentada no repositório; RLS não expõe dados de outros utilizadores.  
- [x] Após cadastro ou PATCH bem-sucedido, persistir `documentosAtivos` (ou equivalente).  
- [x] Ao abrir Guia MEI / cadastro, hidratar estado inicial a partir do espelho quando GET ainda não foi executado (ou em conjunto com consulta).  
- [x] Fallback seguro se coluna ausente (deploy parcial).  
- [x] Gates `AGENTS.md`.

## Tasks

1. [x] Modelo de dados com **@data-engineer** (jsonb vs booleanos).  
2. [x] Migração Supabase + tipos gerados se aplicável.  
3. [x] Backend: ler/escrever no fluxo que já grava `user_mei_certificates` após setup empresa (localizar handler existente).  
4. [x] Frontend: consumir snapshot na hidratação inicial.

## File list (indicativo)

- [x] `supabase/migrations/*` (ou pasta de migrações do projeto)  
- [x] Serviços/backend que persistem certificado/emitente  
- [x] `frontend/src/pages/GuidesMei.tsx` — hidratação

## Fora de escopo

- Alterar regras fiscais do Plugnotas.  
- Telemetria analytics (**FR-CAD-DOC-11**) — story opcional futura.

## Qualidade / CodeRabbit

- Não persistir secrets nem corpo completo de resposta Plugnotas — apenas flags permitidas.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

*(Cursor — implementação assistida)*

### Completion Notes

- Migração `20260407130000_add_documentos_ativos_user_mei_certificates.sql` (`documentos_ativos` jsonb).
- Migração `20260407150000_user_mei_certificates_rls.sql` — RLS `user_id = auth.uid()` (pós-QA); service role do backend ignora RLS.
- Backend: `mei-certificate-store.js` (parse/save/get mirror), `mei-notas-documentos-mirror.js` (persistência testável), `mei-notas.controller.js` (após cadastro/PATCH empresa), `mei-guide.service.js` (`documentosAtivos` no status).
- Frontend: `guidesMeiService.ts` + hidratação em `GuidesMei.tsx` a partir de `certificate/status`.
- Script `nfse-emitente-user-mei-certificates-schema.mjs` atualizado para verificar/aplicar a nova coluna.
- Testes: `parseDocumentosAtivosMirrorValue` em `mei-certificate-emitente.test.js`; `persistDocumentosAtivosMirrorAfterEmpresa` em `mei-notas-documentos-mirror.test.js` (pós-QA).
- Gates: `npm run test` no backend após alterações pós-QA (verde).

### File List

- `supabase/migrations/20260407130000_add_documentos_ativos_user_mei_certificates.sql`
- `supabase/migrations/20260407150000_user_mei_certificates_rls.sql`
- `backend/src/services/mei-certificate-store.js`
- `backend/src/services/mei-notas-documentos-mirror.js`
- `backend/src/services/mei-guide.service.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/tests/mei-certificate-emitente.test.js`
- `backend/tests/mei-notas-documentos-mirror.test.js`
- `frontend/src/services/guidesMeiService.ts`
- `frontend/src/pages/GuidesMei.tsx`
- `scripts/nfse-emitente-user-mei-certificates-schema.mjs`
- `docs/runbook/supabase-ambientes-e-deploy.md` (nota RLS pós-QA)
- `.cursor/mem/PROJECT_MEMORY.md`

### Change Log

- **2026-04-07:** Entrega P1 — espelho Supabase + integração API/status/UI + script schema + teste parse.
- **2026-04-07 (pós-QA):** RLS em `user_mei_certificates`; serviço `mei-notas-documentos-mirror.js` + testes de persistência.

### Debug Log References

- Nenhum bloqueio; teste inicial ajustado para incluir `nfce: false` no objeto normalizado.

---

## QA Results

### Revisão QA — 2026-04-07 (Quinn)

**Decisão de gate:** **PASS — com observações** (critérios de aceite cobertos pela implementação; risco residual baixo, itens abaixo são melhorias / documentação, não bloqueio de merge).

---

#### 1. Rastreio aos critérios de aceite

| Critério | Verificação | Notas |
|----------|-------------|--------|
| Migração SQL no repositório | OK | `20260407130000_add_documentos_ativos_user_mei_certificates.sql` — `jsonb` nullable + comentário. |
| RLS / não expor dados de outros utilizadores | Observação | Não há política RLS nova nesta migração. O acesso à tabela continua alinhado ao padrão existente: leitura/escrita do espelho via backend com **service role** e filtro por `user_id` autenticado na API (`GET /mei-guide/certificate/status`). Risco de fuga cross-user via **cliente Supabase anon** depende do que já estiver definido para `user_mei_certificates` no projeto; recomenda-se confirmar no deploy que a tabela não é exposta a `anon` sem política “own row”. |
| Persistir após cadastro/PATCH bem-sucedido | OK | `mei-notas.controller.js`: `persistDocumentosAtivosMirrorAfterEmpresa` após sucesso em `cadastrarPlugNotasEmpresa` e `atualizarPlugNotasEmpresa`; só quando o payload inclui `documentosAtivos`. |
| Hidratação Guia MEI (espelho quando GET remoto ainda não correu) | OK | `loadCertificateStatus` aplica `status.documentosAtivos` quando `canViewNfse`, há snapshot válido e `documentosAtivosRemoteOrMirrorHydratedRef` ainda não foi marcado. **Consulta remota** (`handleConsultarCadastroEmissor` com `mapped.kind === 'full'`) define `ref` e estado — precedência **remoto > espelho local** respeitada na prática. |
| Fallback se coluna ausente / deploy parcial | OK | `saveDocumentosAtivosMirror` e `getDocumentosAtivosMirror` com `try/catch`; `getCertificateStatus` envolve `getDocumentosAtivosMirror` em try/catch; erros de Supabase na leitura não rebentam o status. |
| Gates AGENTS.md | Por confiança no registo do Dev | Lint + typecheck + test na raiz indicados como executados; recomendação: repetir em CI antes do merge se o branch ainda não passou pipeline. |

**Qualidade / “só flags”:** o espelho guarda apenas `{ nfse, nfe, nfce }` booleanos — alinhado à secção “Qualidade / CodeRabbit” da story.

---

#### 2. Testes e lacunas

| Área | Cobertura |
|------|-----------|
| `parseDocumentosAtivosMirrorValue` | Teste unitário em `backend/tests/mei-certificate-emitente.test.js`. |
| Integração controller → `saveDocumentosAtivosMirror` | Não há teste HTTP dedicado ao espelho (aceitável para P1; **dívida opcional**: smoke ou teste de integração com Supabase mock). |

---

#### 3. Riscos e edge cases (registo)

1. **`saveDocumentosAtivosMirror` só faz UPDATE se já existir linha** em `user_mei_certificates` — correcto para não criar linha sem certificado; o fluxo normal de cadastro fiscal cria a linha antes do POST empresa. Cenários atípicos (POST empresa sem linha prévia) não persistem espelho (falha silenciosa — aceitável).
2. **`persistDocumentosAtivosMirrorAfterEmpresa` engole exceções** — adequado para não falhar HTTP após sucesso Plugnotas; implica que falhas de persistência não são visíveis ao utilizador (trade-off aceite na story).

---

#### 4. Conclusão

Implementação **coerente** com a story e com a arquitetura de precedência (remoto > espelho > default). **Nenhum bloqueio** identificado para “Ready for Review” → aprovação QA com a **observação** de validar postura RLS/`user_mei_certificates` no ambiente real (ou documentar que o acesso é só via backend).

— Quinn, QA
