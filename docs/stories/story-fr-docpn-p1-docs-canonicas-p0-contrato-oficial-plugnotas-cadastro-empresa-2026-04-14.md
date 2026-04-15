# Story — FR-DOCPN (P1): Docs canonicas P0 — contrato oficial PlugNotas / cadastro de empresa

**ID:** STORY-FR-DOCPN-P1-DOCS-CANONICAS-P0-CONTRATO-OFICIAL-PLUGNOTAS-CADASTRO-EMPRESA-2026-04-14  
**Prioridade:** P1  
**Status:** Draft  
**Depende de:** [`docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md)  
**Fonte PRD:** [`docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md) — **FR-DOCPN-01**, **FR-DOCPN-02**, **FR-DOCPN-03**, **FR-DOCPN-04**, **FR-DOCPN-05**, **FR-DOCPN-06**, **FR-DOCPN-07**, **FR-DOCPN-08**, **NFR-DOCPN-01**, **NFR-DOCPN-02**, **NFR-DOCPN-03**, **NFR-DOCPN-05**, **CR-DOCPN-01**, **CR-DOCPN-04**, **DP-DOCPN-03**, **DP-DOCPN-04**  
**UX:** secoes 3 (principios), 6.2 (hierarquia de leitura), 6.3 (mapa de fontes canonicas), 8 (conteudo e copy), 9.1 (blocos obrigatorios), 10.1 (superficies P0), 12 (mapeamento PRD -> UX), 13 (criterios)  
**Arquitetura:** secoes 1.1 (invariantes), 3.2 (regras de propagacao), 5.1 (artefatos P0), 6.1 (mapa de fontes), 6.2 (divergencia atual), 6.3 (politica local), 7.1 (ordem de atualizacao), 8.1 (triagem por municipio), 13.3 (regra), 14 (criterios arquiteturais)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisao** | @architect |
| **quality_gate_tools** | revisao documental, validacao manual de links/ancoras, `rg` para termos proibidos e gates do repo (`npm run lint`, `npm run typecheck`, `npm test`) |

---

## User story

**Como** responsavel pela documentacao canonica do cluster PlugNotas,  
**quero** atualizar os artefatos P0 que hoje ainda misturam contrato oficial, politica local e shape legado,  
**para** que a fonte de verdade do repositorio passe a refletir o contrato oficial atual do fornecedor sem prometer migracao imediata de runtime.

---

## Contexto

- O PRD posiciona esta story como a primeira entrega do Epic 1 e exige atualizacao dos artefatos canonicos antes da propagacao para docs derivadas.
- A UX spec define que toda doc viva do cluster deve expor mapa de fontes, divergencia atual, politica local e historico sem ambiguidade.
- A arquitetura determina ordem obrigatoria de atualizacao: camada canonica primeiro, depois docs ativas, depois historico.
- Esta story e estritamente documental; qualquer migracao de `nfse.nacional` para `nfse.config.nfseNacional` continua fora do escopo desta rodada.

---

<a id="story-docpn-11-mapa-fontes"></a>
## Mapa de fontes canonicas

