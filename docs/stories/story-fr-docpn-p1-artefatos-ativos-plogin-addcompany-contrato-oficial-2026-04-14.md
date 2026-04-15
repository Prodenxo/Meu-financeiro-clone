# Story — FR-DOCPN (P1): Artefatos ativos PLOGIN/addCompany — produto, UX e arquitetura

**ID:** STORY-FR-DOCPN-P1-ARTEFATOS-ATIVOS-PLOGIN-ADDCOMPANY-CONTRATO-OFICIAL-2026-04-14  
**Prioridade:** P1  
**Status:** Draft  
**Depende de:** [`docs/stories/story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](./story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md)  
**Fonte PRD:** [`docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md) — **FR-DOCPN-01**, **FR-DOCPN-04**, **FR-DOCPN-05**, **FR-DOCPN-07**, **FR-DOCPN-08**, **NFR-DOCPN-01**, **NFR-DOCPN-02**, **NFR-DOCPN-03**, **CR-DOCPN-01**, **CR-DOCPN-04**  
**UX:** secoes 3 (principios), 6.3 (mapa de fontes canonicas), 7.1 (fluxo A), 7.2 (fluxo B), 8 (conteudo e copy), 9.1 (blocos obrigatorios), 10.2 (superficies P1), 12 (mapeamento PRD -> UX), 13 (criterios)  
**Arquitetura:** secoes 3.2 (propagacao), 5.2 (artefatos P1), 6.1 (mapa de fontes), 6.2 (divergencia atual), 6.3 (politica local), 7.1 (ordem de atualizacao), 8.1 (triagem por municipio), 13.3 (regra), 14 (criterios arquiteturais)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisao** | @po e @architect |
| **quality_gate_tools** | revisao documental, conferencia manual de links, `rg` para nomenclatura proibida e gates do repo (`npm run lint`, `npm run typecheck`, `npm test`) |

---

## User story

**Como** responsavel pelos artefatos ativos do cluster PLOGIN/addCompany,  
**quero** alinhar PRD, UX spec e arquitetura tecnicas vigentes ao contrato oficial atual do PlugNotas,  
**para** que a narrativa de erro, triagem e politica do produto fique coerente em todo o backlog ativo sem mascarar a divergencia do runtime legado.

---

## Contexto

- O PRD novo separa explicitamente contrato oficial, politica local e estado atual da implementacao; os artefatos ativos do cluster PLOGIN precisam herdar essa separacao.
- A UX spec exige mapa de fontes canonicas perto do topo e proibe tratar `prefeitura.login`/`senha` como surpresa nao documentada pelo fornecedor.
- A arquitetura determina que PRDs/specs/arquiteturas ativas derivem da camada canonica interna e nao reinventem o contrato externo isoladamente.
- Esta story deve manter a classificacao atual do produto e o bloqueio de credenciais municipais como politica local, nao como limite do schema oficial.

---

<a id="story-docpn-12-mapa-fontes"></a>
## Mapa de fontes canonicas

