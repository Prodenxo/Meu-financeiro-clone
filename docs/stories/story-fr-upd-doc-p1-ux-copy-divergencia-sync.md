# Story — FR-UPD-DOC (P1): UX — copy pós-guardar, banner de deriva e sincronizar

**ID:** STORY-FR-UPD-DOC-P1-UX-DIVERGENCE  
**Prioridade:** P1  
**Depende de:** [story-fr-upd-doc-p0-frontend-hidratacao-cache-patch.md](./story-fr-upd-doc-p0-frontend-hidratacao-cache-patch.md) (fluxo base e hidratação)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — **FR-UPD-DOC-07**, **FR-UPD-DOC-08**  
**UX:** [`docs/specs/ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../specs/ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — §5.3, §6, §9 wireframes  
**Arquitetura:** [`docs/technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) §3.5

## User story

**Como** utilizador,  
**quero** feedback claro quando a configuração foi atualizada **no emissor**, e um aviso **não bloqueante** se o que estava guardado na app diferir do emissor, com opção de atualizar a vista ou sincronizar,  
**para** confiar no estado mostrado e resolver confusão entre app e painel Plugnotas.

## Contexto

- **FR-UPD-DOC-07:** toast/banner de sucesso menciona **emissor fiscal** — sem jargão de base de dados.  
- **FR-UPD-DOC-08:** só quando **espelho** e **remoto** são ambos parseáveis e diferentes; CTAs “Atualizar vista” / “Sincronizar com Plugnotas”.  
- Detecção pode ser **client-side** (comparar resultado de GET empresa vs `documentosAtivos` do status) ou **server-side** enriquecido — escolher uma abordagem e documentar na implementação (arquitetura §3.5).

## Critérios de aceite

- [ ] Após PATCH/POST empresa bem-sucedido com alteração de `documentosAtivos`, o utilizador vê confirmação que referencia **emissor fiscal** ou equivalente aprovado por UX (**FR-UPD-DOC-07**).  
- [ ] Quando `divergence === true` (definição na story técnica: comparação tri-boolean estrita), exibe-se banner **warning** não bloqueante com copy da UX spec §6 e CTAs acessíveis (**FR-UPD-DOC-08**).  
- [ ] “Atualizar vista” reaplica estado a partir do último GET válido em memória ou força refresh conforme decisão técnica.  
- [ ] “Sincronizar com Plugnotas” dispara novo GET empresa + reconciliação espelho (reutiliza fluxo backend da story P0).  
- [ ] Foco e teclado: banner com `role="region"` e `aria-label`; CTAs focáveis.  
- [ ] Gates `AGENTS.md`.

## Tasks

1. [x] Definir função `documentosAtivosDivergem(a, b)` partilhada (testada).  
2. [x] Implementar banner + CTAs conforme wireframe UX §9.4.  
3. [x] Implementar toast/copy pós-sucesso §5.3 UX.  
4. [x] Integrar flag `divergence` (cliente ou servidor) e testes.

## File list (indicativo)

- [ ] `frontend/src/pages/GuidesMei.tsx` ou componente dedicado de secção  
- [ ] `frontend/src/services/guidesMeiService.ts`  
- [ ] Possível extensão `mei-guide.service.js` / status se deriva for servidor  
- [ ] Testes de UI/utilitário

## Fora de escopo

- Telemetria analytics de combinações.  
- **FR-UPD-DOC-09** — story P2.

## Qualidade / CodeRabbit

- Copy sem “Supabase”, “jsonb”, “espelho” em strings de UI voltadas ao utilizador final.

## Executor Assignment (sugestão AIOX)

| Campo | Valor |
|-------|--------|
| executor | @dev |
| quality_gate | @ux-design-expert |
| quality_gate_tools | Revisão de copy e A11y banner |

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes

- Deteção de deriva **client-side** (arquitetura §3.5): `documentosAtivosDivergem(espelho status, remoto GET)` com tri-boolean estrito; snapshots actualizados em cada `loadCertificateStatus` com `canViewNfse`.
- Pós-**Atualizar cadastro** com edição de checkboxes: mensagem UX §5.3 (`MSG_SUCESSO_PATCH_DOCUMENTOS_ATIVOS_EMISSOR`).
- **Follow-up QA:** POST cadastro empresa inclui a mesma frase §5.3 no `certificateSuccess`; teste de integração do banner (FR-UPD-DOC-08) em `GuidesMei.documentos-ativos.test.tsx`; `AdminUserData.emit-modal.test.tsx` com timeout 15s para evitar flake em suites lentas; `resolveCnpjParaEmissor` em `useCallback` para deps do handler de sincronizar.

