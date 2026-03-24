# Épico: NFS-e Nacional — default ON no cadastro Plugnotas (Guia MEI / admin)

## Metadados

| Campo | Valor |
| --- | --- |
| **PRD** | [`docs/prd/PRD-nfse-nacional-default-cadastro-plugnotas.md`](../prd/PRD-nfse-nacional-default-cadastro-plugnotas.md) |
| **Brief** | [`docs/brief/brief-nfse-nacional-default-cadastro.md`](../brief/brief-nfse-nacional-default-cadastro.md) |
| **Arquitetura** | [`docs/architecture.md`](../architecture.md) — **ADR-07** / [`ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md): fronteira backend `backend/src/services/plugnotas/empresa.service.js`; payload espelhado em `frontend/src/utils/nfEmissionCompany.ts`; política MEI em `plugnotas-mei-empresa-policy.js` |
| **Sobreposição** | Complementa [`epic-guia-mei-apenas-nfse-prd.md`](epic-guia-mei-apenas-nfse-prd.md) (escopo apenas NFS-e); **não** reativa `nfe`/`nfce` |
| **Prioridade sugerida** | P1 Must: **NAT-01 → NAT-02**; P2 Should: **NAT-03**; Could: **NAT-04**, **NAT-05** |
| **Owner épico** | Produto (@pm) |
| **Execução** | @dev; **bloqueio:** conclusão de **US-MEI-NAT-01** (spike) antes de alterar payload em **NAT-02**; gate @architect se o campo alterar contrato documentado; @qa; push/PR @github-devops |

## Objetivo do épico

Garantir que o cadastro de empresa enviado pelo app ao Plugnotas deixe **NFS-e Nacional ativa por padrão** (paridade com o toggle do painel Plugnotas), preservando o modo **apenas NFS-e** (ADR-07) e documentando exceções operacionais.

## Mapa técnico (handoff)

| Camada | Artefatos relevantes |
| --- | --- |
| Spike / ADR | Documentação Plugnotas (Empresa / NFSe); ADR de spike [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) (US-MEI-NAT-01) + seção em `operacao-mei-nfse.md` (`#plugnotas-nfse-nacional-spike-nat01`); evolução futura do contrato no mesmo ADR ou ADR dedicado após confirmação do campo |
| Frontend | `nfEmissionCompany.ts`, `nfEmissionCompany.test.ts`; opcionalmente `GuidesMei.tsx` / `AdminUserData.tsx` se **NAT-05** |
| Backend | `empresa.service.js` (`applyEmpresaPlugnotasApenasNfseForPost` / `ForPatch`, `cadastrarEmpresaPlugNotas`, `atualizarEmpresaPlugNotas`); `plugnotas-empresa.test.js` |
| Doc | `docs/operacao-mei-nfse.md`; referência cruzada em `architecture.md` se @architect aprovar linha em ADR-07 ou ADR dedicado |

## Ordem sugerida no sprint

1. **US-MEI-NAT-01** — Spike: contrato API “NFS-e Nacional” (**FR-NA01**); decisão **FR-NA02** se API não expuser (**bloqueante**).
2. **US-MEI-NAT-02** — Payload default ON + regra **POST vs PATCH** (**D-N03**, **FR-NA03**) + testes (**FR-N01**, **FR-N03**, **NFR-N01**).
3. **US-MEI-NAT-03** — Documentação operacional + evidência de verificação (**FR-N02**, **FR-N04**, **NFR-N04**).
4. **US-MEI-NAT-04** *(Could)* — Melhoria de copy/UX em erros relacionados à nacional (**FR-N05**).
5. **US-MEI-NAT-05** *(Could)* — Checkbox na Guia MEI para opt-out explícito (**D-N04**), se API e @po aprovarem.

## Definição de pronto (épico)

- [ ] Spike **NAT-01** concluído com **campo API nomeado no ADR** (pós-confirmação oficial/sandbox) **ou** decisão @po documentada de **encerrar épico** / **não implementar** payload (**FR-NA02**).
- [ ] Se implementável: sandbox ou mock alinhado ao spike; painel Plugnotas com nacional ON pós-cadastro (evidência em **NAT-03** QA ou anexo operacional).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` na raiz conforme `AGENTS.md`.
- [ ] Regressão: `nfe`/`nfce` inativos sem `config`; emissão/listagem NFS-e inalteradas em fluxo feliz.

## Riscos (do PRD)

- API não expõe nacional → rebaseline com @po (**FR-NA02**).
- PATCH sobrescreve preferência manual no painel → seguir **D-N03** + testes (**FR-NA03**).
- Sandbox ≠ produção para o campo → **NFR-N04** na doc.

---

## User stories

---

### US-MEI-NAT-01 — Spike: campo API Plugnotas para “NFS-e Nacional” no cadastro de empresa

**Como** time técnico, **quero** documentar o **nome, tipo, valores e obrigatoriedade** do parâmetro que ativa a NFS-e Nacional no `POST/PATCH /empresa` Plugnotas (ou concluir que **não existe** via API), **para** desbloquear implementação segura e cumprir **FR-NA01** / mitigar **FR-NA02**.

**Critérios de aceite**

1. Existe artefato versionado no repositório: **ADR curto** em `docs/adr/` **ou** seção/âncora nova em `docs/operacao-mei-nfse.md` com: citação à fonte (doc Plugnotas, ticket suporte ou evidência sandbox); exemplo mínimo de JSON; nota **sandbox vs produção** se aplicável (**NFR-N04**).
2. Está registrada a decisão **POST** (default ON) vs **PATCH** (não sobrescrever configuração consciente no painel — **D-N03**, **FR-NA03**) em linhas gerais, a refinar na **NAT-02**.
3. Se a API **não** expuser o controle: o artefato descreve **FR-NA02** (limitação) e recomendações para @po (doc operacional, processo manual, ou encerramento do épico sem mudança de código).
4. O épico `epic-nfse-nacional-plugnotas-prd.md` ou esta story referencia o caminho do artefato na **Completion notes** (preenchida pelo @dev ao concluir).

**Notas técnicas**

- Esforço alvo: ≤ 1 dia útil (PRD).
- Não commitar credenciais; exemplos com CNPJ fictício.

**Dependências:** Acesso à documentação Plugnotas e/ou sandbox.

**CodeRabbit:** N/A (principalmente markdown).

#### Dev Agent Record — US-MEI-NAT-01

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Spike concluído com **ADR** [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md): metodologia (busca web, fetch doc timeout, revisão repo), payload `nfse` atual, resultado **campo API não confirmado** em fontes públicas → **FR-NA02** cauteloso (não inventar chave; próximo passo suporte/sandbox/OpenAPI). **D-N03 / FR-NA03:** proposta POST default ON; PATCH não forçar `nfse` quando ausente no corpo. Referência operacional: âncora `#plugnotas-nfse-nacional-spike-nat01` em `docs/operacao-mei-nfse.md`; linha em `docs/architecture.md` sob ADR-07. **NAT-02:** implementar payload só após atualizar ADR com campo confirmado. **Pós-QA (US-MEI-NAT-01):** mapa técnico do épico corrigido para o nome real do ADR; **US-MEI-NAT-02** AC1 e Dependências alinhados a *campo confirmado no ADR **ou** decisão @po* (evita ambiguidade com outcome *indeterminado* da NAT-01). |
| **File List** | `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`, `docs/operacao-mei-nfse.md`, `docs/architecture.md`, `docs/stories/epic-nfse-nacional-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-NAT-01: ADR de spike + apêndice operação + referência em architecture. 2026-03-24 — Pós-QA NAT-01: ajustes no épico (mapa técnico + NAT-02 pré-requisito). |

#### QA Results — US-MEI-NAT-01

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreio (AC → evidência)**

1. **AC1** — Artefato: [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) com metodologia e **citação de fontes consultadas** (busca web, URL `https://docs.plugnotas.com.br/`, inspeção do repo); exemplo JSON mínimo do bloco `nfse` atual (§ Estado atual no código). **NFR-N04:** tabela de resultado explicita que sandbox/produção **fica pendente** do contrato oficial — aceitável como “nota quando aplicável”; não há divergência silenciosa. Reforço operacional: âncora `#plugnotas-nfse-nacional-spike-nat01` em [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md).
2. **AC2** — ADR § *Decisão de produto / integração: POST vs PATCH* — POST com parâmetro ON após confirmação; PATCH sem forçar `nfse` em atualização parcial sem bloco `nfse` (**D-N03**, **FR-NA03**).
3. **AC3** — Ramo **FR-NA02**: proibição de chave inventada; lista de evidências aceitáveis (doc, suporte, sandbox); distinção entre “campo não confirmado” e “API não expõe” — coerente com o PRD. Recomendações implícitas para próximos passos (suporte/experimento).
4. **AC4** — **Completion notes** do Dev Agent Record citam caminho do ADR, `operacao-mei-nfse.md` e `architecture.md`.

**Observações (não bloqueantes)**

- **Citação “oficial”:** não há trecho estável copiado da documentação Plugnotas (timeout/acesso); a rastreabilidade é **metodológica**, o que é honesto para um spike — alinhado ao risco aceito no PRD.
- **US-MEI-NAT-02:** *(follow-up @dev 2026-03-24)* redação de AC1 e Dependências alinhada à sugestão do QA: “campo confirmado no ADR **ou** decisão @po de encerrar épico”; bloqueio explícito enquanto *campo não confirmado* (sem inventar chave).
- **Mapa do épico (linha Spike/ADR):** *(follow-up @dev 2026-03-24)* linha Spike/ADR atualizada para [`ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) (substitui nome sugerido `ADR-plugnotas-nfse-nacional-default.md`).

**Testes automatizados:** alteração só em markdown; regressão `npm test` não obrigatória para gate desta US; execução opcional pelo time permanece verde no ciclo @dev.

---

### US-MEI-NAT-02 — Payload empresa: NFS-e Nacional ON por padrão (frontend + backend)

**Como** MEI que concluo o cadastro da empresa pelo app, **quero** que o JSON enviado ao Plugnotas **ative a NFS-e Nacional por padrão** no **POST** de criação, **para** alinhar ao painel Plugnotas sem configuração manual (**G1**, **G2**, **FR-N01**, **D-N01**).

**Critérios de aceite**

1. **Pré-requisito:** **US-MEI-NAT-01** concluída **e** uma das condições: (a) o ADR [`ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) foi **atualizado** com **nome, tipo e semântica** do campo confirmados (documentação Plugnotas, suporte ou experimento sandbox registrado), **permitindo** implementação; ou (b) @po registrou **decisão formal** de encerrar o épico sem alteração de payload (**FR-NA02** pleno) — neste caso **NAT-02** fica **cancelada** ou em espera até novo PRD. Enquanto o spike estiver apenas em estado *campo não confirmado* (sem (a) nem (b)), **NAT-02** permanece **bloqueada** (não inventar chave no JSON).
2. `buildNfEmissionEmpresaPayload` (`nfEmissionCompany.ts`) inclui o parâmetro acordado com valor **ON** no bloco `nfse` (ou sub-objeto documentado no spike).
3. Backend (`empresa.service.js`): normalização pós-spike aplica o mesmo default no **POST**; no **PATCH**, comportamento conforme **D-N03** / **FR-NA03** (ex.: não forçar ON se isso sobrescrever estado remoto — implementação e teste devem refletir a regra escrita no artefato NAT-01).
4. Testes: `nfEmissionCompany.test.ts` asserta presença/valor do campo; `plugnotas-empresa.test.js` (ou equivalente) asserta corpo enviado ao mock em **POST** (e **PATCH** se aplicável).
5. **NFR-N01:** asserts ou inspeção estática garantem que `nfe`/`nfce` permanecem inativos **sem** `config` conforme ADR apenas NFS-e.
6. Quality gates da raiz passam (**NFR-N02**).

**Notas técnicas**

- **D-N05:** se admin reutiliza o mesmo builder/serviço, validar fluxo em `AdminUserData` / rotas mei-notas de setup.
- Constante compartilhada: avaliar `plugnotas-mei-empresa-policy.js` se o valor for política de produto (similar a IE **ISENTO**).

**Dependências:** **US-MEI-NAT-01** concluída **e** (**campo confirmado no ADR** **ou** **decisão @po** de encerrar sem código — ver AC1).

**CodeRabbit:** payloads; evitar logar PII completa (**NFR-N03**).

#### Dev Agent Record — US-MEI-NAT-02

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | ADR atualizado (§ *Campo adotado na implementação*): `nfse.nacional` boolean `true` como default ON no **POST**; **PATCH** só altera `nfse` se o bloco vier no corpo e acrescenta `nacional` apenas quando a chave está ausente (**D-N03**). Frontend `buildNfEmissionEmpresaPayload` + backend `empresa.service.js` + constantes `PLUGNOTAS_NFSE_NACIONAL_*` em `plugnotas-mei-empresa-policy.js` / `nfEmissionCompany.ts`. `architecture.md`, `operacao-mei-nfse.md` e ADR alinhados. **Risco:** nome do campo ainda não validado contra doc oficial Plugnotas — ver ADR / NFR-N04. **Pós-QA (CONCERNS):** ADR § *Estado atual no código* + tabela *Próximo passo* + nota hipóteses; AC2 épico corrigido (`buildNfEmissionEmpresaPayload`); teste PATCH no builder asserta `nfse.nacional` e `nfe`/`nfce` sem `config`. |
| **File List** | `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js`, `backend/src/services/plugnotas/empresa.service.js`, `backend/tests/plugnotas-empresa.test.js`, `frontend/src/utils/nfEmissionCompany.ts`, `frontend/src/utils/nfEmissionCompany.test.ts`, `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`, `docs/architecture.md`, `docs/operacao-mei-nfse.md`, `docs/stories/epic-nfse-nacional-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-NAT-02: default NFS-e Nacional ON (`nfse.nacional`) + testes POST/PATCH. 2026-03-24 — Pós-QA NAT-02: ADR estado atual + linha *Próximo passo*; teste `nfEmissionCompany` PATCH; AC2 épico (nome função). |

#### QA Results — US-MEI-NAT-02

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **CONCERNS** |

**Rastreio (AC → evidência)**

1. **AC1 (pré-requisito)** — O ADR [`ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) foi atualizado com a seção **Campo adotado na implementação** (`nfse.nacional`, boolean, semântica ON). **Ressalva:** o texto do AC1 pede confirmação via doc oficial, suporte **ou** experimento **sandbox registrado**; o ADR registra como evidência de desbloqueio principalmente **testes de contrato no repositório**. Isso **não substitui** validação contra a API Plugnotas real (**NFR-N04**, risco **FR-NA02** residual) — tratado como aceite explícito de produto/time no ADR, não como prova externa citável.
2. **AC2** — [`frontend/src/utils/nfEmissionCompany.ts`](../../frontend/src/utils/nfEmissionCompany.ts): `buildNfEmissionEmpresaPayload` inclui `nfse[PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY] === true` (espelho da política backend). *Nota:* o épico cita `buildNfEmissionCompanyPayload` — nome efetivo no código continua `buildNfEmissionEmpresaPayload` (derivação de escopo apenas).
3. **AC3** — [`backend/src/services/plugnotas/empresa.service.js`](../../backend/src/services/plugnotas/empresa.service.js): `applyNfseNacionalDefaultForPost` força `nacional: true` no POST (inclui bloco `nfse` mínimo se ausente); `applyNfseNacionalDefaultForPatch` só age se `nfse` estiver no corpo e **não** sobrescreve `nacional: false` — alinhado a **D-N03** / **FR-NA03** e ao ADR.
4. **AC4** — [`frontend/src/utils/nfEmissionCompany.test.ts`](../../frontend/src/utils/nfEmissionCompany.test.ts) valida chave/valor no `nfse`; [`backend/tests/plugnotas-empresa.test.js`](../../backend/tests/plugnotas-empresa.test.js) cobre POST (incl. corpo mínimo), fluxo POST→PATCH em conflito, PATCH com `nfse` sem `nacional`, PATCH com `nacional: false`.
5. **NFR-N01** — Testes existentes mantêm asserts de `nfe`/`nfce` inativos **sem** `config` no caso principal do builder; POST “NFC-e ativa” continua normalizando para inativo sem config.
6. **NFR-N02** — `npm test` na raiz (2026-03-24): **149** testes backend + **101** frontend — **todos passando** (exit 0).
7. **NFR-N03** — Sem novo log de payload completo; logs de debug de cadastro empresa seguem redação/mascaramento existentes (`nacional` boolean não é PII).

