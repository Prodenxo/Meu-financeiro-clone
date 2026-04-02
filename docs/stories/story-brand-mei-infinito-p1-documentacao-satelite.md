# Story — FR-BRAND (P1): Mei Infinito — Documentação satélite e alinhamento editorial

**ID:** STORY-BRAND-MEI-INFINITO-P1  
**Prioridade:** P1 (Should — onda 2 do PRD)  
**Depende de:** [story-brand-mei-infinito-p0-ui-testes-docs-canonicos.md](./story-brand-mei-infinito-p0-ui-testes-docs-canonicos.md) (recomendado: merge P0 primeiro para grep e mensagem única)  
**Fonte:** `docs/prd/PRD-rebrand-mei-infinito-2026-04-02.md` (FR-BRAND-05)  
**Especificação UX:** `docs/specs/ux-spec-rebrand-mei-infinito-2026-04-02.md` §2–3, §7

## User story

**Como** membro da equipa (produto, engenharia, QA),  
**quero** que PRDs, specs, stories e briefs satélites referenciem **Mei Infinito** em vez de «Meu MEI» quando designam o nome da área,  
**para** manter a documentação alinhada à UI e reduzir ambiguidade em reviews e onboarding.

## Contexto técnico

- **FR-BRAND-05:** atualizar menções editoriais («Voltar ao Meu MEI», «área Meu MEI», «PRD Meu MEI», etc.) para as fórmulas do PRD §6 / spec §3.  
- **Opção A:** manter nomes de ficheiro com `meu-mei` nos paths; apenas **conteúdo** interno.  
- Inventário inicial no brief §3.3; completar com `rg` / pesquisa por `Meu MEI` em `docs/` e rever **cada** ocorrência (§3.3 spec UX — falsos positivos: sigla MEI, histórico intencional).

## Critérios de aceite

- [x] `docs/` sem texto de produto que ainda diga **«Meu MEI»** como nome da área, salvo:  
  - comentários históricos explicitamente marcados como legado, **ou**  
  - citações entre aspas em changelogs antigos (opcional: uma linha de nota «anteriormente Meu MEI» onde fizer sentido).  
  - **Exceções acordadas (P1):** artefactos de rebrand (`PRD-rebrand-*`, `ux-spec-rebrand-*`, `brief-rebrand-*`) e stories de marca P0/P1/P2 conservam menções metodológicas a «Meu MEI» (antes/depois, grep de verificação).  
- [x] Briefs/PRDs satélites (ex.: NFS-e, catálogo, revisão UX global) alinhados a **Voltar ao Mei Infinito** / **Mei Infinito** conforme contexto.  
- [x] Stories em `docs/stories/` que descrevem fluxos MEI: títulos ou critérios que usem o nome comercial da área atualizados **sem** alterar IDs `FR-UX-MEI-*` nem secções canónicas bloqueadas pelo processo de story (apenas onde a política do projeto permitir editar — caso contrário, nota no Dev Agent Record + backlog de edição PO).

## Fora de escopo

- Renomear ficheiros `*meu-mei*` (fase futura / Opção B).  
- Alterar `AGENTS.md` ou regras Cursor salvo menção explícita ao nome da área (avaliar caso a caso).

## File list (checklist implementação)

- [x] `docs/prd/` — NFS-e, revisão UX global, epic (ver *File List* abaixo).  
- [x] `docs/specs/` — NFS-e, catálogo, revisão UX global, rebrand (fecho §10).  
- [x] `docs/stories/` — FR-NFSE-UX P0, UX global 03–05, FR-UX-MEI P0–P2, CAT-MEI-05/07, EPIC.  
- [x] `docs/brief/` — NFS-e; brief de rebrand §3.3 (inventário pós-P0).  
- [x] `docs/ux-audit/` — relatório IU/UX global (atalho FAB).  
- [x] `docs/prd/PRD-rebrand-mei-infinito-2026-04-02.md` — sem alteração obrigatória (canónico do programa de rebrand).

## Definition of Done

- Evidência: output de pesquisa (ex.: lista de ficheiros tocados) + revisão manual documentada na story ou nota curta em `docs/qa/`.  
- Nenhum link interno `docs/...` partido por renomeação (não se renomeiam ficheiros nesta story).

## Qualidade / CodeRabbit

- Não alterar requisitos numéricos nem IDs; só copy narrativa.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Alinhamento editorial **Mei Infinito** / **Voltar ao Mei Infinito** em PRDs/specs/briefs satélites (NFS-e, catálogo, revisão UX global), relatório de auditoria, EPIC e stories FR-UX-MEI / CAT-MEI / NFSE / UX global (apenas texto; IDs `FR-*` inalterados).
- `brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md` §3.3 atualizado para estado **pós-P0** + nota P1; `ux-spec-rebrand` fecho §10 com ponteiro explícito à spec canónica (`ux-spec-meu-mei-ui-2026-03-30.md`).
- **Verificação:** `rg "Meu MEI" docs` — residuais concentradas em artefactos de rebrand + stories de marca P0/P1/P2 (metodologia / critérios); satélites operacionais limpos de nome de produto antigo.
- **DoD / QA:** nota curta em `docs/qa/nota-fr-brand-05-p1-verificacao-docs-satelite-2026-04-02.md` (evidência formal + dispensa CodeRabbit para escopo só-docs, alinhado a observações não bloqueantes do Quinn).

