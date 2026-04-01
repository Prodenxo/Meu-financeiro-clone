# Story — UX-GLOBAL-01: Fase A — Relatório de auditoria, matriz de problemas, backlog e checklist AA

**ID:** STORY-UX-GLOBAL-01  
**Prioridade:** P0 (programa revisão IU/UX global)  
**Depende de:** — (pode correr em paralelo com preparação técnica; recomenda-se ler código alvo antes da auditoria)  
**Fonte:** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md` (FR-UX-GLOBAL-A01, A02, A03, A05, A06, A07)  
**Especificação UX:** `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md` §8, §7

## User story

**Como** equipa de produto/UX/engineering,  
**quero** artefactos versionados de auditoria (relatório, matriz, backlog priorizado, checklist WCAG e handoff para stories),  
**para** priorizar remediações com evidência e cumprir a Fase A do PRD antes de ondas de implementação.

## Contexto técnico

- **Localização:** `docs/ux-audit/` (criar pasta se não existir). Nomes sugeridos no spec §8.
- **FR-UX-GLOBAL-A01:** relatório com referências a rotas e, quando possível, `frontend/src/...`.
- **FR-UX-GLOBAL-A02:** matriz com colunas mínimas — ID, local (rota/componente), heurística (Nielsen # ou WCAG resumo), severidade (crítico/alto/médio/baixo), impacto, esforço estimado, dono sugerido (UX / frontend / conteúdo / backend), sugestão de correção.
- **FR-UX-GLOBAL-A03:** backlog em três faixas — Quick wins / Médio / Estrutural — derivado da matriz.
- **FR-UX-GLOBAL-A05:** checklist WCAG 2.2 AA por fluxo (tabela do spec §7.1) com Passou/Falhou/N/A + nota.
- **FR-UX-GLOBAL-A06:** tabela de handoff — item ID, rota, critérios de aceite testáveis, story alvo (placeholder `STORY-UX-GLOBAL-NN` até criadas).
- **FR-UX-GLOBAL-A07:** documento **só se** a auditoria concluir redundância prejudicial entre sidebar, bottom nav e atalhos; caso contrário secção “N/A — sem recomendação estrutural” no relatório.

## Critérios de aceite

- [ ] Existe `docs/ux-audit/relatorio-iu-ux-global-YYYY-MM-DD.md` (data real) com ligação ao PRD e ao spec UX.
- [ ] Existe matriz de problemas (ficheiro dedicado ou secção clara no relatório) cumprindo A02.
- [ ] Backlog priorizado em três faixas (A03) com **≤ 10** candidatos a quick wins identificados (pode haver mais no total; o PRD exige lista explícita de ≤10 para primeira onda).
- [ ] Checklist AA §7.1 do spec preenchida para os fluxos PRD §4.3 (A05).
- [ ] Handoff (A06) com pelo menos **5** linhas acionáveis ligadas a IDs da matriz (pode referenciar `story-ux-global-03` … `story-ux-global-07` como *placeholders* de remediação).
- [ ] A07 tratado (documento `proposta-navegacao-...` **ou** justificativa N/A no relatório).

## Fora de escopo

- Implementação de código (ondas P0/P1 — stories seguintes).  
- Testes moderados com utilizadores (STORY-UX-GLOBAL-02).

## File list (checklist implementação)

- [ ] `docs/ux-audit/` (pasta)
- [ ] `docs/ux-audit/relatorio-iu-ux-global-*.md`
- [ ] `docs/ux-audit/matriz-problemas-iu-ux-global-*.md` (opcional se integrado no relatório)
- [ ] `docs/ux-audit/proposta-navegacao-global-*.md` (condicional A07)

## Definition of Done

- PO/produto confirma leitura e priorização explícita do backlog (evidência em comentário de revisão ou minuta).  
- NFR-UX-GLOBAL-03: ficheiros com data e referências cruzadas ao PRD/spec.

## Qualidade / CodeRabbit

- Evitar dados pessoais reais em capturas ou notas (NFR-UX-GLOBAL-04).  
- IDs da matriz estáveis (`UX-GLOBAL-M###`) para rastreio em PRs posteriores.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida — artefactos docs)

### Completion Notes List