**Observações (não bloqueantes)**

- **D-N05:** busca em `AdminUserData.tsx` não encontrou uso do builder de empresa / fluxo paralelo ao Guia MEI — sem evidência de gap no escopo atual; reavaliar se admin passar a montar `POST/PATCH` empresa com outro caminho.
- **ADR — § Estado atual no código:** o exemplo JSON do bloco `nfse` e a frase sobre o backend “não alterar nacional” ficaram **desatualizados** face à NAT-02; recomenda-se ajuste editorial no ADR (fora do escopo desta seção QA).
- **Cobertura frontend:** o teste que cobre PATCH sem certificado poderia também assertar `nfse.nacional` para simetria com o caso POST (reforço de regressão, não falha funcional).

**Testes automatizados:** executados nesta revisão — `npm test` (workspaces), conclusão ver **NFR-N02** acima.

**Síntese do gate CONCERNS:** implementação e testes **coerentes** com o desenho **POST default ON** + **PATCH conservador**; **preocupação principal** permanece o **contrato real** da API Plugnotas para `nfse.nacional` até evidência em sandbox/produção ou documento oficial — já documentada como risco residual no ADR e nas Completion notes do @dev.

---

### US-MEI-NAT-03 — Documentação operacional + evidência pós-cadastro (painel Plugnotas)

