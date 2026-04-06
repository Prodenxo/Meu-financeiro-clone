# Story — FR-GUIA-FISC (P2): Painel admin — paridade de seletor NF-e / NFC-e / NFS-e na emissão

**ID:** STORY-FR-GUIA-FISC-P2-ADMIN-PARIDADE  
**Prioridade:** P2  
**Depende de:** [story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) *(reutilizar padrões de payload e UX)*  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` (**FR-GUIA-FISC-10**)  
**Relacionado:** `docs/prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md` (modal emitir em nome de U)

## User story

**Como** administrador,  
**quero** no fluxo de emissão em nome do utilizador poder escolher **NFS-e**, **NF-e** ou **NFC-e** com o mesmo contrato de emissão que o Guia MEI,  
**para** suportar o utilizador sem fluxo paralelo opaco (**FR-GUIA-FISC-10**).

## Contexto técnico

- **API:** `POST /admin/users/:userId/mei-nfse/emitir` → `meiNotasService.emitirNota(userId, body)` — mesmo corpo que o utilizador autenticado (**CR** admin existente).  
- **UI:** `frontend/src/pages/AdminUserData.tsx`, `adminUserDataService.emitirNotaAsAdmin`.  
- **Partilha:** extrair componentes ou utilitários de validação/montagem de payload da story P0 quando possível (DRY).

## Critérios de aceite

- [ ] Modal (ou fluxo) de emissão admin inclui seletor de tipo **NFSE** / **NFE** / **NFCE** com *copy* que reforça emissão **em nome do utilizador** seleccionado.  
- [ ] Formulário contextual análogo ao Guia MEI (NFS-e existente + NFE/NFC-e mínimos).  
- [ ] Sem expor dados de outros utilizadores; mantém `ensureCanViewUser`.

## Tasks (implementação)

1. [x] Analisar estado actual do modal “Emitir NFSe” e renomear títulos se necessário (“Emitir nota fiscal”).  
2. [x] Reutilizar `emitirNotaAsAdmin` com `documentType` + `payload` para NFE/NFC-e.  
3. [x] Testes de serviço ou smoke manual documentado.

## Fora de escopo

- Novas rotas admin de catálogo além das já planeadas noutros PRDs.

## File list (checklist implementação)

- [x] `frontend/src/pages/AdminUserData.tsx`  
- [x] `frontend/src/services/adminUserDataService.ts` (sem alteração de código; contrato já `EmitirNotaInput`)  
- [x] Componentes partilhados em `frontend/src/components/` se extraídos (reutilizados `MeiFiscalEmissionTypeSegmented`, `MeiNfeLikeEmitForm`)

## Definition of Done

- Gates `AGENTS.md`.  
- QA com papel admin em *staging*.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação)

### Completion Notes List

- Modal admin: seletor NFS-e / NF-e / NFC-e (`MeiFiscalEmissionTypeSegmented`, `idPrefix` dedicado), copy explícita de emissão em nome do utilizador seleccionado.
- NF-e/NFC-e: `MeiNfeLikeEmitForm` + `validateMeiNfeLikeForm` + `buildNfeLikePayloadFromMeiForm`; `POST` via `emitirNotaAsAdmin` com `documentType` `NFE`/`NFCE` e `payload`.
- Transição NFS-e → NF-e/NFC-e: CNPJ emitente a partir do certificado do utilizador alvo (`meiCertificateStatus.documento`) e tomador copiado dos campos NFS-e; troca NF-e ↔ NFC-e mantém emitente/destinatário.
- Testes: `frontend/src/services/adminUserDataService.test.ts` (mock `apiClient.post`, casos NFSE / NFE / NFCE); `frontend/src/pages/AdminUserData.emit-modal.test.tsx` (RTL: botão emitir só com utilizador, modal com seletor e NFC-e + submit desactivado com formulário inválido).
- Gates: `npm run lint`, `npm run typecheck`, `npm test` (frontend).

### File List (final)

- `frontend/src/pages/AdminUserData.tsx`
- `frontend/src/services/adminUserDataService.test.ts`
- `frontend/src/pages/AdminUserData.emit-modal.test.tsx`

### Change Log

- 2026-04-06 — Paridade admin com Guia MEI: seletor + formulário NF-e/NFC-e e emissão com `documentType` + `payload`.
- 2026-04-06 — Mitigação QA: teste de serviço explícito para `NFCE`; testes RTL do modal admin (seletor, copy, NFC-e, botão Emitir desactivado).

---

## QA Results

**Revisor:** Quinn (QA) — revisão estática + rastreio a critérios (2026-04-06).  
**Evidência automatizada:** `frontend/src/services/adminUserDataService.test.ts`; backend `emitirNotaAsAdmin` mantém `ensureCanViewUser` antes de `meiNotasService.emitirNota` (`admin.controller.js`). Smoke em browser/staging **não** executado nesta sessão.

### Rastreio aos critérios de aceite

| Critério | Verificação | Notas |
|----------|-------------|--------|
| Seletor NFSE / NFE / NFCE + copy “em nome do utilizador” | **Coberto** | `MeiFiscalEmissionTypeSegmented` com `idPrefix="admin-user-emit-fiscal"`; texto explícito de emissão em nome do utilizador seleccionado no painel (não da sessão admin). |
| Formulário contextual análogo ao Guia MEI | **Coberto** | NFS-e: UI existente; NF-e/NFC-e: `MeiNfeLikeEmitForm` + `validateMeiNfeLikeForm` + `buildNfeLikePayloadFromMeiForm` (DRY com P0). |
| Sem expor outros utilizadores; `ensureCanViewUser` | **Coberto (backend)** | Rota `POST /users/:userId/mei-nfse/emitir` inalterada no contrato; controller chama `ensureCanViewUser` antes da emissão. UI continua dependente do utilizador seleccionado no painel. |

### Cobertura de testes

- **Presente:** teste de serviço com mock de `apiClient.post` para corpo **NFSE** e **NFE** + `payload`.
- **Lacuna (baixa prioridade):** não há caso explícito **NFCE** no teste de serviço (mesmo caminho que NFE, risco baixo).
- **Lacuna (média prioridade / DoD):** sem teste RTL do modal admin (seletor, troca de tipo, submit desactivado sem `userId`). Recomendado como follow-up ou smoke manual documentado.

### Riscos e observações

1. **Paridade com Guia MEI (FR-GUIA-FISC-07):** o Guia MEI pode bloquear emissão conforme capacidade Plugnotas; o fluxo admin **não** integra o mesmo hook de capacidade. Alinhado ao escopo P2 da story; aceitável, mas administradores podem ver erros apenas no retorno da API.
2. **Troca de tipo sem diálogo “formulário sujo”:** diferente do Guia MEI; aceitável para painel interno, documentar se houver reclamações de UX.
3. **Emitente NF-e sem certificado:** formulário pode ficar sem CNPJ pré-preenchido; validação cliente cobre.

### Decisão de gate

**CONCERNS (aprovável com condição)** — Implementação alinhada aos critérios e ao contexto técnico; testes unitários de serviço presentes; backend de autorização verificado. **Condição:** executar e registar **smoke manual em staging com papel admin**: abrir modal, alternar NFS-e ↔ NF-e ↔ NFC-e, submissão feliz mínima ou validação de erro esperado, confirmar lista actualizada.

**Sugestão pós-merge (dívida leve):** teste RTL focado no modal ou extensão do teste de serviço para `documentType: 'NFCE'`.

— Quinn, guardião da qualidade 🛡️