- Entregues relatório principal, matriz `UX-GLOBAL-M001`–`M010`, checklist WCAG preliminar (P/F/N/A com notas), backlog em três faixas com **10** candidatos explícitos a quick wins, handoff com **7** linhas (≥5 exigidas), A07 **N/A** com justificativa no relatório §5 (sem ficheiro `proposta-navegacao-*`).
- **Seguimento QA (2026-04-01):** (1) Criada minuta [po-priorizacao-backlog-2026-04-01.md](../ux-audit/po-priorizacao-backlog-2026-04-01.md) para o PO fechar DoD com priorização explícita e decisão sobre itens 8–10; relatório §4.1 com *blockquote* de clarificação e §7 com passo 1 atualizado; checklist WCAG com secção “Estado da verificação”, grelha de histórico instrumental (vazia até QA correr ferramentas) e nota explícita de que **P\*** não fecha AA em todo o fluxo. (2) **SM/PO:** marcar checkboxes em “Critérios de aceite” e “File list” após preencher minuta / aceitar entrega. (3) Secção **QA Results** não foi alterada pelo dev (autoria QA).

### File List (implementação)

- `docs/ux-audit/relatorio-iu-ux-global-2026-04-01.md` (atualizado — §4.1 nota, §7, cabeçalho link minuta PO)
- `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md`
- `docs/ux-audit/checklist-wcag-22-aa-fluxos-2026-04-01.md` (atualizado — pós-QA)
- `docs/ux-audit/po-priorizacao-backlog-2026-04-01.md` (novo)

### Debug Log References

- N/A (entrega só documentação; sem alteração de código)

### Change Log

- **2026-04-01** — Story criada (SM) a partir do PRD/spec revisão IU/UX global.
- **2026-04-01** — Fase A: artefactos em `docs/ux-audit/`; story marcada Ready for Review.
- **2026-04-01** — Ajustes pós-QA: minuta PO, checklist WCAG reforçada, relatório §4.1/§7/cabeçalho.

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-04-01  
**Decisão de gate:** **PASS com ressalvas**

### Rastreio critérios de aceite → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| Relatório com data real + ligações PRD/spec | **OK** | `docs/ux-audit/relatorio-iu-ux-global-2026-04-01.md` — cabeçalho com data, links para `docs/prd/...` e `docs/specs/...` |
| Matriz A02 (colunas obrigatórias) | **OK** | `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md` — tabela com ID, local, heurística/WCAG, severidade, impacto, esforço, dono, sugestão |
| Backlog A03 em três faixas + ≤10 quick wins | **OK** | Relatório §4.1–4.3; §4.1 lista numerada com **10** itens (inclui reservas M008/M009/documentação) |
| Checklist AA §7.1 (fluxos PRD §4.3) | **OK com ressalva** | `checklist-wcag-22-aa-fluxos-2026-04-01.md` — colunas Autenticação … Shell; usa **P**/N/A com notas de amostragem; não substitui Axe/Lighthouse (explicitado no próprio doc § revalidar) |
| Handoff A06 ≥5 linhas + IDs matriz | **OK** | Relatório §6 — **8** linhas na tabela; IDs `UX-GLOBAL-M001`… e ligação a stories `ux-global-02`…`07` |
| A07 (proposta ou N/A) | **OK** | Relatório §5 — N/A documentado com critério de reabertura pós UX-GLOBAL-02; sem ficheiro `proposta-navegacao-*` (coerente) |

### NFR / qualidade documental

| ID | Veredicto | Nota |
|----|-----------|------|
| NFR-UX-GLOBAL-03 (versão + referências) | **OK** | Data 2026-04-01 e hiperligações cruzadas entre relatório, matriz e checklist |
| NFR-UX-GLOBAL-04 (sem PII) | **OK** | Texto estático; sem dados pessoais |
| IDs estáveis `UX-GLOBAL-M###` | **OK** | M001–M010 consistentes na matriz e no relatório |

### Definition of Done (story)

- **Pendente:** confirmação explícita de **PO/produto** sobre leitura e priorização do backlog (DoD §48–49). **Não bloqueia** a veracidade dos artefactos; recomenda-se minuta ou comentário no PR antes do merge se o processo o exigir.

### Observações (não bloqueantes)

1. **Checklist WCAG:** valores **P** com asterisco são *hipótese* até ferramenta/teclado — alinhado à Fase A; seguir §7 do relatório para próximo passo QA.  
2. **Critérios de aceite / File list** na story ainda por marcar `[x]` — sugerido a **PO** ou **SM** após aceitação formal.  
3. Itens 8–10 da lista quick wins são *reservas*; válido para “≤10 identificados”, mas o PO deve confirmar se contam para compromisso de sprint.

### Riscos

- **Baixo** para integridade documental; **médio** de produto se PO não priorizar §4.1 antes de dev puxar UX-GLOBAL-03/04.

### Segue para merge

- **Sim**, do ponto de vista de **entrega Fase A**; completar evidência de **DoD PO** conforme processo interno.
