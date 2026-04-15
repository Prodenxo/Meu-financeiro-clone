# Story — FR-REC500 (P1): Operacao/QA — evidencia dirigida do preflight `5002704` por ambiente

**ID:** STORY-FR-REC500-P1-OPERACAO-QA-EVIDENCIA-PREFLIGHT-5002704-AMBIENTE-2026-04-14  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md)  
**Referencias canonicas (consulta, nao bloqueio de escopo):** [`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](../qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md), [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)  
**Handoff obrigatorio para:** [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) *(Epic 1 / decisao semantica)* — **paridade:** essa story ja declara esta em `Depende de`.  
**Fonte PRD:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — **FR-REC500-01**, **FR-REC500-02**, **FR-REC500-03**, **NFR-REC500-01**, **NFR-REC500-02**, **CR-REC500-03**  
**UX:** secao 4 (personas e superficies), secao 7.2 (REC500-UX-L1), secao 7.3 (REC500-UX-L2), secao 8.2 (regra de consumo), secao 12 (QA, operacao e runbook), secao 14 (criterios)  
**Arquitetura:** secao 4 (estado atual no codigo), secao 5 (visao de contexto), secao 6.1 (Epic 1), secao 11 (observabilidade, evidencia e redaction), secao 12.3 (QA documental), secao 13.1 (fase obrigatoria)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @qa |
| **quality_gate** | @po |
| **revisao** | @architect e @dev |
| **quality_gate_tools** | evidencia redigida, verificacao manual controlada, revisao documental e gates do repo conforme secao **Gates** desta story |

---

## User story

**Como** QA/operacao do fluxo fiscal da Guia MEI,  
**quero** capturar evidencia redigida do preflight do municipio `5002704` em `producao` e `homologacao`,  
**para** fechar a base factual do caso antes de qualquer decisao de produto sobre excecao controlada ou backlog fase 2 municipal.

---

## Contexto

- O PRD exige que `5002704` deixe de ser tratado como ruido operacional e passe a ter evidencia auditavel por ambiente.
- A arquitetura atual ja executa `GET /nfse/cidades/{codigoIbge}` no BFF antes do cadastro da empresa; esta story nao muda o runtime, apenas documenta o comportamento observado.
- A UX spec pede que a descoberta dirigida exista nas superficies internas sem prometer mudanca ao utilizador final.
- O resultado desta story e entrada obrigatoria para a validacao semantica em [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md).

### Nota de escopo (PO)

- O **deliverable** desta story e o **artefato de evidencia** em `docs/qa/` (preflight por ambiente).
- O **alinhamento completo** da matriz RTCAD e do runbook ao resultado final do caso fica na story [`story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md), normalmente **apos** a decisao formal da story de produto acima.

---

## Critérios de aceite

### Evidência por ambiente

- [ ] **AC-REC500-EV-01:** Existe artefato dedicado com evidencia redigida do preflight `5002704` em `producao`.
Critério de encerramento: o artefato registra, no minimo, `codigoIbge`, ambiente, `padraoNacionalEnabled`, `requiresLogin` e `requiresSenha` **como retorno normalizado do preflight** (`GET /nfse/cidades/5002704` via caminho suportado pela operacao), sem expor segredo nem payload bruto sensivel.
Critério adicional opcional: quando existir correlacao segura com o fluxo de cadastro, o artefato pode incluir `consultedMunicipio` e `upstreamCallSkipped` **a partir de** `errors.runtimeDecision` (resposta BFF), para amarrar preflight a classificacao estavel; estes campos **nao** substituem os booleans do preflight.
- [ ] **AC-REC500-EV-02:** Existe evidencia comparavel em `homologacao` ou justificativa formal de impossibilidade.
Critério de encerramento: o artefato indica claramente se a consulta em `homologacao` foi executada com sucesso ou se houve impedimento operacional/tecnico documentado, com data e responsavel.
- [ ] **AC-REC500-EV-03:** A comparacao entre ambientes e explicitada.
Critério de encerramento: o artefato conclui se `5002704` se comporta de forma equivalente, divergente ou inconclusiva entre `producao` e `homologacao`, sem inventar semantica de produto.

### Redaction e rastreabilidade