- [PRD — escopo P0](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-escopo), [requisitos funcionais](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-requisitos), [criterios de aceite](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-criterios) e [estrutura do Epic 1 / Story 1.1](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-estrutura-epico): delimitam o escopo P0, os requisitos FR-DOCPN, os gates desta story e sua origem no epic.
- [PRD — achados canonicos](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-achados-canonicos) e [estado atual do produto](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-estado-produto): fixam o contrato oficial atual e a divergencia documentada entre fornecedor, politica local e runtime.
- [UX — hierarquia de leitura](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-hierarquia), [mapa de fontes](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-mapa-fontes) e [blocos obrigatorios](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-blocos-obrigatorios): definem a navegacao curta, o mapa canonico com proposito por fonte e a estrutura minima das docs vivas.
- [UX — superficies P0](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-superficies-p0): confirma a lista de artefatos P0 que esta story precisa tocar.
- [Arquitetura — artefatos P0](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-artefatos-p0), [mapa de fontes](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-mapa-fontes), [divergencia atual](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-divergencia) e [politica local](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-politica-local): definem o papel arquitetural dos artefatos canonicos e os padroes obrigatorios de conteudo.
- [Arquitetura — ordem de atualizacao](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-ordem-atualizacao) e [triagem por municipio](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-triagem-municipio): fixam a sequencia canonica de manutencao e a obrigatoriedade da consulta `/nfse/cidades/{codigoIbge}`.
- [PlugNotas — addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany): contrato oficial do cadastro de empresa.
- [PlugNotas — getCidadeById](https://docs.plugnotas.com.br/#operation/getCidadeById): fonte oficial para `padraoNacional`, `login` e `senha` por municipio.
- [PlugNotas — api.json](https://docs.plugnotas.com.br/api.json): OpenAPI oficial para confirmar `nfse.config.nfseNacional`, `consultaNfseNacional` e schema de `prefeitura`.

---

## Nota de governanca do artefato

- Este arquivo nasce em `Draft`; as secoes de DoR, PO Gate, Dev Agent Record e QA Results sao templates de handoff e nao indicam execucao concluida.
- A story deve atualizar apenas a camada canonica P0. Ajustes em PRDs/specs/arquiteturas ativas ficam para a story 1.2.
- Qualquer mencao ao runtime legado deve aparecer como divergencia documentada, nunca como contrato oficial vigente.

---

## Criterios de aceite

- [ ] **AC-DOCPN-P0-01:** `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md` passa a registrar explicitamente que `nfse.nacional` e hipotese historica/shape legado e que o contrato oficial atual documenta `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional` (**FR-DOCPN-01**, **FR-DOCPN-02**, **DP-DOCPN-04**).
- [ ] **AC-DOCPN-P0-02:** `docs/architecture.md` deixa de apontar `nfse.nacional` como contrato canonico sem qualificador e passa a distinguir contrato oficial, politica local e implementacao atual (**FR-DOCPN-01**, **FR-DOCPN-05**, **CR-DOCPN-04**).
- [ ] **AC-DOCPN-P0-03:** `docs/operacao-mei-nfse.md` incorpora `/nfse/cidades/{codigoIbge}` como etapa canonica de triagem, incluindo leitura de `padraoNacional`, `login` e `senha` (**FR-DOCPN-03**, **FR-DOCPN-07**).
- [ ] **AC-DOCPN-P0-04:** `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` e `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` passam a diferenciar explicitamente schema oficial do fornecedor vs politica local do produto para credenciais municipais (**FR-DOCPN-04**, **FR-DOCPN-05**).
- [ ] **AC-DOCPN-P0-05:** Os artefatos P0 tocados expõem mapa curto de fontes canonicas ou bloco equivalente com `addCompany`, `getCidadeById`, `api.json`, o artefato canonico interno equivalente e uma linha de proposito por fonte, sem duplicar narrativa contraditoria (**FR-DOCPN-05**, **NFR-DOCPN-03**, **CR-DOCPN-01**).
- [ ] **AC-DOCPN-P0-06:** Os artefatos P0 tocados deixam explicito que migracao de runtime e backlog separado e nao efeito automatico desta iniciativa documental (**FR-DOCPN-08**, **DP-DOCPN-03**, **CR-DOCPN-04**).
- [ ] **AC-DOCPN-P0-07:** O historico anterior permanece auditavel por nota de contexto, change log ou marcador equivalente, sem reescrever o passado como se a referencia atual sempre tivesse existido (**NFR-DOCPN-02**, **NFR-DOCPN-05**, **DP-DOCPN-04**).

---

## Matriz de rastreabilidade (AC -> Tasks -> Evidencia)

| AC | Task principal | Evidencia esperada |
|---|---|---|
| **AC-DOCPN-P0-01** | 1 | ADR spike com secao de divergencia historica e contrato oficial atual |
| **AC-DOCPN-P0-02** | 2 | `docs/architecture.md` sem `nfse.nacional` como contrato oficial sem qualificador |
| **AC-DOCPN-P0-03** | 3 | Runbook com checklist de municipio e leitura `padraoNacional/login/senha` |
| **AC-DOCPN-P0-04** | 4 | Brief addCompany e ADR de payload com separacao "schema oficial" vs "politica local" |
| **AC-DOCPN-P0-05** | 5 | Blocos de fontes canonicas consistentes nos artefatos P0 tocados, com fonte interna equivalente e proposito por link |
| **AC-DOCPN-P0-06** | 5 | Menor numero de ambiguidades sobre runtime; backlog separado explicitado |
| **AC-DOCPN-P0-07** | 6 | Change log/notas de contexto preservando trilha historica |

---

## Dev Notes

### File Locations

- `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`
- `docs/architecture.md`
- `docs/operacao-mei-nfse.md`
- `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`
- `docs/stories/story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`

### Technical Constraints

- Nao migrar runtime nem alterar backend/frontend funcional nesta story.
- Nao introduzir promessa de suporte a credenciais municipais na UI ou no backend.
- Nao manter `nfse.nacional` descrito como contrato oficial sem marcador de divergencia ou historico.
- Reusar as referencias oficiais e a camada canonica interna; evitar duplicar definicoes concorrentes.
- Preservar change log e contexto dos artefatos antigos sempre que houver reclassificacao de historico.

### Testing

- Revisao manual dos links para `addCompany`, `getCidadeById`, `api.json` e para o artefato canonico interno equivalente de cada doc P0 tocada.
- `rg "nfse\\.nacional" docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md docs/architecture.md docs/operacao-mei-nfse.md docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` para validar uso qualificado do termo.
- Confirmar em leitura manual que `padraoNacional`, `login` e `senha` aparecem no runbook como triagem, nao como novo requisito de produto.
- Confirmar em leitura manual que o mapa de fontes da story e os blocos equivalentes dos artefatos P0 usam links por secao/ancora quando houver e incluem uma linha de proposito por fonte.
- Executar `npm run lint`, `npm run typecheck` e `npm test` antes do handoff, mesmo sendo diff documental, para respeitar os gates do repositorio.

---

## Tasks / Subtasks

1. [ ] Reclassificar o ADR spike NAT como historico controlado e registrar o contrato oficial atual no mesmo artefato (AC: **AC-DOCPN-P0-01**, **AC-DOCPN-P0-07**).
2. [ ] Atualizar `docs/architecture.md` para distinguir contrato oficial, politica local e implementacao atual (AC: **AC-DOCPN-P0-02**, **AC-DOCPN-P0-06**).
3. [ ] Atualizar `docs/operacao-mei-nfse.md` com a triagem canonica por municipio via `/nfse/cidades/{codigoIbge}` e campos `padraoNacional/login/senha` (AC: **AC-DOCPN-P0-03**, **AC-DOCPN-P0-05**).
4. [ ] Alinhar o brief addCompany e o ADR de payload apenas NFS-e ao contrato oficial e a politica local do produto (AC: **AC-DOCPN-P0-04**, **AC-DOCPN-P0-05**).
5. [ ] Revisar todos os artefatos P0 tocados para garantir mapa de fontes com links por secao/ancora, fonte interna equivalente, backlog runtime separado e ausencia de afirmacao canonica incorreta (AC: **AC-DOCPN-P0-05**, **AC-DOCPN-P0-06**).
6. [ ] Atualizar `File list`, `Dev Agent Record` e `QA Results` da story com os artefatos efetivamente alterados para handoff ao `@qa` (AC: **AC-DOCPN-P0-07**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] PRD, UX spec e arquitetura desta iniciativa foram lidos integralmente antes do inicio do diff.
- [ ] Os cinco artefatos P0 listados em `File Locations` foram inventariados e comparados com as referencias oficiais.
- [ ] A fronteira entre contrato oficial, politica local e implementacao atual esta clara para quem vai editar.
- [ ] A equipe confirma que esta story nao inclui migracao de runtime nem abertura de suporte a credenciais municipais.
- [ ] O responsavel ja mapeou as secoes onde sera necessario preservar historico, change log ou nota de contexto.

---

## Registro de Pronto para Review (PO Gate)

- [ ] Todos os ACs **AC-DOCPN-P0-01** a **AC-DOCPN-P0-07** foram validados com evidencia no diff final.
- [ ] Os artefatos P0 atualizados apontam para `addCompany`, `getCidadeById`, `api.json` e para o artefato canonico interno equivalente, com proposito por fonte e links por secao/ancora quando houver.
- [ ] Nenhum artefato P0 atualizado afirma `nfse.nacional` como contrato oficial sem qualificador explicito.
- [ ] O runbook atualizado inclui `/nfse/cidades/{codigoIbge}`, `padraoNacional`, `login` e `senha`.
- [ ] O diff deixa claro que migracao de runtime continua em backlog separado.
- [ ] `npm run lint`, `npm run typecheck` e `npm test` foram executados e registrados no `Dev Agent Record`.
- [ ] `Dev Agent Record` e `File list` foram atualizados para handoff de `@dev` para `@qa`.

---

## File list

- [ ] `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`
- [ ] `docs/architecture.md`
- [ ] `docs/operacao-mei-nfse.md`
- [ ] `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`
- [ ] `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`
- [ ] `docs/stories/story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Coerencia entre contrato oficial e docs canonicas P0.
- Separacao explicita entre politica local e implementacao atual.
- Triagem por municipio no runbook sem escorregar para promessa de runtime.

---

## Dev Agent Record

### Status

Draft

### File list

- Pendente

### Debug Log References

- Pendente

### Completion Notes

- Story criada para a camada canonica P0 do cluster FR-DOCPN.
- Nao iniciar migracao de runtime nem abrir subtarefa funcional fora dos artefatos listados.

### Change Log

- 2026-04-14 — Story criada por @sm a partir do PRD, UX spec e arquitetura da iniciativa de alinhamento documental do contrato oficial PlugNotas.
- 2026-04-14 — Story refinada por @sm para fechar gaps de rastreabilidade PRD, elevar o AC do mapa de fontes canonicas e usar navegacao por secao/ancora nos artefatos-fonte.

---

## QA Results

- Pendente.
