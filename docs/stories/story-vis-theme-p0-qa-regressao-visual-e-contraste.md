# Story — VIS-THEME (P0): QA — regressão visual e amostragem de contraste (Onda 1)

**ID:** STORY-VIS-THEME-03  
**Prioridade:** P0  
**Epic:** E-VIS-THEME-3  
**Estado (backlog):** Evidência canónica criada — execução QA manual e assinatura pendentes  
**Estimativa:** S–M (0,5–3 dias úteis, conforme profundidade do checklist e número de evidências anexas)  
**Dono sugerido:** QA (revisão técnica opcional: **Frontend** para dúvidas de tema/classe)  
**Depende de:** [STORY-VIS-THEME-01](./story-vis-theme-p1-modais-fecho-e-classes-ui.md) e [STORY-VIS-THEME-02](./story-vis-theme-p1-guidesmei-divisorias-bordas.md) concluídas e integradas (ou candidato a release que as inclua)  
**Fonte:** `docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md` (FR-VIS-THEME-03, critérios §10; NFR-VIS-THEME-01, NFR-VIS-THEME-02)  
**Brief:** `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`  
**Especificação UX:** `docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md` §7, §8 (checklist **8 linhas** da tabela §8)  
**Arquitetura:** `docs/technical/architecture-revisao-visual-temas-claro-escuro-2026-04-17.md` §7

## User story

**Como** equipa de qualidade e utilizadores finais,  
**quero** evidência de que **não há regressão visual crítica** entre temas e que o **contraste** dos controlos alterados cumpre o mínimo acordado,  
**para** fechar a Onda 1 com confiança.

## Definições (refinamento PO)

- **Checklist UX:** percorrer as **8 linhas** da tabela em UX spec **§8** (Header → … → modal de catálogo), em **tema claro** e **tema escuro**. Itens **7** e **8** podem ser **N/A** com justificativa (ex.: utilizador sem acesso MEI / modal indisponível no ambiente).  
- **Fonte de verdade (evidência):** ficheiro canónico **`docs/qa/evidence-vis-theme-onda1-qa.md`** com as secções mínimas listadas em **Template de evidência** abaixo. Pode incorporar por **link** ou **resumo** os ficheiros opcionais das stories 01/02 (`evidence-vis-theme-01-contraste.md`, `evidence-vis-theme-02-guidesmei-bordas.md`) sem duplicar tudo — desde que o canónico indique **Passa/N/A** por item do §8 e o **fecho** da Onda 1. **Alternativa** (ex.: só wiki ou PR de release): requer **aprovação explícita de PO** antes de fechar a story.  
- **NFR-VIS-THEME-01:** amostragem com ferramenta tipo WebAIM — par fundo/primeiro plano, ratio ou “pass AA”, para controlos tocados pela Onda 1.  
- **NFR-VIS-THEME-02:** parecer sobre bordas “pesadas” no tema claro nos ecrãs verificados (screenshot se disputado).

### Template mínimo — `docs/qa/evidence-vis-theme-onda1-qa.md`

1. **Cabeçalho:** data, ambiente (URL local ou staging), identificação do build/commit ou branch integrado.  
2. **Checklist UX §8:** tabela ou lista com **8** entradas alinhadas às linhas da spec — colunas **Passa / N/A** + nota curta.  
3. **Contraste (NFR-VIS-THEME-01):** amostragem (fechos de modal + divisórias `/guias-mei` se aplicável) + ligação aos ficheiros 01/02 se existirem.  
4. **Shell Onda 0:** confirmação explícita dos critérios PRD §10 relevantes ao checklist.  
5. **Artefatos:** links a PRD, brief, UX spec, arquitetura (pode ser paths do repositório).  
6. **Assinatura QA / data** (ou equivalente acordado com PO).

## Contexto técnico

- Alternância de tema via Definições ou mecanismo existente na app.  
- Se [STORY-VIS-THEME-01](./story-vis-theme-p1-modais-fecho-e-classes-ui.md) criar `docs/qa/evidence-vis-theme-01-contraste.md`, incorporar na revisão de contraste. Se [STORY-VIS-THEME-02](./story-vis-theme-p1-guidesmei-divisorias-bordas.md) criar `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md`, usar no **item 7** e na amostragem de bordas em `/guias-mei`.  
- Opcional: link na secção **QA Results** das stories 01/02 para o ficheiro canónico `evidence-vis-theme-onda1-qa.md`.

## Critérios de aceite

- [ ] **Checklist:** as **8** linhas do UX spec §8 tratadas (**Passa** ou **N/A** + justificativa onde N/A). *(Marcar checkboxes em [`evidence-vis-theme-onda1-qa.md`](../qa/evidence-vis-theme-onda1-qa.md).)*  
- [x] **Evidência canónica:** `docs/qa/evidence-vis-theme-onda1-qa.md` criado ou atualizado conforme **Template mínimo** **ou** alternativa **pré-aprovada por PO** documentada na story / comentário de fecho.  
- [x] **NFR-VIS-THEME-01:** amostragem registada para entregas da Onda 1 (mínimo: fechos de modal + 1–2 divisórias em `/guias-mei` se alteradas). *(Secção 3 do canónico + ligações 01/02.)*  
- [ ] **Shell (Onda 0)** reverificado conforme PRD §10 e checklist (navegação inferior, sidebar, cartões/tabelas admin/planner). *(Secção 5 do canónico — checkboxes QA.)*  
- [ ] **Critérios globais** PRD §10 satisfeitos ou **exceção** explícita aprovada por PO.  
- [x] **Artefatos** referenciados na evidência (PRD, brief, UX spec, arquitetura).