- [ ] **AC-REC500-EV-04:** A evidencia final e auditavel e segura.
Critério de encerramento: ha data, responsavel, ambiente, origem da evidencia e checklist de redaction, sem token, certificado, credencial municipal ou corpo bruto sensivel.
- [ ] **AC-REC500-EV-05:** O resultado fica pronto para handoff da story de decisao semantica.
Critério de encerramento: a conclusao do artefato deixa explicitado o input para [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) como `correcao controlada em avaliacao`, `indicio de fase 2 municipal` ou `inconclusivo`, sem fechar a decisao final nesta story.

### Gates

- [ ] **AC-REC500-EV-06:** Se o diff final desta story for **apenas** sob `docs/**`, registar nos `Debug Log References` que `npm run lint`, `npm run typecheck` e `npm test` sao **N/A** para esta entrega documental, com justificativa de ausencia de alteracao de codigo **ou** executar os tres comandos na raiz por disciplina unica da equipa e anexar a saida.
- [ ] **AC-REC500-EV-07:** Se existir alteracao fora de `docs/**`, executar obrigatoriamente `npm run lint`, `npm run typecheck` e `npm test` na raiz e anexar a saida.

---

## Matriz de rastreabilidade (AC -> Tasks)

| AC | Task principal |
|---|---|
| **AC-REC500-EV-01** | 1, 2 |
| **AC-REC500-EV-02** | 3 |
| **AC-REC500-EV-03** | 4 |
| **AC-REC500-EV-04** | 1 *(checklist no artefato)* |
| **AC-REC500-EV-05** | 4 |
| **AC-REC500-EV-06** | 5 |
| **AC-REC500-EV-07** | 5 |

---

## Dev Notes

### File Locations

- `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md` *(artefato principal desta story)*
- `docs/stories/story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`
- Consulta opcional para triagem: `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`, `docs/operacao-mei-nfse.md` *(nao exigir diff nesta story salvo decisao explicita de correcao pontual de link ou nota de leitura)*

### Technical Constraints

- Nao alterar o comportamento do BFF nesta story.
- Nao concluir `correcao controlada` sem [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md).
- Nao usar a UI como fonte unica de evidencia; quando houver metadado de backend ou log controlado, ele deve prevalecer.
- Nao expor tokens, certificados, credenciais municipais ou payloads brutos sensiveis.

### Testing

- Conferir o comportamento observado contra o PRD, a UX spec e a arquitetura.
- Validar se os campos minimos de evidencia do preflight estao completos e redigidos.
- Confirmar se a classificacao observada em `producao` corresponde ao caso recorrente conhecido.
- Se houver evidencia de `homologacao`, comparar explicitamente com `producao`.

### Template minimo do artefato `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md` (obrigatorio)

Copiar para o ficheiro e preencher; nao colar payloads brutos nem segredos.

```md
# Evidencia REC500 — preflight IBGE 5002704 por ambiente

- Data da execucao:
- Responsavel:
- Story ID: STORY-FR-REC500-P1-OPERACAO-QA-EVIDENCIA-PREFLIGHT-5002704-AMBIENTE-2026-04-14
- Origem da evidencia (ex.: consulta suportada pela operacao ao preflight PlugNotas; correlacao BFF opcional):

## Producao — preflight normalizado
- codigoIbge:
- ambiente: producao
- padraoNacionalEnabled:
- requiresLogin:
- requiresSenha:

## Homologacao — preflight normalizado ou impossibilidade
- Estado: executado | impedimento documentado
- Se executado: repetir os campos minimos acima para homologacao
- Se impedimento: motivo, data, responsavel

## Comparacao producao vs homologacao
- Resultado: equivalente | divergente | inconclusivo
- Notas (sem semantica de produto inventada):

## Correlacao opcional (BFF)
- consultedMunicipio (se aplicavel):
- upstreamCallSkipped (se aplicavel):
- Fonte: errors.runtimeDecision em resposta BFF (sem payload bruto)

## Redaction
- [ ] Sem token PlugNotas, certificado, credenciais municipais ou payload sensivel em claro

## Input para story de decisao semantica (nao decisao final)
- classificacao preliminar: correcao controlada em avaliacao | indicio de fase 2 municipal | inconclusivo
```

---

## Tasks / Subtasks