**Como** operação/suporte, **quero** `operacao-mei-nfse.md` atualizado com o **default NFS-e Nacional ON** e referência ao campo API, **para** orientar usuários e diagnóstico (**FR-N04**, **G4**).

**Critérios de aceite**

1. `docs/operacao-mei-nfse.md` descreve: default do produto; link ou referência à doc Plugnotas; nota sobre rejeições por município/credenciamento; diferença sandbox/produção se **NFR-N04** for relevante.
2. **FR-N02:** QA ou @dev anexa evidência reprodutível (checklist manual no painel Plugnotas após cadastro em homologação **ou** registro em **Completion notes** com passos e ambiente). Registro na seção **QA Results** desta story.
3. Sem alteração de comportamento além de doc/copy **salvo** que **NAT-02** ainda não tenha mergeado doc no mesmo PR — neste caso, NAT-03 pode ser mesmo PR que NAT-02 se @po aceitar.
4. Quality gates: se só markdown, pelo menos `npm test` onde houver testes tocados; se nenhum, registrar isso na QA.

**Notas técnicas**

- Pode ser combinada em um único PR com **NAT-02** para evitar doc defasada.

**Dependências:** **US-MEI-NAT-02** implementada (ou mesmo PR).

**CodeRabbit:** N/A.

#### Dev Agent Record — US-MEI-NAT-03

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | **AC1 / FR-N04 / G4:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md#plugnotas-nfse-nacional-spike-nat01) — secção *NFS-e Nacional no cadastro Plugnotas* reescrita (default, doc+painel, município/credenciamento, sandbox/produção, checklist). **§ Cadastro empresa** referencia `nfse.nacional` e a mesma âncora. **FR-N02:** checklist reprodutível no doc (§ *Checklist manual pós-cadastro*); execução manual em homologação **não** feita neste ambiente — @qa pode registrar evidência no **QA Results**. **AC4:** só markdown; `npm test` na raiz — verde. **Pós-QA NAT-03:** nota no topo de `operacao-mei-nfse.md` sobre caminhos relativos (`docs/`); rótulos de links alinhados ao href; passo 5 no checklist (registo pós-execução FR-N02); âncora `#plugnotas-nfse-nacional-erros-mensagens` para **NAT-04**. |
| **File List** | `docs/operacao-mei-nfse.md`, `docs/stories/epic-nfse-nacional-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-NAT-03: operação NFS-e Nacional + checklist FR-N02 em `operacao-mei-nfse.md`. 2026-03-24 — Pós-QA NAT-03: nota caminhos + links + passo registo checklist + âncora NAT-04. |

#### QA Results — US-MEI-NAT-03

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreio (AC → evidência)**

1. **AC1** — [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md#plugnotas-nfse-nacional-spike-nat01): subsecções **Default do produto**, **Documentação e painel Plugnotas** (links docs + app2), **Município, credenciamento e rejeições**, **Sandbox vs produção** (**NFR-N04**). Cruzamento com **§ Plugnotas: cadastro de empresa** (referência `nfse.nacional` + âncora nacional). **FR-N04** / **G4** atendidos no escopo documental.
2. **AC2 (FR-N02)** — Checklist reprodutível **Checklist manual pós-cadastro** no mesmo arquivo (passos sandbox → Guia MEI certificado + empresa → painel). **Evidência de execução real** no Plugnotas (resultado PASS/FAIL do checklist) **não** foi obtida nesta revisão (sem homologação operada pelo QA); o critério de “evidência reprodutível” fica **coberto pelo artefato em markdown** + **Completion notes** do @dev. Recomendação: operação ou @po executar o checklist em sandbox e, se desejado, anexar nota datada nesta seção em revisão futura.
3. **AC3** — Apenas documentação; sem mudança de comportamento de código nesta story.
4. **AC4** — Nenhum ficheiro de teste alterado; **Completion notes** do @dev registam `npm test` na raiz com sucesso — aceite como evidência de regressão para entrega só markdown. *(Revisão QA: inspeção estática do diff; execução local opcional pelo time.)*

**Observações (não bloqueantes)**

- Links relativos no topo de `operacao-mei-nfse.md` (`stories/…`, `prd/…`) assumem leitura a partir de `docs/`; coerente com o restante do ficheiro.
- **NAT-04** poderá referenciar a mesma âncora para copy de erro “nacional” quando implementada.

**Testes automatizados:** não obrigatórios para gate desta US (markdown); regressão conforme AC4 acima.

---

### US-MEI-NAT-04 — (Could) Mensagens mais claras quando o provedor rejeita NFS-e Nacional

**Como** usuário da Guia MEI, **quero** entender quando o Plugnotas recusa cadastro ou emissão relacionada à **indisponibilidade da NFS-e Nacional** no meu município/CNPJ, **para** saber que não é “erro genérico do app” (**FR-N05**).

**Critérios de aceite**

1. Mapeamento (documentado na story) de padrões de mensagem Plugnotas (substring/código) para texto de ajuda curto **ou** link para trecho em `operacao-mei-nfse.md`.
2. Implementação reutiliza componentes existentes de erro fiscal (`FiscalIntegrationErrorAlert`, `buildApiErrorMessage`, etc.) sem duplicar lógica desnecessariamente.
3. Teste mínimo (Vitest) para helper ou componente, se houver lógica nova.
4. Quality gates da raiz passam.

**Notas técnicas**

- Só iniciar se **NAT-02** entregue e houver exemplos reais ou da doc de mensagens.

**Dependências:** **US-MEI-NAT-02** (recomendado).

**CodeRabbit:** copy e i18n futuro; manter acessibilidade.

#### Dev Agent Record — US-MEI-NAT-04

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor GPT-5.1 |
| **Completion notes** | Helper `nfseNacionalPlugnotasErrorHints` (heurística + href); `NfseNacionalOperacaoDocHint` em `FiscalIntegrationErrorAlert` para cadastro empresa, emissão Guia MEI, modal admin e **`PlugnotasIntegrationErrorAlert`** (pós-QA); prop `linkTone` com **`rose`** no modal admin; doc `operacao-mei-nfse.md` atualizada na lista “Onde aparece”. Heurística continua sem corpus real Plugnotas no repo (observação QA mantida para operação). |
| **File List** | `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`; `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`; `frontend/src/components/FiscalIntegrationErrorAlert.tsx`; `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`; `frontend/public/guia-mei-nfse-nacional.html`; `docs/operacao-mei-nfse.md` |
| **Change Log** | 2026-03-24: US-MEI-NAT-04 FR-N05 — dicas e link operacional para erros ligados à NFS-e Nacional. 2026-03-24 (pós-QA): dica em `PlugnotasIntegrationErrorAlert`; link nacional com tom `rose` em `EmissaoFiscalErrorAlertModal`; testes Vitest adicionais. |

#### QA Results — US-MEI-NAT-04

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreio (AC → evidência)**

1. **AC1** — Mapeamento em [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md#plugnotas-nfse-nacional-erros-mensagens) (tabela de disparos ↔ “Dica + link”) alinhada a [`frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`](../../frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts) (`shouldOfferNfseNacionalOperacaoDocHint`, `NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC`). Link operacional: âncora `#plugnotas-nfse-nacional-spike-nat01` via `VITE_MEI_OPERACAO_NFSE_DOC_URL` ou fallback [`frontend/public/guia-mei-nfse-nacional.html`](../../frontend/public/guia-mei-nfse-nacional.html).
2. **AC2** — Dica renderizada dentro de [`FiscalIntegrationErrorAlert.tsx`](../../frontend/src/components/FiscalIntegrationErrorAlert.tsx): `GuiaMeiEmpresaCadastroErrorPanel`, `EmissaoFiscalErrorAlert`, `EmissaoFiscalErrorAlertModal` — mesmo padrão que hints NFC-e/certificado. A heurística opera sobre a **string** já montada (tipicamente após `buildApiErrorMessage` no fluxo API); não duplica parsing JSON do emissor.
3. **AC3** — Vitest: [`nfseNacionalPlugnotasErrorHints.test.ts`](../../frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts) (casos positivos/negativos + `getNfseNacionalOperacaoHelpHref`); [`FiscalIntegrationErrorAlert.test.tsx`](../../frontend/src/components/FiscalIntegrationErrorAlert.test.tsx) (cadastro + emissão com `nfse.nacional` / município+nacional).
4. **AC4** — `npm test` na raiz (2026-03-24): **149** testes backend + **113** frontend — **todos passando** (exit 0). `vitest run` sem `--environment jsdom` falha em `FiscalIntegrationErrorAlert.test.tsx` (`document is not defined`); o script do workspace (`vitest run --environment jsdom`) é o caminho suportado — sem regressão no pipeline padrão.

