# Story — FR-DOCPN (P1): Governanca de historico e manutencao continua — contrato oficial PlugNotas

**ID:** STORY-FR-DOCPN-P1-GOVERNANCA-HISTORICO-MANUTENCAO-CONTINUA-CONTRATO-OFICIAL-PLUGNOTAS-CADASTRO-EMPRESA-2026-04-14  
**Prioridade:** P1  
**Status:** Draft  
**Depende de:** [`docs/stories/story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](./story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/stories/story-fr-docpn-p1-artefatos-ativos-plogin-addcompany-contrato-oficial-2026-04-14.md`](./story-fr-docpn-p1-artefatos-ativos-plogin-addcompany-contrato-oficial-2026-04-14.md), [`docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md), [`docs/technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md)  
**Fonte PRD:** [`docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md) — **FR-DOCPN-06**, **FR-DOCPN-08**, **NFR-DOCPN-02**, **NFR-DOCPN-03**, **NFR-DOCPN-05**, **CR-DOCPN-02**, **CR-DOCPN-03**, **CR-DOCPN-04**, **DP-DOCPN-03**, **DP-DOCPN-04**  
**UX:** secoes 3 (principios), 7.3 (fluxo C - historico), 8.1 a 8.3 (conteudo e copy), 9.1 (blocos obrigatorios), 10.3 (superficies P2), 12 (mapeamento PRD -> UX), 13 (criterios)  
**Arquitetura:** secoes 3.2 (canonico -> historico), 5.3 (artefatos P2), 6.4 (padrao historico), 7.1 (ordem de atualizacao), 10 (observabilidade documental), 11.1/11.2 (validacoes), 13.3 (regra), 14 (criterios arquiteturais)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisao** | @po e @architect |
| **quality_gate_tools** | inventario com `rg`, revisao documental manual, validacao de links e gates do repo (`npm run lint`, `npm run typecheck`, `npm test`) |

---

## User story

**Como** mantenedor do repositorio e da governanca documental PlugNotas,  
**quero** marcar corretamente os artefatos historicos e definir a manutencao continua apos a atualizacao do contrato oficial,  
**para** preservar auditoria, evitar reuso indevido da hipotese antiga e manter backlog de runtime separado da iniciativa docs-first.

---

## Contexto

- O PRD define esta story como o terceiro bloco do Epic 1, focado em historico e manutencao continua.
- A UX spec exige que um leitor que caia em artefato historico receba contexto e link direto para a referencia vigente.
- A arquitetura formaliza um padrao `Historico` para artefatos antigos ainda relevantes e exige observabilidade documental da divergencia.
- O repositorio ja possui artefatos fechados e evidencias que citam `nfse.nacional` ou `prefeitura.login` sob premissas anteriores; eles precisam continuar auditaveis sem parecer fonte vigente.

---

<a id="story-docpn-13-mapa-fontes"></a>
## Mapa de fontes canonicas

- [PRD — escopo](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-escopo), [requisitos funcionais](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-requisitos), [criterios de aceite](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-criterios), [riscos e mitigacao](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-riscos) e [Story 1.3](../prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#prd-docpn-story-13): definem o tratamento de historico, os gates de rastreabilidade e a origem desta story.
- [UX — fluxo C para artefato historico](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-fluxo-historico), [copy-modelo de historico](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-copy-historico), [blocos obrigatorios](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-blocos-obrigatorios) e [superficies P2](../specs/ux-spec-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#ux-docpn-superficies-p2): orientam contexto, posicionamento visual e o universo minimo de artefatos historicos a revisar.
- [Arquitetura — artefatos P2](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-artefatos-p2), [padrao historico](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-historico), [observabilidade documental](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-observabilidade), [testabilidade](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-testabilidade) e [regra do backlog tecnico](../technical/architecture-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#arch-docpn-regra-backlog): fixam o padrao arquitetural de contexto historico e a separacao da migracao de runtime.
- [Story 1.1 — mapa da camada canonica P0](./story-fr-docpn-p1-docs-canonicas-p0-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md#story-docpn-11-mapa-fontes): referencia interna vigente para contrato, runbook e divergencia canonica.
- [Story 1.2 — mapa da camada ativa P1](./story-fr-docpn-p1-artefatos-ativos-plogin-addcompany-contrato-oficial-2026-04-14.md#story-docpn-12-mapa-fontes): referencia interna vigente para PRD/spec/arquitetura ativos do cluster PLOGIN/addCompany.
- [PlugNotas — addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany): fonte oficial para reclassificar docs antigas que assumiam outro shape como canonico.
- [PlugNotas — getCidadeById](https://docs.plugnotas.com.br/#operation/getCidadeById): referencia oficial para explicar por que a triagem moderna nao depende apenas do texto do erro.
- [PlugNotas — api.json](https://docs.plugnotas.com.br/api.json): fonte oficial para requalificar historico que ainda cite `nfse.nacional` como contrato.

---

## Inventario inicial do recorte

### Cobertura minima obrigatoria do P2

- `docs/evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`
- `docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`
- Stories fechadas do cluster PlugNotas/addCompany/prefeitura que ainda sejam usadas como referencia historica e forem identificadas por `rg`.
- Briefs antigos do cluster PlugNotas/addCompany que continuarem consultados apos a atualizacao vigente e forem identificados por `rg`.

### Candidatos adicionais da varredura objetiva

- `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`
- `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- `docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md`
- Artefatos adicionais identificados por `rg` que ainda tratem `nfse.nacional` como contrato oficial vigente ou que reutilizem historico sem marcador.

### Pontos canonicos de verificacao sem diff obrigatorio

- `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`
- `docs/operacao-mei-nfse.md`

---

## Nota de governanca do artefato

- Esta story nao exige reclassificacao retroativa de incidentes encerrados; ela exige contexto suficiente para que eles nao sejam relidos como fonte vigente.
- O inventario inicial acima e ponto de partida; o escopo final da implementacao deve ser confirmado via `rg` no repo durante a execucao, preservando a cobertura minima obrigatoria de `stories`, `evidencias` e `briefs`, e tratando `docs/qa`, `docs/specs` ou outras categorias apenas como adicionais quando a varredura objetiva justificar.
- Para esta story, entra no diff o artefato que apareca no inventario inicial ou na varredura objetiva com `rg`, ainda possa ser relido como referencia do cluster PlugNotas/addCompany/prefeitura e ainda nao esteja claramente marcado como historico com ponte para a referencia vigente.
- Um artefato encontrado apenas em change log, lista de arquivos ou contexto ja corretamente marcado pode ficar sem diff, desde que a exclusao e seu motivo fiquem registrados no `Dev Agent Record`.
- Arquivos em `docs/qa` entram como artefatos adicionais apenas quando a varredura objetiva indicar que continuam funcionando como referencia historica; eles nao substituem a cobertura minima obrigatoria de `stories`, `evidencias` e `briefs` derivada do P2 canonico.
- `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` sao pontos canonicos de verificacao desta story: entram no diff apenas se precisarem de ajuste para deixar explicita, ou preservar explicita, a separacao entre iniciativa documental e backlog runtime; caso contrario, a verificacao sem diff deve ser registrada no `Dev Agent Record`.
- Toda manutencao continua desta iniciativa deve preservar change log e apontar para a camada canonica/ativa atual.

---

## Criterios de aceite

- [ ] **AC-DOCPN-HIS-01:** Artefatos historicos relevantes que permanecerem em uso recebem nota de contexto, marcador `historico` ou bloco equivalente quando citarem `nfse.nacional` como contrato ou premissas superadas (**FR-DOCPN-06**, **CR-DOCPN-03**).
- [ ] **AC-DOCPN-HIS-02:** Cada artefato historico contextualizado aponta para a referencia vigente correspondente na camada canonica ou ativa, sem apagar o registro original (**NFR-DOCPN-02**, **NFR-DOCPN-05**).
- [ ] **AC-DOCPN-HIS-03:** `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` deixam explicito, ou preservam explicito, que migracao de runtime segue backlog tecnico separado e nao deve ser inferida a partir da atualizacao documental (**FR-DOCPN-08**, **CR-DOCPN-04**).
- [ ] **AC-DOCPN-HIS-04:** O inventario final dos artefatos historicos tocados fica auditavel em `File list`, `Dev Agent Record` e change log da story, com criterio claro de inclusao/exclusao, cobrindo explicitamente as categorias minimas `stories`, `evidencias` e `briefs`, e registrando `docs/qa` ou outras categorias apenas quando entrarem como artefatos adicionais da varredura objetiva (**NFR-DOCPN-02**, **NFR-DOCPN-03**).
- [ ] **AC-DOCPN-HIS-05:** Nenhum artefato historico revisado e reescrito como se a referencia oficial atual sempre tivesse sido conhecida; a trilha de decisao anterior permanece preservada (**DP-DOCPN-04**, **NFR-DOCPN-05**, **CR-DOCPN-02**).

---

## Matriz de rastreabilidade (AC -> Tasks -> Evidencia)

| AC | Task principal | Evidencia esperada |
|---|---|---|
| **AC-DOCPN-HIS-01** | 1 | Artefatos historicos revisados com marcador/nota de contexto |
| **AC-DOCPN-HIS-02** | 2 | Links das docs historicas para referencia canonica/ativa vigente |
| **AC-DOCPN-HIS-03** | 3 | Registro explicito em `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` de backlog runtime separado |
| **AC-DOCPN-HIS-04** | 4 | Inventario final auditavel em `File list` e `Dev Agent Record`, com categorias minimas, criterio de inclusao/exclusao e registro de categorias adicionais quando existirem |
| **AC-DOCPN-HIS-05** | 5 | Change logs e contexto historico preservados sem reescrita enganosa |

---

## Dev Notes

### File Locations

#### Artefatos historicos candidatos

- `docs/evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`
- `docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`
- `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`
- `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- `docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md`
- Outros artefatos identificados via `rg` durante a execucao

#### Pontos canonicos de verificacao

- `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`
- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-docpn-p1-governanca-historico-manutencao-continua-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`

### Technical Constraints

- Nao apagar historico nem substituir evidencias antigas por versoes reescritas.
- Nao converter esta story em mutirao de atualizacao de todo o repositorio sem criterio; usar inventario objetivo com `rg`.
- Nao acoplar manutencao do historico a mudancas de runtime.
- Sempre apontar artefatos historicos para referencia vigente correspondente quando eles ainda forem consultados.
- Um artefato entra no diff quando ainda puder ser relido como referencia do cluster e nao estiver claramente marcado como historico com ponte para a referencia vigente.
- Um artefato encontrado apenas em listas de arquivos, change logs ou contexto ja corretamente qualificado pode ficar sem diff, desde que a justificativa apareca no `Dev Agent Record`.
- O inventario final deve declarar se houve ou nao artefatos historicos nas categorias `stories`, `evidencias` e `briefs`, evitando varredura parcial do P2.
- `docs/qa` nao compoe a categoria minima obrigatoria do P2; quando entrar no recorte final, deve ser registrado como artefato adicional identificado pela varredura objetiva.

### Testing

- Executar inventario objetivo com `rg "nfse\\.nacional|nfseNacional|consultaNfseNacional|prefeitura\\.login|/nfse/cidades/\\{codigoIbge\\}" docs`.
- Revisar manualmente cada artefato historico tocado para garantir que o marcador nao destrua o contexto original.
- Verificar links internos adicionados a partir de notas de historico para a referencia vigente.
- Confirmar em leitura manual que `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` mantem explicita a separacao entre iniciativa documental e backlog runtime.
- Confirmar em leitura manual que a varredura P2 contemplou `stories`, `evidencias` e `briefs` historicos, mesmo quando alguma categoria terminar sem diff.
- Se `docs/qa` entrar no recorte final, registrar em leitura manual e no handoff que se trata de categoria adicional, nao de cobertura minima obrigatoria do P2.
- Executar `npm run lint`, `npm run typecheck` e `npm test` antes do handoff.

---

## Tasks / Subtasks

1. [ ] Inventariar artefatos historicos relevantes via `rg` e confirmar o subconjunto real que ainda precisa de marcador/contexto, cobrindo no minimo `stories`, `evidencias` e `briefs`, com criterio explicito de inclusao/exclusao para o que ainda pode ser relido como referencia do cluster (AC: **AC-DOCPN-HIS-01**, **AC-DOCPN-HIS-04**).
2. [ ] Adicionar nota de historico ou bloco de contexto nos artefatos selecionados, com link para a referencia vigente correspondente (AC: **AC-DOCPN-HIS-01**, **AC-DOCPN-HIS-02**).
3. [ ] Garantir que `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` deixem, ou mantenham, explicita a separacao entre manutencao documental e backlog runtime (AC: **AC-DOCPN-HIS-03**).
4. [ ] Registrar o inventario final, os arquivos efetivamente tocados e o criterio usado no `Dev Agent Record` e na `File list`, incluindo as categorias minimas revisadas, as que ficaram sem diff e `docs/qa` ou outras categorias apenas quando entrarem como artefatos adicionais (AC: **AC-DOCPN-HIS-04**).
5. [ ] Revisar change logs/notas de contexto para preservar a trilha historica sem reescrita enganosa (AC: **AC-DOCPN-HIS-05**).
6. [ ] Atualizar `QA Results` da story para handoff ao `@qa` com a lista final de artefatos historicos revisados (AC: **AC-DOCPN-HIS-01** a **AC-DOCPN-HIS-05**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] As stories 1.1 e 1.2 foram concluidas e aprovadas como referencia vigente antes do inicio da varredura historica.
- [ ] O inventario inicial de candidatos historicos foi confirmado com `rg` antes de qualquer edicao.
- [ ] O responsavel entende quais artefatos sao historicos, quais continuam ativos e quais ja sao canonicos.
- [ ] `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` foram definidos como pontos canonicos a verificar/manter para backlog runtime separado.
- [ ] O criterio de contexto historico e o criterio de inclusao/exclusao do inventario foram definidos antes da edicao para evitar notas inconsistentes e varredura sem recorte.
- [ ] A equipe confirma que esta story nao exige reabrir incidents/stories encerrados nem mudar runtime.

---

## Registro de Pronto para Review (PO Gate)

- [ ] Todos os ACs **AC-DOCPN-HIS-01** a **AC-DOCPN-HIS-05** foram validados com evidencia.
- [ ] O inventario final dos artefatos historicos tocados esta documentado no `Dev Agent Record`, com cobertura explicita das categorias `stories`, `evidencias` e `briefs`, e com `docs/qa` ou outras categorias registradas apenas quando tiverem entrado como adicionais.
- [ ] Cada artefato historico revisado aponta para a referencia vigente correspondente.
- [ ] O historico original foi preservado e continua auditavel apos a contextualizacao.
- [ ] `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` continuam explicitando a separacao entre iniciativa documental e backlog runtime.
- [ ] `npm run lint`, `npm run typecheck` e `npm test` foram executados e registrados no `Dev Agent Record`.
- [ ] `Dev Agent Record` e `File list` foram atualizados para handoff de `@dev` para `@qa`.

---

## File list

- [ ] `docs/evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`
- [ ] `docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`
- [ ] `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md` (somente se confirmado como artefato historico ainda consultado)
- [ ] `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md` (somente se confirmado como artefato historico ainda consultado)
- [ ] `docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md` (somente se confirmado como artefato historico ainda consultado)
- [ ] `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` (somente se precisar de ajuste para manter explicita a separacao docs x backlog runtime; sem diff, registrar verificacao no `Dev Agent Record`)
- [ ] `docs/operacao-mei-nfse.md` (somente se precisar de ajuste para manter explicita a separacao docs x backlog runtime; sem diff, registrar verificacao no `Dev Agent Record`)
- [ ] `docs/stories/*.md` historicas do cluster PlugNotas/addCompany/prefeitura identificadas via `rg`
- [ ] `docs/brief/*.md` historicos do cluster PlugNotas/addCompany identificados via `rg`
- [ ] Outros artefatos adicionais identificados via `rg` durante a execucao
- [ ] `docs/stories/story-fr-docpn-p1-governanca-historico-manutencao-continua-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Qualidade dos marcadores de historico e dos links para referencia vigente.
- Preservacao do contexto original dos artefatos fechados.
- Separacao clara entre governanca documental e backlog runtime.

---

## Dev Agent Record

### Status

Draft

### File list

- Pendente

### Debug Log References

- Pendente

### Completion Notes

- Story criada para governanca do historico e manutencao continua do cluster DOCPN.
- O inventario final de arquivos deve ser derivado do `rg` executado na implementacao, nao presumido, e declarar cobertura minima de `stories`, `evidencias` e `briefs`.
- `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` sao os pontos canonicos fixados para verificar/manter a separacao entre docs e backlog runtime.
- Artefatos em `docs/qa` entram apenas como adicionais quando a varredura objetiva mostrar que ainda funcionam como referencia historica do cluster.
- `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` nao exigem diff obrigatorio; se nao houver ajuste, a verificacao precisa ficar registrada no `Dev Agent Record`.

### Change Log

- 2026-04-14 — Story criada por @sm a partir do PRD, UX spec e arquitetura da iniciativa DOCPN.
- 2026-04-14 — Story refinada por @sm para endurecer o sequenciamento com as stories 1.1/1.2, completar a rastreabilidade do PRD e explicitar a varredura P2 minima de `stories`, `evidencias` e `briefs` com navegacao por ancora.
- 2026-04-14 — Story refinada por @sm para fixar `docs/prd/PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md` e `docs/operacao-mei-nfse.md` como pontos canonicos do backlog runtime separado, explicitar criterio operacional de inclusao/exclusao do inventario e tratar `docs/qa` como categoria adicional, nao minima obrigatoria do P2.
- 2026-04-14 — Story refinada por @sm para separar inventario inicial entre cobertura minima P2, categorias adicionais e pontos canonicos de verificacao sem diff obrigatorio, alinhando o `File list` ao gate final do PO.

---

## QA Results

- Pendente.