- [PRD — Story 1.2 / artefatos ativos](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-story-12): define o objetivo, os ACs nucleares e o recorte P1 desta story.
- [PRD — estado atual do produto](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-estado-produto): fixa a divergencia local entre contrato oficial e runtime legado que os artefatos ativos precisam explicitar.
- [UX — mapa de fontes canonicas](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-mapa-fontes): exige links para fontes oficiais e equivalente canonico interno.
- [UX — superficies P1](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-superficies-p1): confirma o trio principal P1 e alerta para outros artefatos ativos addCompany/robustez ainda vigentes.
- [Arquitetura — artefatos P1](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-artefatos-p1): define o padrao esperado para PRD ativo, spec ativa e arquitetura ativa do cluster.
- [Arquitetura — ordem de atualizacao obrigatoria](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-ordem-atualizacao): bloqueia esta story ate a camada canonica P0 estar concluida.
- [Camada canonica interna — story 1.1](./story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#story-docpn-11-mapa-fontes): gate de sequenciamento e referencia de handoff para a propagacao P1.
- [Camada canonica interna — `docs/architecture.md`](../architecture.md#arch-root-plugnotas-payload-nfse): narrativa canonica consolidada do repo para contrato oficial x divergencia local.
- [Camada canonica interna — `docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md#plugnotas-empresa-payload-apenas-nfse): runbook canonico para triagem por municipio e leitura de `padraoNacional/login/senha`.
- [Camada canonica interna — `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md#adr-plugnotas-politica-local-credenciais): fonte canonica da politica local do produto para bloqueio de credenciais municipais.
- [PlugNotas — addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany): contrato oficial do cadastro de empresa a ser citado nos artefatos ativos.
- [PlugNotas — getCidadeById](https://docs.plugnotas.com.br/#operation/getCidadeById): fonte oficial para leitura de municipio e comprovacao de exigencias como `login`/`senha`.
- [PlugNotas — api.json](https://docs.plugnotas.com.br/api.json): fonte para nomenclatura oficial de `nfse.config.nfseNacional`, `consultaNfseNacional` e schema de `prefeitura`.

---

## Nota de governanca do artefato

- Esta story depende de forma obrigatoria da story 1.1 concluida: primeiro a camada canonica P0, depois a propagacao para artefatos ativos.
- O objetivo aqui e alinhar a narrativa ativa do backlog, nao fechar backlog tecnico de implementacao.
- Se um artefato ativo precisar manter referencia ao shape legado, ele deve fazer isso apenas dentro do bloco de divergencia atual.
- Alem do trio principal P1, qualquer artefato ativo addCompany/robustez identificado por inventario deve ser tratado nesta story ou explicitamente classificado como nao vigente.

---

## Criterios de aceite

- [ ] **AC-DOCPN-ACT-01:** `docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`, `docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` e `docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` passam a apontar explicitamente para `addCompany`, `getCidadeById`, `api.json` e para a camada canonica interna equivalente (**FR-DOCPN-05**, **CR-DOCPN-01**).
- [ ] **AC-DOCPN-ACT-02:** Os tres artefatos ativos distinguem explicitamente contrato oficial do fornecedor, politica local do Meu Financeiro e estado atual da implementacao local (**FR-DOCPN-04**, **FR-DOCPN-07**, **NFR-DOCPN-03**).
- [ ] **AC-DOCPN-ACT-03:** Nenhum dos artefatos ativos trata `nfse.nacional` como contrato oficial sem ressalva; quando o termo aparecer, ele surge apenas como shape legado/divergencia atual (**FR-DOCPN-01**, **CR-DOCPN-04**).
- [ ] **AC-DOCPN-ACT-04:** O cluster PLOGIN passa a afirmar que `prefeitura.login` e `prefeitura.senha` fazem parte do schema oficial do fornecedor, enquanto o bloqueio no produto atual continua sendo politica local (**FR-DOCPN-04**, **FR-DOCPN-07**).
- [ ] **AC-DOCPN-ACT-05:** Os artefatos ativos incorporam a consulta `/nfse/cidades/{codigoIbge}` e a leitura de `padraoNacional`, `login` e `senha` como base de triagem/analise, nao apenas o texto do erro observado (**FR-DOCPN-07**, **NFR-DOCPN-01**).
- [ ] **AC-DOCPN-ACT-06:** Os artefatos ativos deixam explicito que qualquer migracao de runtime para o shape oficial segue backlog tecnico separado (**FR-DOCPN-08**, **DP-DOCPN-03**, **CR-DOCPN-04**).
- [ ] **AC-DOCPN-ACT-07:** Existe inventario objetivo dos outros artefatos ativos addCompany/robustez que ainda possam citar `nfse.nacional` como shape oficial; se nao houver extras vigentes, isso fica registrado no `Dev Agent Record`, e se houver, eles entram no `File list` e no diff desta story (**NFR-DOCPN-02**, **NFR-DOCPN-03**, **CR-DOCPN-01**).

---

## Matriz de rastreabilidade (AC -> Tasks -> Evidencia)

| AC | Task principal | Evidencia esperada |
|---|---|---|
| **AC-DOCPN-ACT-01** | 2 | PRD/spec/arquitetura ativas com links para `addCompany`, `getCidadeById`, `api.json` e equivalente canonico interno |
| **AC-DOCPN-ACT-02** | 2 | Blocos de contrato oficial, politica local e implementacao atual nos tres artefatos |
| **AC-DOCPN-ACT-03** | 3 | Ausencia de `nfse.nacional` como contrato oficial sem ressalva |
| **AC-DOCPN-ACT-04** | 2 | Texto explicito sobre `prefeitura.login`/`senha` como schema oficial x policy local |
| **AC-DOCPN-ACT-05** | 4 | Triagem por municipio descrita com `padraoNacional/login/senha` |
| **AC-DOCPN-ACT-06** | 5 | Backlog runtime separado indicado de forma consistente |
| **AC-DOCPN-ACT-07** | 1 | Inventario objetivo dos extras ativos P1 registrado no `Dev Agent Record`/`File list` |

---

## Dev Notes

### File Locations

- `docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`
- `docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`
- `docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`
- outros artefatos ativos addCompany/robustez identificados via inventario objetivo (`rg`) durante a execucao
- `docs/stories/story-fr-docpn-p1-artefatos-ativos-plogin-addcompany-contrato-oficial-2026-04-14.md`

### Technical Constraints

- Nao reabrir a estrategia nacional-first do produto nesta story.
- Nao remover a classificacao atual `prefeitura_login_required_blocked`; apenas requalificar a explicacao documental do caso.
- Nao tratar o schema oficial como prova de que o runtime ja suporta o novo shape.
- Reusar a camada canonica P0 ja atualizada; evitar que cada artefato ativo redefina o fornecedor por conta propria.
- Se o inventario encontrar outro artefato ativo addCompany/robustez vigente, ele nao pode ficar sem classificacao: ou entra no diff desta story, ou fica explicitamente registrado como nao vigente.

### Testing

- Revisao manual dos tres artefatos ativos com foco em coerencia de narrativa e links.
- `rg "nfse\\.nacional|prefeitura\\.login|/nfse/cidades/\\{codigoIbge\\}" docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` para validar a nova qualificacao.
- Executar inventario objetivo dos artefatos ativos addCompany/robustez com `rg "nfse\\.nacional|nfseNacional|consultaNfseNacional" docs/prd docs/specs docs/technical docs/brief`.
- Confirmar que `prefeitura.login`/`senha` aparecem como schema oficial, enquanto o bloqueio do produto aparece como politica local.
- Executar `npm run lint`, `npm run typecheck` e `npm test` antes do handoff.

---

## Tasks / Subtasks

1. [ ] Inventariar os artefatos ativos addCompany/robustez alem do trio principal e registrar se existem extras vigentes (AC: **AC-DOCPN-ACT-07**).
2. [ ] Atualizar o PRD ativo PLOGIN para apontar para as tres referencias oficiais e para a camada canonica interna correspondente (AC: **AC-DOCPN-ACT-01**, **AC-DOCPN-ACT-06**).
3. [ ] Atualizar a UX spec ativa e a arquitetura tecnica ativa para distinguir contrato oficial, politica local e implementacao atual, incluindo o papel de `prefeitura.login`/`senha` (AC: **AC-DOCPN-ACT-02**, **AC-DOCPN-ACT-04**).
4. [ ] Remover ou qualificar toda afirmacao de `nfse.nacional` como contrato oficial nos artefatos ativos vigentes do recorte P1 (AC: **AC-DOCPN-ACT-03**, **AC-DOCPN-ACT-07**).
5. [ ] Incorporar a triagem por municipio via `/nfse/cidades/{codigoIbge}` com leitura de `padraoNacional`, `login` e `senha` na narrativa ativa do cluster (AC: **AC-DOCPN-ACT-05**).
6. [ ] Revisar os artefatos ativos do recorte final para garantir backlog runtime separado e consistencia com a story 1.1 (AC: **AC-DOCPN-ACT-06**).
7. [ ] Atualizar `File list`, `Dev Agent Record` e `QA Results` desta story para handoff ao `@qa` (AC: **AC-DOCPN-ACT-01** a **AC-DOCPN-ACT-07**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] A story 1.1 foi concluida e a camada canonica P0 ja esta pronta como fonte interna de verdade para esta story.
- [ ] Os tres artefatos ativos foram lidos e comparados com o PRD/UX/arquitetura da iniciativa DOCPN.
- [ ] O inventario preliminar dos outros artefatos ativos addCompany/robustez foi executado antes de iniciar o diff.
- [ ] A equipe concorda que o objetivo e alinhar narrativa documental ativa, nao mexer no runtime.
- [ ] As referencias oficiais `addCompany`, `getCidadeById` e `api.json` foram abertas e conferidas antes da edicao.
- [ ] A fronteira entre "schema oficial" e "politica local" esta clara para quem vai editar os tres arquivos.

---

## Registro de Pronto para Review (PO Gate)

- [ ] Todos os ACs **AC-DOCPN-ACT-01** a **AC-DOCPN-ACT-07** foram validados com evidencia textual nos artefatos ativos do recorte final.
- [ ] O inventario dos extras ativos P1 foi concluido e registrado com resultado objetivo (`nenhum adicional vigente` ou lista final dos adicionais tratados).
- [ ] Os tres artefatos ativos possuem links explicitos para `addCompany`, `getCidadeById` e `api.json`.
- [ ] Os tres artefatos ativos possuem link explicito para a camada canonica interna equivalente.
- [ ] Nenhum dos artefatos ativos restantes apresenta `nfse.nacional` como contrato oficial sem ressalva.
- [ ] A consulta `/nfse/cidades/{codigoIbge}` aparece como passo de triagem/analise nos artefatos ativos pertinentes.
- [ ] O bloqueio de credenciais municipais aparece como politica local do produto, nao como ausencia de suporte do fornecedor.
- [ ] `npm run lint`, `npm run typecheck` e `npm test` foram executados e registrados no `Dev Agent Record`.
- [ ] `Dev Agent Record` e `File list` foram atualizados para handoff de `@dev` para `@qa`.

---

## File list

- [ ] `docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`
- [ ] `docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`
- [ ] `docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`
- [ ] Outros artefatos ativos addCompany/robustez identificados via inventario objetivo (`rg`), se houver
- [ ] `docs/stories/story-fr-docpn-p1-artefatos-ativos-plogin-addcompany-contrato-oficial-2026-04-14.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Paridade entre os tres artefatos ativos do cluster PLOGIN.
- Uso correto de `prefeitura.login`/`senha` como schema oficial vs policy local.
- Ausencia de promessas falsas de migracao de runtime.

---

## Dev Agent Record

### Status

Draft

### File list

- Pendente

### Debug Log References

- Pendente

### Completion Notes

- Story criada para propagar o contrato oficial PlugNotas aos artefatos ativos PLOGIN/addCompany.
- Esta story depende da camada canonica P0 e nao deve virar backlog tecnico de implementacao.
- O inventario dos extras ativos P1 e obrigatorio; se o resultado for negativo, registrar explicitamente `nenhum adicional vigente` no handoff.

### Change Log

- 2026-04-14 — Story criada por @sm a partir do PRD, UX spec e arquitetura da iniciativa DOCPN.

---

## QA Results

- Pendente.