## Fora de escopo

- Automação E2E de screenshot (fora do PRD).  
- Auditoria WCAG completa do site (esta story é **amostragem** focada na Onda 1).

## File list (checklist evidência)

- [x] **`docs/qa/evidence-vis-theme-onda1-qa.md`** (canónico — obrigatório salvo exceção PO)  
- [x] Incorporar ou referenciar `docs/qa/evidence-vis-theme-01-contraste.md` e `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md` se existirem  
- [x] Opcional: secção **QA Results** em [STORY-VIS-THEME-01](./story-vis-theme-p1-modais-fecho-e-classes-ui.md) e [STORY-VIS-THEME-02](./story-vis-theme-p1-guidesmei-divisorias-bordas.md) com link para o canónico

## Definition of Done

- Onda 1 **fechada** do ponto de vista QA conforme PRD §9 (checklist 100 %).  
- PO ou delegado **confirma** aceitação dos critérios §10 do PRD.  
- Evidência canónica ou alternativa aprovada disponível e ligada nesta story (secção **QA Results** ou path no Change log).

## Notas de refinamento (PO → SM)

- **2026-04-17:** meta (estado, estimativa, dono), **brief**, checklist **8** itens §8, ficheiro canónico `evidence-vis-theme-onda1-qa.md` + template mínimo, regra de alternativa com PO, **Ready for execution**.

## Qualidade / CodeRabbit

- Não exige alteração de código de produção salvo correções **mínimas** descobertas durante QA (abrir bug ou PR com referência a esta story).

---

## Dev Agent Record

### Status

Evidência canónica entregue — aguarda execução checklist §8 + assinatura QA/PO

### Agent Model Used

—

### Completion Notes List

- **`docs/qa/evidence-vis-theme-onda1-qa.md`:** template mínimo (§1–7): checklist §8 com colunas claro/escuro + N/A; NFR-01/02; PRD §10; artefatos; incorporação por referência a `evidence-vis-theme-01` e `evidence-vis-theme-02`.
- **Follow-up QA:** secção **Guia de smoke** no canónico (rotas `App.tsx`, viewport mobile item 3, pré-requisitos MEI itens 7–8).
- **Stories 01 e 02:** link opcional para o canónico na secção QA Results.
- **Commit referência** no canónico: atualizar após merge final se diferente.

### File List (implementação)

- `docs/qa/evidence-vis-theme-onda1-qa.md`
- `docs/stories/story-vis-theme-p1-modais-fecho-e-classes-ui.md` (link QA)
- `docs/stories/story-vis-theme-p1-guidesmei-divisorias-bordas.md` (link QA)

### Debug Log References

—

### Change Log

- **2026-04-17** — Follow-up QA: guia de smoke (rotas + mobile + MEI) em `evidence-vis-theme-onda1-qa.md` (Dex).
- **2026-04-17** — Implementação artefato canónico Onda 1 + ligações stories 01/02 (Dex).
- **2026-04-17** — Story criada (SM) a partir do PRD, UX spec e arquitetura.  
- **2026-04-17** — Refinamento PO: meta, brief, dono QA, checklist 8 itens §8, evidência canónica + template, alternativa com aprovação PO, Status Ready for execution.

---

## QA Results

**Pendente:** marcar checklist em [`docs/qa/evidence-vis-theme-onda1-qa.md`](../qa/evidence-vis-theme-onda1-qa.md) após smoke manual (tema claro/escuro) e confirmar PRD §10. **DoD:** assinatura QA/PO no canónico quando a Onda 1 estiver fechada.

---

**Data:** 2026-04-17 · **Revisor:** Quinn (AIOX QA)

**Gate — entregável documental (estrutura canónica):** **PASS** — `docs/qa/evidence-vis-theme-onda1-qa.md` inclui cabeçalho, 8 linhas §8 com colunas claro/escuro/N/A, NFR-01 (com remissões 01/02), NFR-02 (parecer), PRD §10 mapeado, artefatos e bloco de assinatura; ligações relativas válidas.

**Gate — fecho STORY-03 / Onda 1 (PRD §9 métrica 100 %):** **BLOQUEADO** — checkboxes §8 e §10 no canónico por preencher; critérios globais §10 e shell Onda 0 sem confirmação humana; assinatura QA/PO em branco.

**Rastreio aos critérios de aceite**

| Critério | Estado |
|----------|--------|
| Evidência canónica + template | Satisfeito (ficheiro presente e completo face ao template PO) |
| NFR-01 amostragem | Satisfeito por **referência** às evidências 01/02; ratio WebAIM explícito continua nos docs 01 — aceitável para amostragem Onda 1 |
| Artefatos | Satisfeito |
| Checklist §8 (8 linhas Passa/N/A) | **Pendente** execução manual |
| Shell §10 reverificado | **Pendente** (secção 5 do canónico) |
| Critérios globais §10 | **Pendente** PO/delegado |

**Risco residual:** baixo para estrutura; médio operacional se QA não percorrer viewport mobile (item 3) e rotas longas (Guias MEI).

**Follow-up Dev (2026-04-17):** no canónico, secção **«Guia de smoke (rotas e pré-requisitos)»** com mapeamento §8 → rotas (`/`, `/transacoes`, `/settings`, `/guias-mei`, catálogo MEI), instrução explícita para item 3 (viewport ≤768px) e N/A quando sem acesso MEI.