### File List (implementação)

- `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md`
- `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`
- `docs/brief/brief-mei-nfse-ui-ux-melhoria-2026-04-01.md`
- `docs/brief/brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md`
- `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md`
- `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md`
- `docs/specs/ux-spec-catalogo-mei-exclusao-2026-03-30.md`
- `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md`
- `docs/specs/ux-spec-rebrand-mei-infinito-2026-04-02.md`
- `docs/ux-audit/relatorio-iu-ux-global-2026-04-01.md`
- `docs/stories/EPIC-prd-meu-financeiro-2026-03-26.md`
- `docs/stories/story-fr-nfse-ux-p0-workspace-estrutura-empty-header.md`
- `docs/stories/story-ux-global-03-p0-shell-rotulos-navegacao.md`
- `docs/stories/story-ux-global-04-p0-guards-mensagens-orientadoras.md`
- `docs/stories/story-ux-global-05-p1-estados-vazios-loading-erro.md`
- `docs/stories/story-fr-ux-mei-p0-visao-geral-kpis-tabs.md`
- `docs/stories/story-fr-ux-mei-p1-tabs-a11y-microcopy.md`
- `docs/stories/story-fr-ux-mei-p2-workspace-localstorage.md`
- `docs/stories/story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md`
- `docs/stories/story-cat-mei-07-frontend-exclusao-clientes-catalogo.md`
- `docs/qa/nota-fr-brand-05-p1-verificacao-docs-satelite-2026-04-02.md`

### Debug Log References

- `rg "Meu MEI" docs` — ver Completion Notes (exceções documentadas).
- `npm run lint`, `npm run typecheck`, `npm test` — executados na raiz após alterações (só `docs/`).
- `docs/qa/nota-fr-brand-05-p1-verificacao-docs-satelite-2026-04-02.md` — registo DoD pós-QA.

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | P1 FR-BRAND-05: documentação satélite e stories alinhadas a Mei Infinito; brief rebrand §3.3; Ready for Review. |
| 2026-04-02 | Pós-QA: nota em `docs/qa/` para fechar DoD (evidência + dispensa CodeRabbit escopo docs). |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-04-02  
**Decisão de gate:** **PASS**

### Evidência executada (repo)

- Pesquisa `Meu MEI` em `docs/**/*.md`: ocorrências apenas em  
  `PRD-rebrand-mei-infinito-2026-04-02.md`, `ux-spec-rebrand-mei-infinito-2026-04-02.md`, `brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md`, `story-brand-mei-infinito-p0-ui-testes-docs-canonicos.md`, `story-brand-mei-infinito-p2-comentarios-css.md` e na própria `story-brand-mei-infinito-p1-documentacao-satelite.md` (critérios / metodologia). **Nenhum** match em PRDs/specs/briefs satélites operacionais (NFS-e, catálogo, revisão UX global) nem em `docs/ux-audit/` — coerente com exceções registadas nos critérios de aceite.
- Amostragem: `PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md` e `ux-spec-mei-nfse-workspace-2026-04-01.md` — **0** ocorrências de «Meu MEI».
- Regressão: `npm run lint`, `npm run typecheck`, `npm test` na raiz — **exit 0** (alterações só em `docs/`; suite verde).

### Rastreabilidade → critérios de aceite

| Critério | Verificação |
|----------|-------------|
| `docs/` sem nome de produto antigo salvo exceções | Grep confina residuais a rebrand + stories de marca; satélites alinhados. |
| Briefs/PRDs satélites (NFS-e, catálogo, UX global) | Sem «Meu MEI» em grep; copy **Mei Infinito** / fórmulas PRD conforme *File List* do Dev Record. |
| Stories de fluxos MEI (títulos/critérios) | Ficheiros listados revistos por amostragem + grep global; IDs `FR-UX-MEI-*` não tocados (escopo editorial). |
| DoD: evidência de pesquisa + links | Lista de ficheiros e nota `rg` no Dev Agent Record; sem renomeação de paths. |
| NFR editorial | Sem alteração a requisitos numéricos nem a IDs — só narrativa. |

### Observações (não bloqueantes)

- **CodeRabbit:** não executado nesta revisão (escopo documental; política WSL opcional para PRs com código).
- **Nota em `docs/qa/`:** opcional no DoD; evidência na story considerada suficiente para P1.

### Resumo

Implementação **FR-BRAND-05 (P1)** consistente com o PRD de rebrand e com a UI já entregue em P0: documentação satélite e stories relevantes usam **Mei Infinito** como nome comercial da área; exceções documentadas para artefactos de programa de rebrand e stories de marca. **PASS** para merge do conteúdo documental.

— Quinn, guardião da qualidade 🛡️