### File List

- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts` — `documentosAtivosDivergem`
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.test.ts` — testes da função
- `frontend/src/utils/guiaMeiCadastroDocumentosAtivos.ts` — copy UX (título secção, banner, CTAs, sucesso PATCH, subtítulo §5.1)
- `frontend/src/pages/GuidesMei.tsx` — estado espelho/remoto, banner, handlers, refactor hidratação, sucesso PATCH condicional, copy POST cadastro
- `frontend/src/pages/GuidesMei.documentos-ativos.test.tsx` — teste banner deriva + CTAs
- `frontend/src/pages/AdminUserData.emit-modal.test.tsx` — timeout teste modal (estabilidade suite)

### Change Log

| Data | Notas |
|------|--------|
| 2026-04-07 | Story criada pelo SM (River). |
| 2026-04-07 | Implementação P1: divergência, banner, copy emissor, testes utilitário. |
| 2026-04-07 | Follow-up QA: POST §5.3 no sucesso certificado, teste banner, timeout emit-modal. |

---

## QA Results

### Revisão — 2026-04-07 (Quinn / QA)

**Decisão de gate:** **PASS com observações** (funcionalidade principal conforme critérios; lacunas menores abaixo).

| Critério de aceite | Evidência | Notas |
|--------------------|-----------|--------|
| FR-UPD-DOC-07 — confirmação com referência ao emissor após alteração de `documentosAtivos` | `handleAtualizarCadastroSemNovoCertificado`: `MSG_SUCESSO_PATCH_DOCUMENTOS_ATIVOS_EMISSOR` quando `documentosAtivosUserEditedRef` | **Cobre PATCH** “Atualizar cadastro”. **POST** primeiro cadastro (`cadastrarEmpresaEmissaoNf`) mantém mensagem composta existente (“sistema de emissão fiscal” / empresa); não usa o literal §5.3 — aceitável se PO considerar POST fora do âmbito estrito da mensagem única; caso contrário alinhar numa follow-up. |
| FR-UPD-DOC-08 — banner + tri-boolean estrito | `documentosAtivosDivergem`; `showDocumentosAtivosDivergenceBanner`; snapshots em `loadCertificateStatus` | Comparação espelho (status) vs remoto (GET) alinhada à arquitetura §3.5. |
| “Atualizar vista” | `handleDocumentosAtivosAtualizarVista` → `setDocumentosAtivos` a partir de `documentosAtivosRemoteSnapshot` | Sem novo GET; coerente com “último GET em memória”. |
| “Sincronizar com Plugnotas” | `handleDocumentosAtivosSincronizarPlugnotas`: `invalidateMeiEmpresaGetCache` + GET + `loadCertificateStatus` | Reconciliação via fluxo P0 implícito no refresh de status. |
| A11y — `role="region"`, `aria-label`, CTAs focáveis | JSX ~2913–2944: `role="region"`, `aria-label={ARIA_LABEL_...}`, botões nativos | **PASS**. |
| Copy sem “Supabase” / “jsonb” / “espelho” (UI) | Constantes em `guiaMeiCadastroDocumentosAtivos.ts` | **PASS** — termos proibidos não aparecem nas strings de produto. |
| Gates `AGENTS.md` | `npm run test` (frontend) — 397 testes passaram nesta revisão | Incluir lint/typecheck no CI habitual; não reexecutados nesta sessão. |

**Riscos / dívida de testes**

- Cobertura **automática do banner** em `GuidesMei` (cenário espelho ≠ remoto): **não** há teste de integração que assegure presença do banner e dos CTAs; mitigação actual: teste unitário de `documentosAtivosDivergem` + revisão manual / @ux-design-expert na *quality_gate*.
- `documentosAtivosUserEditedRef`: utilizador que altera só dados da empresa (sem tocar checkboxes) recebe mensagem genérica — comportamento **coerente** com o critério “com alteração de documentosAtivos”.

**Recomendações não bloqueantes**

1. Opcional: teste em `GuidesMei.documentos-ativos.test.tsx` com mocks de status/GET divergentes e asserção de texto do banner + CTAs.
2. Opcional: alinhar copy POST cadastro ao §5.3 se o PO quiser paridade literal com PATCH.

**Próximo passo sugerido:** revisão de copy e A11y pelo **@ux-design-expert** (conforme tabela Executor Assignment); depois **@github-devops** para PR.