1. [x] Criar o artefato dedicado de evidencia para `5002704` por ambiente (AC: **AC-REC500-EV-01**, **AC-REC500-EV-04**).
2. [x] Consolidar a evidencia redigida de `producao` com os campos minimos do preflight (AC: **AC-REC500-EV-01**).
3. [x] Capturar a evidencia comparavel de `homologacao` ou registrar impossibilidade auditavel (AC: **AC-REC500-EV-02**).
4. [x] Comparar os dois ambientes e registrar o resultado como base factual para [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) (AC: **AC-REC500-EV-03**, **AC-REC500-EV-05**).
5. [x] Atualizar esta story com `File list`, notas finais e registro dos gates conforme secao **Gates** (AC: **AC-REC500-EV-06**, **AC-REC500-EV-07**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] PRD, UX spec e arquitetura de `REC500` lidos antes da coleta.
- [ ] Forma de redaction e dono da evidencia definidos antes da execucao.
- [ ] Ambiente `producao` identificado e acessivel para coleta redigida.
- [ ] Ambiente `homologacao` disponivel ou bloqueio operacional previamente conhecido.
- [ ] Caminho do artefato de QA reservado.

---

## Registro de Pronto para Review (PO Gate)

- [ ] **AC-REC500-EV-01** a **AC-REC500-EV-05** satisfeitos no artefato de evidencia.
- [ ] Evidencia de `producao` consolidada e redigida.
- [ ] Evidencia de `homologacao` consolidada ou impossibilidade registrada.
- [ ] Comparacao entre ambientes explicitada.
- [ ] Input para [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) documentado sem fechar decisao fora de escopo.
- [ ] `Dev Agent Record` e `File list` atualizados.
- [ ] **AC-REC500-EV-06** / **AC-REC500-EV-07** tratados conforme secao **Gates** (N/A com justificativa ou execucao completa).

---

## File list

