# Story — FR-RPS (P1): Nota opcional no ADR — payload empresa e bloco **`rps`**

**ID:** STORY-FR-RPS-P1-DOCS-ADR-NOTA-RPS  
**Prioridade:** P1  
**Depende de:** [`story-fr-rps-p0-backend-empresa-rps-inicial-plugnotas.md`](./story-fr-rps-p0-backend-empresa-rps-inicial-plugnotas.md) (implementação merged ou em validação)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md`](../prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md) — **NFR-RPS-DOC-01**  
**Arquitetura:** [`docs/technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md`](../technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md) — último parágrafo da secção introdutória  
**Épico / âncora (opcional):** Mesmo brownfield **Guia MEI — cadastro fiscal / Plugnotas** que a [P0 FR-RPS](./story-fr-rps-p0-backend-empresa-rps-inicial-plugnotas.md); esta story só **documenta** a decisão no ADR.

## Planeamento

| Campo | Valor |
|-------|--------|
| **Estimativa** | **XS** — parágrafo único + *change log* do ADR; sem código. |
| **Story points (opcional)** | **~0,5** ou **1** na *sprint planning* se a equipa arredondar para cima. |

---

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | **@dev** — abre o PR (docs-only ou conjunto com P0); **@pm** opcional para rever tom/copy técnica antes do merge. |
| **revisão** | **@architect** opcional — confirmar que o parágrafo ADR **não contradiz** [`docs/technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md`](../technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md). **Dispensável** se o mesmo texto já foi revisto no PR da **P0**. |
| **quality_gate** | @qa opcional (só leitura documental do ADR). |
| **quality_gate_tools** | **Sem gates de código** obrigatórios só por esta story; `npm run lint` / `npm test` **não** são critério desta entrega. Se o PR incluir apenas ficheiros em `docs/`, seguir política do CI do repo (muitas vezes *docs* não disparam suite completa). |

---

## User story

**Como** equipa que mantém ADRs e runbooks fiscais,  
**quero** uma **nota curta** no ADR de payload empresa a referir a política **`rps`** inicial canónica e o apontador para o PRD/arquitetura,  
**para** que leitores futuros não assumam que o único normalizador de empresa é NFS-e / documentos ativos.

---

## Contexto

- **NFR-RPS-DOC-01:** complementar [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) **sem** duplicar o PRD.  
- Esta story é **opcional** se o mesmo conteúdo for entregue no PR da **P0**; nesse caso fechar esta story como **Cancelada / Duplicada** com referência ao PR (URL ou número) no **Dev Agent Record** ou comentário de fecho.

---

## Critérios de aceite

- [x] Secção ou parágrafo único no ADR referenciado, mencionando: (1) `rps` canónico no **POST** criar empresa; (2) **ausência** intencional de `rps` no **PATCH** da entrega; (3) ligação ao PRD e à arquitetura **FR-RPS**.  
- [x] Nenhuma alteração ao teor das decisões existentes do ADR (**somente** acréscimo pontual alinhado ao PRD; não reescrever decisões anteriores).  
- [ ] Opcional: uma linha em [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) apenas se @po achar útil para suporte (fora do critério mínimo).  
- [ ] Opcional: **@architect** confirma alinhamento ADR ↔ arquitectura FR-RPS (ou regista **waived** no PR se já coberto pelo PR da P0).

---

## Tasks

1. [x] Redigir parágrafo (3–6 frases) e abrir PR só de docs **ou** incluir no PR da P0.  
2. [x] Actualizar **Change Log** do ADR se o repo usar esse padrão no ficheiro. *(Padrão do repo: secção **Complemento (data)** no ADR; sem tabela separada.)*  
3. [x] Se PR **só** de docs: pedir *quick look* **@architect** ou marcar waived com referência ao PR da P0 — **modelos** na secção *Reconciliação com revisão QA* (colar **no PR remoto** ao abrir merge; esta story regista só o texto de apoio).

---

## Definition of Done

- Parágrafo **visível** no ADR na *branch* principal após **merge** do PR (ou conteúdo equivalente já integrado via PR da **P0**).  
- Se **Cancelada / Duplicada** porque o texto foi entregue no PR da P0: registar **link ou número do PR** no **Dev Agent Record** (ou nota de fecho) e marcar estado de fecho por **duplicação** no quadro (p.ex. *Cancelled* / *duplicate* se a ferramenta estiver em inglês).  
- **NFR-RPS-DOC-01** satisfeito (checklist dos critérios de aceite).  
- Revisão **@architect** feita **ou** **waived** documentada (comentário no PR) quando aplicável — ver critério opcional acima.

---

## File list

- [x] `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`  
- [ ] *(opcional)* `docs/operacao-mei-nfse.md`

---

## Dev Agent Record

*(preencher se aplicável)*

### Status

Done *(conteúdo ADR na branch; **DoD** pleno = merge na principal + comentário PR conforme modelos em **Reconciliação com revisão QA**)*

### Completion Notes

- Acrescentada secção **Complemento (2026-04-16) — FR-RPS** em `ADR-plugnotas-empresa-payload-apenas-nfse.md` (**NFR-RPS-DOC-01**): POST canónico, PATCH sem `rps`, links PRD + arquitetura + story P0 + ficheiros de código.
- Sem alteração ao texto das decisões anteriores do ADR (apenas novo bloco antes de **Consequências**).
- **DoD / QA:** merge na *branch* principal e comentário **@architect** ou *waived* **no PR remoto** continuam a ser o fecho processual; ver modelos abaixo.

### Reconciliação com revisão QA

Pedido do **@qa** (revisão documental): deixar explícitos **template de comentário no PR** e o que falta para **DoD** (merge + trâmite @architect).

| Ponto QA | Resposta |
|----------|----------|
| Gate documental NFR-RPS-DOC-01 | Satisfeito no ADR (complemento FR-RPS). |
| DoD condicional (merge + Task 3) | **Merge:** ao integrar PR na principal. **Task 3:** usar um dos **modelos** na tabela seguinte como primeiro comentário ou nota no PR. |
| Critério opcional @architect | Marcar `[x]` na story **após** existir comentário no PR (ou *waived* com ref. P0). |

**Modelo A — *quick look* @architect**

```text
@architect Pedido de *quick look* no complemento **FR-RPS (2026-04-16)** em
`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`: confirmar alinhamento com
`docs/technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md` (POST canónico `rps`, PATCH sem `rps`, fallback POST→PATCH).
```

**Modelo B — *waived* (ex.: revisão já feita no PR da P0)**

```text
@architect WAIVED: complemento ADR FR-RPS alinhado ao desenho já revisto em <link ou #PR da P0 FR-RPS>.
Sem alteração ao teor das decisões anteriores do ADR; apenas acréscimo NFR-RPS-DOC-01.
```

*(Substituir `<link ou #PR da P0 FR-RPS>` pelo valor real.)*

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1.0 | Rascunho inicial | @sm |
| 2026-04-16 | 1.1 | Refinamento PO: Planeamento (XS), DoD, executor explícito, gates documentais | @sm |
| 2026-04-16 | 1.2 | Refinamento PO (2): revisão @architect opcional + waived; critério e task | @sm |
| 2026-04-16 | 1.3 | Refinamento (critérios PO): épico/âncora; acréscimo ADR; DoD estado duplicado | @sm |
| 2026-04-16 | 1.4 | Implementação P1: complemento FR-RPS no ADR (NFR-RPS-DOC-01) | @dev |
| 2026-04-16 | 1.5 | Pós-QA: Task 3 com modelos PR + reconciliação (DoD / @architect) | @dev |

---

*Story — River (AIOX Scrum Master). Pode ser absorvida pela P0 para reduzir overhead de backlog.*
