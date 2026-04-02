# Story — FR-UX-MEI (P2): Mei Infinito — Memorizar última área do fluxo

**ID:** STORY-FR-UX-MEI-P2  
**Prioridade:** P2 (Could — PRD onda 3)  
**Depende de:** [story-fr-ux-mei-p0-visao-geral-kpis-tabs.md](./story-fr-ux-mei-p0-visao-geral-kpis-tabs.md) (e idealmente P1 se IDs de tab mudarem)  
**Fonte:** `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` (FR-UX-MEI-07)  
**Especificação UX:** `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` §11

## User story

**Como** utilizador recorrente em Mei Infinito,  
**quero** que a aplicação relembre a última secção do fluxo que estava a usar (dentro do dispositivo),  
**para** retomar o trabalho com menos cliques quando volto à página.

## Contexto técnico

- **Chave sugerida:** `mei-workspace-last`  
- **Valores:** `overview` | `das` | `nfse` | `parcelamentos` (alinhados ao tipo `GuidesMeiWorkspace`).  
- **Leitura:** no *mount* de `GuidesMei` (ou efeito equivalente), após validar permissões.  
- **Escrita:** quando `setActiveWorkspace` for chamado com sucesso.  
- **Fallback (spec §11):** `overview` se valor inválido; se `canViewNfse === false` e valor guardado for `nfse`, usar `overview` ou `das` conforme produto (default: `overview`).  
- **Privacidade:** apenas preferência de UI — sem PII.

## Critérios de aceite

- [x] Ao sair de `/guias-mei` e voltar (ou recarregar a página), o *workspace* ativo restaura o último guardado, salvo fallbacks acima.  
- [x] Primeira visita (sem chave): comportamento atual (`overview` ou o default existente).  
- [x] Limpar ou corromper `localStorage` manualmente não quebra a página (fallback seguro).  
- [x] Não gravar quando o utilizador não tem acesso à rota MEI (respeitar *gate* existente).

## Fora de escopo

- Sincronização entre dispositivos ou conta.  
- Preferências no servidor.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] (Opcional) teste unitário leve — `guidesMeiWorkspaceStorage.test.ts` + integração em `GuidesMei.permissions.test.tsx` (pós-QA).

## Definition of Done

- QA: alternar tabs, refrescar, confirmar restauração; testar utilizador sem NFS-e e último tab `nfse`.  
- `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Qualidade / CodeRabbit

- Chave versionada ou prefixada ao nome da app se o projeto já tiver convenção (`meu-financeiro:mei-workspace-last`) para evitar colisão com outras apps em `localhost`.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Chave `meu-financeiro:mei-workspace-last`; leitura com `parseStoredWorkspace` + `readWorkspaceFromStorage` (try/catch, `localStorage` opcional); estado inicial `resolveInitialWorkspace(stored, canViewNfse)` — `nfse` sem permissão → `overview`.
- Persistência em `useEffect` ao mudar `activeWorkspace` com try/catch em `setItem`.
- `GuidesMei` só monta com `canAccessMeiArea` em `App.tsx` e após `sessionRestored`; leitura alinha-se a `canViewNfse` no primeiro render da página.
- **Pós-QA:** lógica extraída para `guidesMeiWorkspaceStorage.ts` (funções puras testáveis); testes unitários + integração em permissões cobrem parse, leitura, fallback `nfse`, restauração e persistência ao clicar no tab DAS.

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/guidesMeiWorkspaceStorage.ts`
- `frontend/src/pages/guidesMeiWorkspaceStorage.test.ts`
- `frontend/src/pages/GuidesMei.permissions.test.tsx` (bloco P2)

### Debug Log References

- `npm run lint` (frontend) — OK (apenas *warnings* pré-existentes no projeto).
- `npm run typecheck` (frontend) — OK.
- `npx vitest run --environment jsdom src/pages/guidesMeiWorkspaceStorage.test.ts src/pages/GuidesMei.permissions.test.tsx` — **18/18** (2026-03-30, pós-QA).
- `npm test` (frontend, Vitest jsdom) — **154** testes passaram (2026-03-30, pós-QA).

### Change Log

- **2026-03-30** — P2 FR-UX-MEI-07: persistência do último *workspace* Mei Infinito em `localStorage` com fallbacks seguros.
- **2026-03-30** — Pós-QA: módulo `guidesMeiWorkspaceStorage.ts` + testes (observação QA sobre cobertura automatizada).

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-03-30  
**Decisão de gate:** **PASS**

### Rastreio critérios → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| Restaurar último *workspace* ao voltar / recarregar | **OK** | `useState` com inicializador que chama `resolveInitialWorkspace(readWorkspaceFromStorage(), canViewNfse)` em `GuidesMei.tsx`; `useEffect` persiste `activeWorkspace` com `localStorage.setItem` na chave `meu-financeiro:mei-workspace-last`. |
| Primeira visita (sem chave) | **OK** | `readWorkspaceFromStorage` → `null` → `resolveInitialWorkspace` devolve `overview`. |
| `localStorage` corrompido / indisponível | **OK** | `parseStoredWorkspace` rejeita valores fora da lista; `readWorkspaceFromStorage` com try/catch e guarda `typeof localStorage === 'undefined'`; fallback para `overview`. |
| Sem gravar sem acesso à rota MEI | **OK** | `App.tsx`: rota `/guias-mei` só renderiza `<GuidesMei />` quando `canAccessMeiArea`; o efeito de escrita só corre com o componente montado. |
| NFS-e sem permissão | **OK** | `resolveInitialWorkspace`: `nfse` + `!canViewNfse` → `overview`; `useEffect` adicional força `overview` se `activeWorkspace === 'nfse'` e `!canViewNfse`. |
| Chave prefixada (evitar colisão) | **OK** | Constante `MEI_WORKSPACE_STORAGE_KEY = 'meu-financeiro:mei-workspace-last'`. |
| Privacidade (sem PII) | **OK** | Apenas identificadores de *workspace* permitidos. |

### Testes executados (gate)

- `npx vitest run --environment jsdom src/pages/GuidesMei.permissions.test.tsx src/App.mei-gate.test.tsx` — **8/8 pass** (2026-03-30).

### Observações (não bloqueantes)

1. **Cobertura automatizada P2:** não há teste dedicado a leitura/escrita da chave (story marcou opcional); regressão geral e *gate* MEI cobrem rotas/permissões. **Dívida leve:** um teste com `localStorage` mockado para `parseStoredWorkspace` / restauração reduziria risco de regressão futura.  
2. **Ordem dos efeitos:** ao corrigir `nfse` → `overview`, o efeito de persistência pode gravar `overview` (comportamento aceitável e alinhado ao fallback).  
3. **Smoke manual** (DoD): recomendado confirmar no browser — trocar tab → F5 → mesmo tab; utilizador sem NFS-e com valor `nfse` na chave → abre em visão geral.

### Riscos

- **Baixo:** alteração localizada; sem novas APIs de rede; falhas de `localStorage` tratadas.

### Segue para merge

- **Sim**, após *smoke* manual opcional conforme DoD.
