# Story — FR-BRAND (P2): Mei Infinito — Comentários de código e CSS (opcional)

**ID:** STORY-BRAND-MEI-INFINITO-P2  
**Prioridade:** P2 (Could — não bloqueia release do rebrand)  
**Depende de:** [story-brand-mei-infinito-p0-ui-testes-docs-canonicos.md](./story-brand-mei-infinito-p0-ui-testes-docs-canonicos.md) (opcional)  
**Fonte:** `docs/prd/PRD-rebrand-mei-infinito-2026-04-02.md` (FR-BRAND-06)  
**Especificação UX:** `docs/specs/ux-spec-rebrand-mei-infinito-2026-04-02.md` §4.7

## User story

**Como** desenvolvedor que mantém o *frontend*,  
**quero** comentários em CSS e código que descrevam a área MEI com o nome **Mei Infinito** quando se referem ao produto,  
**para** reduzir confusão em refactors futuros e manter consistência com o rebrand.

## Contexto técnico

- Atualizar apenas comentários que identificam a **feature** pelo nome antigo (ex.: bloco em `index.css` que diz «Meu MEI — Fluxo do MEI»).  
- Manter a parte descritiva do **regime** («Fluxo do MEI», `FR-UX-MEI-05`) inalterada na função técnica do comentário.

## Critérios de aceite

- [x] `frontend/src/index.css` (e outros ficheiros se grep encontrar): comentários com nome de produto alinhados a **Mei Infinito** onde aplicável.  
- [x] `Sidebar.tsx` comentário de rota (`// Meu MEI: só ativo…`) → redação equivalente com **Mei Infinito** ou «área MEI / guias» sem contradizer a spec.  
- [x] Nenhuma alteração de comportamento ou estilo; apenas comentários.

## Fora de escopo

- Strings de UI (cobertas por P0).  
- Documentação em `docs/` (P1).

## File list (checklist implementação)

- [x] `frontend/src/index.css`  
- [x] `frontend/src/Layout/Sidebar.tsx` (comentário)  
- [x] Outros ficheiros: resultado de `rg "Meu MEI" frontend/src --glob '*.ts*' --glob '*.css'`

## Definition of Done

- Grep em comentários revisado; `npm run lint` verde.

## Qualidade / CodeRabbit

- Não renomear símbolos, rotas ou classes; comentários apenas.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- **`rg "Meu MEI" frontend/src`** (ficheiros `*.ts`, `*.tsx`, `*.css`): **0** ocorrências — copy de comentários já alinhada na onda P0.
- **`index.css`:** bloco `.mei-fluxo-tab` com comentário `/* Mei Infinito — Fluxo do MEI: … (FR-UX-MEI-05) */` (nome de produto + regime preservado).
- **`Sidebar.tsx`:** `// Mei Infinito (/guias-mei): só ativo na rota da guia…` — cumpre spec CAT-MEI-05 §3.2.
- Nenhuma alteração de código necessária nesta passagem; P2 fechado por **verificação** + DoD.
- **Pós-QA (Quinn, PASS):** nota formal em `docs/qa/nota-fr-brand-06-p2-verificacao-comentarios-2026-04-02.md` — evidência grep + dispensa CodeRabbit (observações não bloqueantes da revisão).

### File List (implementação)

- Nenhum ficheiro alterado (estado do repo já conforme FR-BRAND-06).
- `docs/qa/nota-fr-brand-06-p2-verificacao-comentarios-2026-04-02.md` (registo pós-QA).

### Debug Log References

- `rg "Meu MEI" frontend/src --glob "*.ts" --glob "*.tsx" --glob "*.css"` — 0 matches.
- `npm run lint` (raiz) — exit **0** (avisos pré-existentes noutros ficheiros; 0 erros).
- `npm test` (raiz) — exit **0**.
- `docs/qa/nota-fr-brand-06-p2-verificacao-comentarios-2026-04-02.md` — ver Completion Notes.

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | P2 FR-BRAND-06: grep + lint + testes; comentários já «Mei Infinito»; Ready for Review (sem diff de código). |
| 2026-04-02 | Pós-QA PASS: nota `docs/qa/` com evidência e dispensa CodeRabbit (alinhado observações Quinn). |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-04-02  
**Decisão de gate:** **PASS**

### Evidência executada (repo)

- `rg "Meu MEI" frontend/src` — **0** ocorrências (alinhado ao *Dev Agent Record*).
- Amostragem de comentários-alvo:
  - `frontend/src/index.css` (`.mei-fluxo-tab`): `/* Mei Infinito — Fluxo do MEI: … (FR-UX-MEI-05) */` — nome de produto + regime + ID de requisito preservados conforme contexto técnico da story.
  - `frontend/src/Layout/Sidebar.tsx` (`isActive`): `// Mei Infinito (/guias-mei): só ativo na rota da guia…` — coerente com CAT-MEI-05 §3.2.
- `npm run lint` (raiz) — exit **0** (0 erros ESLint; warnings pré-existentes noutros ficheiros, fora do âmbito P2).
- `npm test` (raiz) — exit **0** (regressão global; P2 não altera comportamento).

### Rastreabilidade → critérios de aceite

| Critério | Verificação |
|----------|-------------|
| Comentários CSS/código com **Mei Infinito** onde designam o produto | Grep sem «Meu MEI»; comentários citados acima conformes. |
| `Sidebar.tsx` — redação equivalente ao antigo comentário | Presente e alinhada à spec de navegação. |
| Sem alteração de comportamento/estilo | Nenhum diff de implementação nesta story; risco de regressão por copy de comentários **nulo**. |
| DoD: grep + lint | Grep OK; lint com exit 0. |

### Observações (não bloqueantes)

- **Entrega P2:** fechamento por **verificação** (comentários já atualizados na onda P0); aceitável para prioridade P2 «Could».
- **CodeRabbit:** não exigido para comentários-only; escopo documental/comentário.

### Resumo

**FR-BRAND-06 (P2)** satisfeito: comentários relevantes identificam **Mei Infinito**; «Fluxo do MEI» e `FR-UX-MEI-05` mantidos onde descrevem o regime técnico. **PASS.**

— Quinn, guardião da qualidade 🛡️