- [x] `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`
- [x] `docs/qa/rec500-preflight-5002704-npm-gates-resumo-2026-04-15.md`
- [x] `docs/stories/story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`
- [ ] *(opcional)* `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md` — apenas leitura ou ajuste pontual acordado; alinhamento completo fica na story [`story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md)
- [ ] *(opcional)* `docs/operacao-mei-nfse.md` — mesmo criterio acima

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Completude e redaction da evidencia por ambiente.
- Coerencia entre preflight observado e classificacao operacional atual.
- Prontidao do handoff para a decisao de produto.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md` — artefato de evidencia (preflight `5002704`; **producao** com rastreio primario via `consultarCidadePlugNotas`; homologacao com impedimento auditavel).
- `docs/qa/rec500-preflight-5002704-npm-gates-resumo-2026-04-15.md` — sumario redigido dos gates npm (recomendacao QA).
- `docs/stories/story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md` — esta story (registo dev).

### Debug Log References

- **Gates (AC-REC500-EV-06 / EV-07):** Diff limitado a `docs/**` — EV-06 com N/A documental; execucao na raiz `npm run lint` (exit 0), `npm run typecheck` (exit 0), `npm test` (exit 0; 351 testes). Sumario versionado em `docs/qa/rec500-preflight-5002704-npm-gates-resumo-2026-04-15.md` (pos-correcao QA).
- **Producao / rastreio primario:** `consultarCidadePlugNotas({ codigoIbge: '5002704', environment: 'producao' })` executado com `backend/.env` em 2026-04-15 — output normalizado registado no artefato principal (sem payload bruto).
- **Homologacao:** evidencia HTTP direta ainda nao recolhida — ver secao «Homologacao» no artefato `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`.

### Completion Notes

- Story criada por `@sm` para fechar a base factual do caso recorrente `5002704` antes de qualquer correcao de runtime.
- Esta story e obrigatoria no `Epic 1` e nao autoriza, por si so, excecao controlada.
- Artefato `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md` criado com template minimo; producao alinhada ao PRD canónico; homologacao registada como impedimento ate coleta operacional.
- **Pos-revisao QA (2026-04-15):** secao de **rastreio primario** adicionada com execucao real de `consultarCidadePlugNotas` (mesmo codigo do BFF); valores coincidem com PRD §5.1. Anexo `docs/qa/rec500-preflight-5002704-npm-gates-resumo-2026-04-15.md` para gates npm. A secao **QA Results** deve ser **revalidada pelo @qa** (nao editada pelo dev).
- Handoff para [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) com classificacao preliminar **correcao controlada em avaliacao** (sem decisao final nesta story).

### Change Log

- 2026-04-14 — Story criada por `@sm` a partir do PRD, da spec de UX e da arquitetura de `REC500`.
- 2026-04-14 — Refinamento PO/SM: handoff explicito para a story de decisao semantica, clarificacao de fontes preflight vs `runtimeDecision`, escopo de matriz/runbook (opcional vs story 1.3) e gates N/A para entrega so em `docs/`.
- 2026-04-14 — Refinamento PO/SM: IDs de AC (`AC-REC500-EV-01` a `07`), matriz AC->Tasks, template minimo do artefato em `Dev Notes` e nota de paridade com a story de produto.
- 2026-04-15 — Implementacao dev: artefato de QA em `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`; gates documentados; status Ready for Review.
- 2026-04-15 — Correcao pos-QA: rastreio primario `consultarCidadePlugNotas` + `docs/qa/rec500-preflight-5002704-npm-gates-resumo-2026-04-15.md`; pedido de re-revisao `@qa`.

---

## QA Results

### Revisao (Quinn / aiox-qa) — 2026-04-15

**Decisao de gate (advisory):** **CONCERNS** — entrega utilizavel para handoff documental e alinhada ao PRD; permanecem gaps de rastreabilidade «primaria» face ao texto literal dos AC (ver abaixo). Equipa/PO define se exige fecho adicional antes de merge ou se aceita com accoes de follow-up.

---

#### Rastreio por criterio de aceite

| AC | Avaliacao | Notas |
|----|-----------|--------|
| **AC-REC500-EV-01** | **CONCERNS** | O artefato `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md` regista os cinco campos normalizados para `producao` e declara alinhamento com `GET /nfse/cidades/5002704` + BFF. A **fonte** citada e o PRD §5.1 (*Achados do caso real*), nao uma captura HTTP PlugNotas redigida na mesma sessao nem log de operacao versionado. Isto e coerente com metadados de backend (Dev Notes: nao usar UI como fonte unica), mas o AC pede explicitamente o preflight «via caminho suportado pela operacao» — recomenda-se **confirmacao operacional** (uma linha com data + responsavel + metodo: ex. chamada suportada ao endpoint com base/cofre de producao) ou anexo redigido em `docs/qa/` se a barra for primaria. |
| **AC-REC500-EV-02** | **PASS** | Impedimento em `homologacao` documentado com motivo, data e responsavel pelo registo. |
| **AC-REC500-EV-03** | **PASS** | Comparacao explicita como **inconclusivo** (adequado sem preflight de homologacao). |
| **AC-REC500-EV-04** | **PASS** | Data, responsavel, ambiente, origem da evidencia, checklist de redaction; sem payload bruto. |
| **AC-REC500-EV-05** | **PASS** | Input preliminar **correcao controlada em avaliacao** + ponteiro para a story de decisao semantica, sem decisao final. |
| **AC-REC500-EV-06** | **PASS** | Diff apenas `docs/**`: justificativa N/A + registo de execucao dos tres comandos no `Dev Agent Record` (abordagem mista aceite pela redaccao do AC). |
| **AC-REC500-EV-07** | **N/A** | Sem alteracao fora de `docs/**`. |

#### Correlacao opcional (BFF)

- **PASS:** `consultedMunicipio` / `upstreamCallSkipped` presentes com fonte PRD §5.1 e nota de nomenclatura `consulted` vs cliente — coerente com o criterio opcional.

#### NFR / seguranca (amostragem documental)

- **PASS:** Sem tokens, chaves ou corpos sensiveis no artefato; referencias a ficheiros e codigo apenas.

#### Riscos residuais

1. **Risco medio:** Decisao de produto ou auditoria externa pode exigir evidencia HTTP de `producao` **independente** do PRD (mesmo valores). Mitigacao: uma execucao operacional e atualizacao minima do artefato.
2. **Risco baixo:** Homologacao em aberto — a story seguinte de decisao semantica deve assinalar dependencia de homologacao ou aceitar inconclusivo ate nova coleta.

#### Recomendacoes (nao bloqueantes)

1. **Operacao/QA:** Executar `GET /nfse/cidades/5002704` em homologacao quando possivel; atualizar tabela e rever **inconclusivo** → equivalente/divergente.
2. **Opcional:** Anexar sumario **redigido** (1–2 linhas) de `npm run lint` / `typecheck` / `test` em `docs/qa/` ou artefato de build se a equipa exigir prova fora do registo do agente.

#### Pronto para PO Gate

- O **Registro de Pronto para Review (PO Gate)** na story permanece por validar pelo **@po** (checklist formal); esta revisao QA **nao** substitui o quality gate PO.

---

**Assinatura:** Quinn (Test Architect) — revisao documental e de rastreio; sem alteracao de codigo em escopo.
