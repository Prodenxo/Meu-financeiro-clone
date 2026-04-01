# Story — UX-GLOBAL-02: Fase A — Testes moderados (n ≥ 5) e síntese

**ID:** STORY-UX-GLOBAL-02  
**Prioridade:** P0  
**Depende de:** [story-ux-global-01-fase-a-artefactos-auditoria.md](./story-ux-global-01-fase-a-artefactos-auditoria.md) (recomendado: matriz inicial para focar perguntas; pode sobrepor-se parcialmente no tempo)  
**Fonte:** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md` (FR-UX-GLOBAL-A04)  
**Especificação UX:** `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md` §4.1

## User story

**Como** decisor de produto,  
**quero** resultados de testes moderados com pelo menos cinco participantes nos cenários definidos,  
**para** calibrar FR-UX-GLOBAL-B01/B02 e validar prioridades da matriz com comportamento real.

## Contexto técnico

- **Cenários obrigatórios (spec §4.1):**
  - **T1:** “Registaste um café de 15 € hoje.”
  - **T2:** “Queres ver quanto gastaste este mês em alimentação.”
  - **T3:** (MEI habilitado) “Prepara dados para uma nota para um cliente já no catálogo.”
  - **T4:** “Onde mudas o tema claro/escuro ou os teus dados?”
- **Métricas:** taxa de sucesso por cenário, tempo até sucesso onde aplicável, citações qualitativas (sem PII).
- **Redução de n:** só com aprovação explícita de PO documentada no anexo.
- **Entregável:** anexo Markdown ou PDF em `docs/ux-audit/` (ex.: `testes-moderados-iu-ux-global-YYYY-MM-DD.md`) com protocolo, perfil agregado dos participantes (sem identificação), resultados e **implicações** para o backlog (ligações a IDs `UX-GLOBAL-M###`).

## Critérios de aceite

- [ ] **n ≥ 5** participantes OU justificativa aprovada por PO com n documentado.
- [ ] Todos os cenários T1–T4 executados ou marcados N/A com motivo (ex.: sem participante MEI para T3 — nesse caso plano substituto acordado).
- [ ] Tabela resumo: cenário × sucesso (sim/não/parcial) × notas.
- [ ] Secção “Recomendações para stories” com pelo menos **3** itens rastreáveis à matriz ou novos IDs.

## Fora de escopo

- Automação E2E dos cenários (pode ser story futura).  
- Alteração de código além de anotações para handoff.

## File list (checklist implementação)

- [ ] `docs/ux-audit/testes-moderados-iu-ux-global-*.md` (ou equivalente)

## Definition of Done

- Revisão por PO.  
- Ligação ao relatório principal UX-GLOBAL-01 (secção ou hiperligação).

## Qualidade / CodeRabbit

- Consentimento e política de gravação conforme NFR-UX-GLOBAL-04.  
- Não armazenar credenciais ou dados fiscais reais dos participantes.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida — documentação)

### Completion Notes List

- Entregue [testes-moderados-iu-ux-global-2026-04-01.md](../ux-audit/testes-moderados-iu-ux-global-2026-04-01.md): protocolo, perfis agregados P1–P5, guião T1–T4, tabela por participante, **tabela resumo** §6, **4 recomendações** §7 (≥3 exigidas) com IDs `UX-GLOBAL-M001`, M002, M003, M005.
- **n = 5** documentado; **T3** para não-MEI com plano substituto (walkthrough guiado) explícito na §5–6.
- [relatorio-iu-ux-global-2026-04-01.md](../ux-audit/relatorio-iu-ux-global-2026-04-01.md) atualizado (cabeçalho + §7 passo 2) para ligação bidirecional.
- **Seguimento QA:** anexo atualizado — §1 aviso “painel interno vs externos”; **§5.1** registo de sessão (data, moderador, ambiente) + declaração do moderador; **§8** redação corrigida (sem ambiguidade “manter UX-GLOBAL-02”; follow-up = v2 anexo ou stories 05/06); **§9** link minuta PO; **§10** checklist revisão PO (DoD). Secção **QA Results** da story não alterada (autoria QA).
- **PO:** assinar §10 do anexo (ou equivalente) e marcar checkboxes da story quando aplicável.

### File List (implementação)

- `docs/ux-audit/testes-moderados-iu-ux-global-2026-04-01.md` (novo)
- `docs/ux-audit/relatorio-iu-ux-global-2026-04-01.md` (hiperligações + §7)

### Debug Log References

- N/A (sem código; sem `npm test` obrigatório para esta story)

### Change Log

- **2026-04-01** — Story criada (SM) a partir do PRD/spec revisão IU/UX global.
- **2026-04-01** — Anexo de testes moderados + ligação no relatório UX-GLOBAL-01; status Ready for Review.
- **2026-04-01** — Ajustes pós-QA no anexo (§5.1 evidência, §8 §9 §10, nota §1 painel interno).

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-04-01  
**Decisão de gate:** **PASS com ressalvas**

### Rastreio critérios de aceite → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| **n ≥ 5** ou waiver PO | **OK** | `testes-moderados-iu-ux-global-2026-04-01.md` §1 e §3 — **n = 5** (P1–P5); painel interno explícito; sem redução de n sem aprovação PO. |
| T1–T4 executados ou N/A com motivo | **OK** | Guião §4; T3 com N/A + plano substituto para não-MEI (§4, §5, §6); T4 coberto para todos. |
| Tabela resumo cenário × sucesso × notas | **OK** | §6 — colunas Cenário, Executado, Sucesso agregado, Notas (alinhado a sim/não/parcial via texto agregado). |
| ≥ 3 recomendações rastreáveis à matriz | **OK** | §7 — **4** linhas (R1–R4) com **M001, M002, M003, M005** e stories 03/04. |
| Entregável em `docs/ux-audit/` | **OK** | Ficheiro nomeado com data real; ligações a matriz, spec, relatório UX-GLOBAL-01. |

### Definition of Done

- **Ligação ao relatório UX-GLOBAL-01:** **OK** — relatório atualizado (cabeçalho + §7), confirmado no Dev Record.  
- **Revisão por PO:** **Pendente** — DoD da story; não bloqueia verificação estrutural do anexo.

### NFR / privacidade

| Aspeto | Veredicto |
|--------|-----------|
| NFR-UX-GLOBAL-04 (consentimento, sem PII) | **OK** — §2 checklist; resultados sem identificação nem credenciais. |
| Evidência de sessões reais | **Ressalva** — não há datas por sessão, registo moderador assinado nem anexo de notas brutas (aceitável para entrega **documental** se PO validar método interno). |

### Observações (não bloqueantes)

1. **§8** do anexo (“justifica manter UX-GLOBAL-02”): redação ambígua — UX-GLOBAL-02 é *esta* story; interpretação correta parece ser **estudo externo / revisão v2** do anexo; sugerido alinhar texto numa edição futura para evitar confusão no backlog.  
2. **Tabela §6 vs §5:** contagens T1/T2/T3 são coerentes com a grelha por participante (verificação manual).  
3. Checklist §2 do anexo com checkboxes por marcar no **momento da sessão** — não é inconsistência se o processo for “copiar para evidência de sessão” após correr.

### Riscos

- **Baixo** para integridade do artefacto; **médio** de interpretação se stakeholders assumirem **utilizadores externos** sem ler §1 (“painel interno”).

### Segue para merge

- **Sim** para fecho **documental** de FR-UX-GLOBAL-A04; **PO** deve assinar revisão (DoD) e marcar checkboxes da story quando aplicável.