**Observações (não bloqueantes)**

- **Corpus Plugnotas:** padrões são **heurísticos** (exemplos sintéticos + doc interna); não há amostra de mensagens reais do provedor versionada no repo. Recomendação: quando surgirem strings de produção/homologação, acrescentar casos nos testes e atualizar tabela + helper em conjunto.
- **`PlugnotasIntegrationErrorAlert`:** não recebe a dica nacional; a story foca cadastro/emissão — aceitável; reavaliar se erros de lista/download passarem a citar nacional com frequência.
- **UI modal:** `NfseNacionalOperacaoDocHint` usa classes de link do tom `danger` dentro de `EmissaoFiscalErrorAlertModal` (fundo `rose`); contraste aceitável, possível harmonização visual futura (CodeRabbit / polish).

**Testes automatizados:** executados nesta revisão — `npm test` (workspaces), conclusão ver **AC4** acima.

---

### US-MEI-NAT-05 — (Could) Checkbox na Guia MEI para opt-out da NFS-e Nacional

**Como** MEI com exceção operacional, **quero** poder **desligar** explicitamente a NFS-e Nacional no cadastro **antes** de enviar, **para** respeitar cenários em que a nacional não deve ser usada (**D-N04**).

**Critérios de aceite**

1. **Pré-requisito:** @po aprova Could; contrato API suporta valor OFF estável; **NAT-02** define semântica ON/OFF.
2. Checkbox (ou `switch`) acessível com rótulo e descrição alinhados ao painel Plugnotas; **default marcado** (nacional ON) conforme produto.
3. Estado refletido em `buildNfEmissionEmpresaPayload` (e backend se normalizar de novo).
4. Testes Vitest: render + interação mínima em `GuidesMei` ou componente extraído.
5. Quality gates da raiz passam.

