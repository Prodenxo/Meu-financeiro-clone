# Story — FR-RPS (P0): **`rps`** inicial canónico no cadastro empresa PlugNotas (BFF)

**ID:** STORY-FR-RPS-P0-BACKEND-EMPRESA-RPS-INICIAL  
**Prioridade:** P0  
**Depende de:** —  
**Relacionada (não bloqueante):** [`story-fr-rps-p1-docs-adr-nota-rps-opcional.md`](./story-fr-rps-p1-docs-adr-nota-rps-opcional.md) — P1 opcional de ADR; **depende desta P0** (a P1 lista a dependência; não usar “Bloqueia” aqui para evitar ambiguidade).  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md`](../prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md) — **FR-RPS-POST-01**, **FR-RPS-OVR-01**, **FR-RPS-PATCH-01**, **FR-RPS-QA-01**, **NFR-RPS-SINGLE-01**, **NFR-RPS-OBS-01**, **NFR-RPS-SBX-01**  
**UX:** [`docs/specs/ux-spec-plugnotas-empresa-rps-inicial-2026-04-16.md`](../specs/ux-spec-plugnotas-empresa-rps-inicial-2026-04-16.md) — sem novos controlos; **UX-RPS-SURFACE-01**, **UX-RPS-FLOW-01/02**, **UX-RPS-ERR-01** (sem alteração obrigatória de hints)  
**Arquitetura:** [`docs/technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md`](../technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md) — §3 (pontos de extensão), §3.2 (fallback POST→PATCH), §6 (testes)

## Planeamento

| Campo | Valor |
|-------|--------|
| **Estimativa** | **A definir na *sprint planning*** (sugestão de tamanho: **S** — novo módulo `rps`, integração em `empresa.service.js`, testes unitários/mock e verificação de rotas; complexidade principal no fallback POST→PATCH). |
| **Story points (opcional)** | Atribuir na planning se a equipa usar Fibonacci; até lá **TBD**. |
| **Épico / âncora de release (opcional)** | Brownfield **Guia MEI — cadastro fiscal / Plugnotas**; referência de produto: [PRD FR-RPS](../prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md). Rótulo de épico em ferramenta (Jira, Linear, etc.) **TBD** se o processo da equipa o exigir. |
| **Risco de produto (1 linha)** | O PlugNotas pode, em casos raros, devolver **400** referindo `rps` / `numeracao` / `lote` para uma conta ou ambiente; mitigação: **NFR-RPS-SBX-01**, **waiver** no DoD se sandbox indisponível, e escalação operacional segundo [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) se o erro persistir após validação controlada. |

---

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — strip de `rps` no ramo `tryUpdateEmpresa` após conflito POST; **não** enviar `rps` em `atualizarEmpresaPlugNotas` |

---

## User story

**Como** MEI que configura o emitente no Guia MEI (certificado + dados enviados ao PlugNotas),  
**quero** que a numeração inicial do **RPS** no emissor fique **consistente e automática**, sem novos campos na interface para lote ou série,  
**para** não ter de configurar manualmente lote/série neste fluxo e alinhar o cadastro ao contrato esperado pelo provedor.

**Implementação (BFF — rastreio técnico):** o servidor garante `rps` canónico no **`POST /empresa`** e **não** envia nem repõe `rps` no **`PATCH`** (incluindo o fallback quando o POST sinaliza empresa já existente). Detalhe nos critérios **FR-RPS-*** abaixo.

---

## Contexto

- Hoje o cliente (`buildNfEmissionEmpresaPayload`) **não** envia `rps`; a **fonte de verdade** é o **BFF** (**NFR-RPS-SINGLE-01**).  
- O ramo **conflito** em `cadastrarEmpresaPlugNotas` chama `tryUpdateEmpresa(cnpj, payload)` com o **mesmo** objecto — é **obrigatório** não enviar `rps` no PATCH de contingência (**arquitetura §1.1**).  
- **Frontend:** sem campos novos nesta entrega; espelhar `rps` no payload do cliente é **opcional** (fora do critério mínimo).  
- **Outros caminhos:** confirmar no código que **todos** os envios a `POST`/`PATCH` empresa PlugNotas passam pelas mesmas regras ou que não há atalho que contorne strip/`rps` (critério dedicado abaixo).

---

## Critérios de aceite

### Técnico — Backend

- [x] **FR-RPS-POST-01 / NFR-RPS-SINGLE-01:** Antes de `requestJson('POST', '/empresa', payload)` em `cadastrarEmpresaPlugNotas`, o `payload` inclui `rps` com `lote: 1` e `numeracao: [{ numero: 1, serie: '1' }]` (tipos: number, number, string).  
- [x] **FR-RPS-OVR-01:** Se o input já trouxer `rps` com outros valores, o servidor **substitui** pelo bloco canónico antes do POST.  
- [x] **FR-RPS-PATCH-01:** `atualizarEmpresaPlugNotas` **remove** `rps` do corpo antes do PATCH (ou equivalente que garanta ausência no upstream).  
- [x] **FR-RPS-PATCH-01 (fallback):** No `catch` de `cadastrarEmpresaPlugNotas` quando se chama `tryUpdateEmpresa`, o corpo do PATCH **não** contém `rps` (usar `stripRpsFromEmpresaPayload` ou cópia sem `rps` — ver arquitetura §3.2).  
- [x] Novo módulo recomendado: `plugnotas-empresa-rps-inicial.js` com `applyEmpresaPlugnotasRpsInicialForPost` e `stripRpsFromEmpresaPayload` (ou nomes alinhados ao repo).  
- [x] **NFR-RPS-OBS-01:** Sem novos logs com PII; reutilizar padrões existentes de erro 400 cadastro empresa.  
- [x] **Cobertura de rotas:** Pesquisar no `backend` por chamadas a empresa PlugNotas (`/empresa`, `cadastrarEmpresaPlugNotas`, `atualizarEmpresaPlugNotas`, `tryUpdateEmpresa`, `requestJson` com path empresa). Se existir caminho alternativo para `POST`/`PATCH` empresa, aplicar a mesma política `rps` ou documentar excepção no PR (revisão @architect).

### Testes (**FR-RPS-QA-01**)

- [x] Testes unitários do módulo `rps` (aplicação idempotente; strip).  
- [x] Teste de integração/mock de `cadastrarEmpresaPlugNotas`: POST contém `rps` esperado.  
- [x] Teste explícito: simular POST conflito → PATCH sucesso: corpo PATCH **sem** `rps`.  
- [x] Teste: `atualizarEmpresaPlugNotas` com `rps` no input → PATCH upstream **sem** `rps`.

### UX (verificação — sem código obrigatório)

- [x] **UX-RPS-SURFACE-01 / 02:** Nenhum novo input/hint de RPS no Guia MEI (revisão visual ou nota QA). — *Entrega só BFF; sem alteração a componentes do Guia MEI neste PR.*  
- [x] **UX-RPS-ERR-01:** Nenhuma alteração obrigatória em `nfseNacionalPlugnotasErrorHints.ts` nesta entrega. — *Sem ficheiros tocados nesse path.*

### Qualidade

- [x] `npm run lint`, `npm run typecheck`, `npm test` — exit 0 (**AGENTS.md**). *(Última verificação local: 2026-04-16.)*

### Sandbox (**NFR-RPS-SBX-01**)

- [ ] @qa: validação manual em **sandbox** PlugNotas: cadastro inicial **aceite** (2xx) com empresa criada/atualizada conforme fluxo.  
- [ ] **Evidência mínima** (uma das opções): comentário no PR **ou** linha no *checklist* de QA da sprint com: **data**, **ambiente** (ex.: sandbox / URL base usada no teste), **CNPJ de teste mascarado** (ex.: últimos 4 dígitos + `***`), e **resultado** (cadastro OK / bloqueio upstream com código HTTP). Não colar payload completo nem certificado em texto aberto.

---

## Tasks (indicativas)

1. [x] Criar `plugnotas-empresa-rps-inicial.js` + testes unitários.  
2. [x] Integrar `applyEmpresaPlugnotasRpsInicialForPost` em `cadastrarEmpresaPlugNotas` (após políticas existentes, antes do POST).  
3. [x] Ajustar ramo `tryUpdateEmpresa` para body sem `rps`.  
4. [x] Remover/strip `rps` em `atualizarEmpresaPlugNotas`.  
5. [x] Testes de integração/mock conforme matriz da arquitetura §6.  
6. [x] Pesquisa de rotas no backend (empresa Plugnotas) + ajuste se necessário (critério “Cobertura de rotas”).  
7. [x] Gates + actualizar **File list** / **Dev Agent Record**.

---

## File list (indicativo)

- [x] `backend/src/services/plugnotas/plugnotas-empresa-rps-inicial.js` *(novo)*  
- [x] `backend/tests/plugnotas-empresa-rps-inicial.test.js` *(novo ou agrupado)*  
- [x] `backend/src/services/plugnotas/empresa.service.js`  
- [x] `backend/tests/plugnotas-empresa.test.js` *(ou ficheiro de teste existente que cubra `cadastrarEmpresaPlugNotas` / conflito→PATCH)*  

**Opcional (não bloqueante):** `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` — nota de um parágrafo (**NFR-RPS-DOC-01**); pode seguir [`story-fr-rps-p1-docs-adr-nota-rps-opcional.md`](./story-fr-rps-p1-docs-adr-nota-rps-opcional.md).

---

## CodeRabbit Integration

- Focar: `rps` só no POST “feliz”; **nunca** no PATCH; cuidado com mutação vs cópia do `payload` no fallback de conflito.  
- Não duplicar política no frontend sem decisão PO.

---

## Definition of Done

- Todos os **critérios de aceite** desta story verificados (checkboxes), incluindo **NFR-RPS-SBX-01** quando o ambiente sandbox estiver disponível para @qa; se sandbox indisponível na sprint, registar **waiver** no PR com acordo @po/@qa.  
- **Quality gates** do projeto: `npm run lint`, `npm run typecheck`, `npm test` — exit 0 (**AGENTS.md**).  
- Código integrado na *branch* principal via **PR aprovado** (merge), com **File list (confirmado)** e **Dev Agent Record** actualizados na story ou referência ao PR.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review *(código + critérios automatizáveis; **DoD completo** após **NFR-RPS-SBX-01** ou **waiver** @po/@qa)*

### Agent Model Used

*(opcional)*

### Completion Notes

- Módulo `plugnotas-empresa-rps-inicial.js`: `applyEmpresaPlugnotasRpsInicialForPost` antes do POST; `stripRpsFromEmpresaPayload` no PATCH e no fallback POST→PATCH.
- Cobertura de rotas: único POST/PATCH `/empresa` no BFF via `cadastrarEmpresaPlugNotas` / `atualizarEmpresaPlugNotas` (`empresa.service.js`); `plugnotas-emitente-setup.service.js` reutiliza o mesmo serviço.
- **NFR-RPS-SBX-01:** validação manual em sandbox fica a cargo de @qa (evidência no PR/checklist).

### Reconciliação com revisão QA

- **Checkboxes desactualizados:** critérios técnicos, testes, UX (com nota de verificação) e gates **marcados como cumpridos** na secção *Critérios de aceite*; tasks e file list **sincronizados** com o estado do branch.
- **UX (nota QA):** critérios **UX-RPS-*** satisfeitos por construção — entrega limitada ao BFF; sem novos controlos no Guia MEI nem alterações a `nfseNacionalPlugnotasErrorHints.ts`.
- **Revisão @architect** (pedido na story): confirmar no PR o strip no fallback POST→PATCH e ausência de `rps` no PATCH explícito *(spot-check, não bloqueia marcação dos critérios técnicos acima)*.
- **Pendente:** apenas **NFR-RPS-SBX-01** (sandbox + evidência) ou **waiver** documentado.

### File List (confirmado)

- `backend/src/services/plugnotas/plugnotas-empresa-rps-inicial.js` *(novo)*
- `backend/tests/plugnotas-empresa-rps-inicial.test.js` *(novo)*
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/mei-notas-empresa-http.test.js`

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1.0 | Rascunho inicial da story | @sm |
| 2026-04-16 | 1.1 | Refinamento PO: narrativa MEI, relação P1, sandbox estruturado, cobertura de rotas | @sm |
| 2026-04-16 | 1.2 | Refinamento PO (2): secção Planeamento (estimativa), Definition of Done | @sm |
| 2026-04-16 | 1.3 | Refinamento PO (3): épico/âncora opcional + risco de produto (linha única) | @sm |
| 2026-04-16 | 1.4 | Sincronização pós-QA: checkboxes, tasks, notas UX e reconciliação QA | @dev |

---

*Story — River (AIOX Scrum Master). Requisitos rastreados ao PRD e à arquitetura.*