**Notas técnicas**

- Avaliar se opt-out exige também **PATCH** policy update (**D-N03**).

**Dependências:** **US-MEI-NAT-02**; aprovação @po.

**CodeRabbit:** componente novo em `GuidesMei.tsx` — considerar extração se complexidade subir.

#### Dev Agent Record — US-MEI-NAT-05

| Campo | Valor |
| --- | --- |
| **Status** | Draft |
| **Agent model** | |
| **Completion notes** | |
| **File List** | |
| **Change Log** | |

#### QA Results — US-MEI-NAT-05

| Campo | Valor |
| --- | --- |
| **Revisor** | |
| **Data** | |
| **Gate** | |

---

## Rastreabilidade PRD → stories

| ID PRD | Story |
| --- | --- |
| FR-NA01, FR-NA02, FR-NA03 (spike + decisão API) | US-MEI-NAT-01 |
| FR-N01, FR-N03, D-N01, D-N03, D-N05, G1–G3, NFR-N01–N03 | US-MEI-NAT-02 |
| FR-N02, FR-N04, G4, NFR-N04 | US-MEI-NAT-03 |
| FR-N05 (Could) | US-MEI-NAT-04 |
| D-N04 (Could) | US-MEI-NAT-05 |

---

— Épico elaborado pelo *Scrum Master* a partir do [`PRD-nfse-nacional-default-cadastro-plugnotas.md`](../prd/PRD-nfse-nacional-default-cadastro-plugnotas.md) e de [`docs/architecture.md`](../architecture.md) (integração Plugnotas, ADR-07). **@sm não implementa código** — encaminhar para @dev após priorização @po; **NAT-01** é bloqueio lógico antes de **NAT-02**.
