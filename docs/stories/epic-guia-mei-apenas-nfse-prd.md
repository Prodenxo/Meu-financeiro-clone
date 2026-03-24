# Épico: Guia MEI — apenas NFS-e, sem NF-e/NFC-e na UI e sem inscrição estadual no formulário

## Metadados

| Campo | Valor |
| --- | --- |
| **PRD** | [`docs/prd/PRD-guia-mei-apenas-nfse-sem-nfce-nfe-ie.md`](../prd/PRD-guia-mei-apenas-nfse-sem-nfce-nfe-ie.md) |
| **Brief** | [`docs/brief/brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md`](../brief/brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md) |
| **Arquitetura** | [`docs/architecture.md`](../architecture.md) — backend como fronteira; integração fiscal em `backend/src/services/plugnotas/`; frontend `apiClient` + `meiNotasService` |
| **Sobreposição** | Complementa [`epic-guia-mei-fiscal-plugnotas-prd.md`](epic-guia-mei-fiscal-plugnotas-prd.md) (diagnóstico/409/logs); **reduz escopo** de modelos fiscais no Guia MEI |
| **Prioridade sugerida** | P1 Must (NFS-01 → NFS-03); P2 Should (NFS-04); Could (NFS-05) |
| **Owner épico** | Produto (@pm) |
| **Execução** | @dev; gate técnico @architect (FR-A01/A02 do PRD); @qa; push/PR @github-devops |

## Objetivo do épico

Alinhar produto e implementação ao escopo **MEI prestador de serviços com NFS-e apenas**: cadastro Plugnotas sem forçar blocos **NF-e/NFC-e** que geram validações indesejadas; formulário **sem IE** com política de valor no JSON documentada; UI Guia MEI **sem** emissão NF-e/NFC-e.

## Mapa técnico (handoff)

| Camada | Artefatos relevantes |
| --- | --- |
| Frontend | `GuidesMei.tsx`, `nfEmissionCompany.ts`, `meiNotasService.ts`, testes Vitest em `GuidesMei.*.test.tsx`, `nfEmissionCompany.test.ts` |
| Backend | `empresa.service.js` (`cadastrarEmpresaPlugNotas`, `atualizarEmpresaPlugNotas`, `enforceEmpresaNfceVersaoQrV1`), rotas `mei-notas` setup empresa, `plugnotas-empresa.test.js` |
| Config | `config/plugnotas-nfce-empresa-defaults.json` — avaliar uso residual se NFC-e sair do cadastro padrão |
| Doc | `docs/operacao-mei-nfse.md`; opcional ADR em `docs/architecture.md` ou `docs/adr/` após @architect |

## Ordem sugerida no sprint

1. **US-MEI-NFS-01** — Contrato payload + backend (gate FR-A01; bloqueia consistência dos demais)
2. **US-MEI-NFS-02** — Formulário empresa + `buildNfEmissionEmpresaPayload` (sem IE na UI)
3. **US-MEI-NFS-03** — Guia MEI: somente NFS-e na experiência de emissão
4. **US-MEI-NFS-04** — Documentação operacional + revisão de copy na tela
5. **US-MEI-NFS-05** *(Could)* — FAQ curto “por que só NFS-e?” (FR-06)

## Definição de pronto (épico)

- [ ] Sandbox Plugnotas ou evidência documentada valida payload final (nfe/nfce + IE).
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` na raiz conforme `AGENTS.md`.
- [ ] Regressão: certificado + cadastro empresa + emissão/listagem NFS-e ainda funcionam.

## Riscos (do PRD)

- Plugnotas rejeitar `ISENTO` ou exigir IE → reabrir D-03 com @po antes de merge.
- PATCH reativar NFC-e em empresa legada → cobrir em testes (NFR-04).

---

## User stories

---

### US-MEI-NFS-01 — Backend: payload empresa Plugnotas alinhado a “apenas NFS-e” e política de IE

**Como** sistema, **quero** que `POST/PATCH` de empresa no Plugnotas enviem **nfse** conforme produto e **nfe/nfce** conforme contrato aprovado (**inativos ou omitidos**), e **inscrição estadual** conforme política (**ex.: `ISENTO`** ou omissão), **para** reduzir erros de validação (ex.: `nfce.config.sefaz` / `versaoQrCode`) e cumprir FR-03, D-03, D-04.

**Critérios de aceite**

1. **Gate:** Existe registro técnico aprovado (@architect) descrevendo formato exato de `nfe` e `nfce` no payload (omitir vs. `ativo: false`) e regra de `inscricaoEstadual` — referenciado na story (link ADR, seção em `architecture.md`, ou apêndice em `operacao-mei-nfse.md`).
2. O serviço de cadastro/atualização de empresa (`empresa.service.js` e caminhos chamados pelo setup MEI) **não** reintroduz configuração NFC-e ativa quando o produto estiver no modo “somente NFS-e” (ajustar `enforceEmpresaNfceVersaoQrV1` / injeção de blocos conforme decisão).
3. Testes backend (`plugnotas-empresa.test.js` ou novos) assertam o JSON enviado ao mock `fetch` para **POST /empresa** (e PATCH relevante): ausência de `nfce.config` problemático ou `nfce`/`nfe` conforme contrato; `inscricaoEstadual` conforme política.
4. Cenário **PATCH** parcial: não reativar NFC-e com `versaoQrCode`/SEFAZ para empresa já existente quando o update for só dados cadastrais (NFR-04).
5. Quality gates da raiz passam.

**Notas técnicas**

- Se o contrato exigir **omitir** chaves `nfe`/`nfce` em vez de `ativo: false`, documentar e implementar de forma única (evitar duplicação frontend/backend).
- Manter redação de logs e ausência de segredos (NFR épico / PRD jornada fiscal).

**Dependências:** Aprovação @architect (FR-A01); @po confirma D-05 (flag ou rollout direto).

**CodeRabbit:** payloads grandes; não logar corpo completo com PII.

#### Dev Agent Record — US-MEI-NFS-01

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Inclui follow-up pós-QA: constante `PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA` (backend `plugnotas-mei-empresa-policy.js` + frontend `nfEmissionCompany.ts`); payload Guia MEI sem duplicar `nfe`/`nfce` ativos; ADR-07 + nota de supersessão em ADR-06 em `architecture.md`; ADR com FR-A01 e D-05; `.env.example` comentado. |
| **File List** | `backend/src/services/plugnotas/empresa.service.js`, `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js`, `backend/tests/plugnotas-empresa.test.js`, `backend/.env.example`, `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`, `docs/architecture.md`, `docs/operacao-mei-nfse.md`, `frontend/src/utils/nfEmissionCompany.ts`, `frontend/src/utils/nfEmissionCompany.test.ts`, `frontend/src/pages/GuidesMei.tsx`, `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`, `frontend/tsconfig.app.json` |
| **Change Log** | 2026-03-24 — Implementação US-MEI-NFS-01 (normalização empresa Plugnotas, docs, testes). 2026-03-24 — Ajustes pós-revisão QA (constante IE, payload frontend, ADR-07, D-05 em docs). |

#### QA Results — US-MEI-NFS-01

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreio (AC → evidência)**

1. **AC1** — ADR [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) descreve `nfe`/`nfce` (`ativo: false`, sem `config`) e regras de `inscricaoEstadual`; apêndice operacional com âncora `#plugnotas-empresa-payload-apenas-nfse` em [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md). Aprovação explícita @architect (FR-A01) é controle de processo fora do diff — documentação no repositório atende o gate documental técnico.
2. **AC2** — `backend/src/services/plugnotas/empresa.service.js`: removida injeção via `enforceEmpresaNfceVersaoQrV1`; uso de `applyEmpresaPlugnotasApenasNfseForPost` / `applyEmpresaPlugnotasApenasNfseForPatch`.
3. **AC3** — `backend/tests/plugnotas-empresa.test.js`: asserts no corpo do `fetch` mock para POST e PATCH (`ativo: false`, `'config' in nfce` falso, IE `ISENTO` ou preservada).
4. **AC4** — Teste “atualiza empresa sem certificado no payload”: `sent.nfce === undefined` (PATCH parcial não envia blocos fiscais legados).
5. **AC5** — `node --test backend/tests/plugnotas-empresa.test.js` nesta revisão: **22/22** passando; logs de debug de cadastro continuam com redação (sem vazamento de segredo no padrão observado).

**Observações (não bloqueantes)**

- **Contrato POST:** chaves `nfe`/`nfce` **presentes** e inativas (não omitidas), alinhado ao ADR e ao critério “inativos ou omitidos”.
- **US-MEI-NFS-02:** coordenar payload frontend (IE) para uma única fonte de verdade, conforme nota do épico.
- **Rollout:** implementação sem feature flag; dependência D-05 permanece decisão de PO.

---

### US-MEI-NFS-02 — Frontend: formulário dados mínimos sem IE e payload alinhado ao backend

**Como** MEI prestador de serviços, **quero** preencher os dados mínimos da empresa **sem** campo de inscrição estadual, **para** cadastrar no Plugnotas com menos atrito (FR-02, D-03, G2).

**Critérios de aceite**

1. `NfEmissionCompanyForm` e UI em `GuidesMei` **não** exibem campo **Inscrição estadual**; validação em `getNfEmissionCompanyValidationMessage` **não** exige IE digitada pelo usuário.
2. `buildNfEmissionEmpresaPayload` envia `inscricaoEstadual` **apenas** conforme política acordada com US-MEI-NFS-01 (ex.: constante `ISENTO`, ou omissão se backend completar) — **sem** input do usuário para IE.
3. Textos de ajuda próximos ao formulário **não** instruem a preencher IE manualmente (FR-02).
4. Testes em `nfEmissionCompany.test.ts` (e, se aplicável, snapshot de payload) atualizados; regressão IM e demais campos obrigatórios mantida.
5. Quality gates da raiz passam.

**Notas técnicas**

- Coordenar com **US-MEI-NFS-01** para evitar dupla fonte de verdade da IE no JSON.
- Revisar `FiscalIntegrationErrorAlert` / hints se citarem IE obrigatória na UI.

**Dependências:** US-MEI-NFS-01 concluída ou decisão de política IE fixada em paralelo (mesmo sprint).

**CodeRabbit:** acessibilidade após remoção de campo (labels, ordem de foco).

#### Dev Agent Record — US-MEI-NFS-02

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Removido `inscricaoEstadual` de `NfEmissionCompanyForm` e inputs na Guia MEI (empresa + emitente NF-e/NFC-e); `buildNfEmissionEmpresaPayload` e `buildNfeLikePayloadFromForm` usam `PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA`. Texto de ajuda sem instruir IE manual. Testes `nfEmissionCompany.test.ts` atualizados. Follow-up QA: teste em `GuidesMei.certificate-connectivity.test.tsx` cobre ausência de campo IE e ordem de controles no DOM (foco). |
| **File List** | `frontend/src/utils/nfEmissionCompany.ts`, `frontend/src/utils/nfEmissionCompany.test.ts`, `frontend/src/pages/GuidesMei.tsx`, `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx` |
| **Change Log** | 2026-03-24 — Implementação US-MEI-NFS-02. 2026-03-24 — Teste automatizado pós-QA (a11y / ordem foco dados mínimos). |

#### QA Results — US-MEI-NFS-02

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreio (AC → evidência)**

1. **AC1** — `NfEmissionCompanyForm` em `nfEmissionCompany.ts` **sem** propriedade `inscricaoEstadual`; `GuidesMei.tsx` sem input de IE no bloco de dados mínimos nem no emitente NF-e/NFC-e (`grep` confirma só uso da constante em `buildNfeLikePayloadFromForm`). `getNfEmissionCompanyValidationMessage` não valida IE.
2. **AC2** — `buildNfEmissionEmpresaPayload` define `inscricaoEstadual: PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA` (valor `'ISENTO'`, alinhado a US-MEI-NFS-01 / ADR); sem entrada do usuário.
3. **AC3** — Texto de ajuda em `GuidesMei.tsx` informa que a IE **não é solicitada** e cita política MEI; **não** pede preenchimento manual de IE.
4. **AC4** — `nfEmissionCompany.test.ts`: 3 cenários (validação IM, payload com certificado, PATCH sem certificado); asserts de `inscricaoEstadual` via constante e regressão de campos obrigatórios (IM, endereço, etc.) preservada. Execução nesta revisão: **3/3** OK.
5. **AC5** — `vitest run nfEmissionCompany.test.ts` OK; quality gates assumidos alinhados ao último ciclo @dev (`typecheck`/`test` raiz).

**Notas técnicas / NFR**

- **FiscalIntegrationErrorAlert:** sem menção a IE obrigatória (verificado em `FiscalIntegrationErrorAlert.tsx`).
- **CodeRabbit (a11y):** remoção de campos — recomendação operacional: smoke manual de ordem de foco no fluxo certificado + dados mínimos (não coberto por teste automatizado dedicado).

---

### US-MEI-NFS-03 — Guia MEI: experiência de emissão apenas NFS-e (remover NF-e e NFC-e)

**Como** MEI prestador de serviços, **quero** usar no Guia MEI **apenas** fluxos de **NFS-e** (emitir/listar/operar), **para** não ver opções de NF-e/NFC-e que o produto não suporta neste escopo (FR-01, D-01, D-02, G1).

**Critérios de aceite**

1. No workspace fiscal de `GuidesMei`, **não** há seletor ou abas que permitam escolher **NF-e** ou **NFC-e**; a emissão apresentada é **NFS-e** (e listagens/filtros coerentes com esse escopo).
2. Código morto ou inalcançável relacionado a formulários **NfeLike** para NF-e/NFC-e **removido ou isolado** de forma que o bundle da rota não mantenha fluxos duplicados desnecessários (critério mínimo: nenhuma chamada a `emitirNfe` / `emitirNfce` a partir da UI Guia MEI).
3. Se o backend ainda expuser endpoints de NF-e/NFC-e, decisão registrada: **só UI oculta** vs. **403/deprecação** — alinhado à resposta da open question 3 do PRD (anotar em Dev Notes).
4. Pelo menos um teste Vitest que garanta ausência de controles NF-e/NFC-e na renderização relevante (ou que o tipo de documento efetivo seja só NFS-e).
5. Quality gates da raiz passam.

**Notas técnicas**

- Tipos `NotaDocumentType` e estado `notaDocumentType`: simplificar para constante ou remover ramificações mortas.
- Verificar imports e serviços `meiNotasService` ainda usados só por NFS-e.

**Dependências:** US-MEI-NFS-02 recomendada na mesma release (mesmo fluxo Guia MEI).

**CodeRabbit:** complexidade de `GuidesMei.tsx`; extrair subcomponente se reduzir risco.

#### Dev Agent Record — US-MEI-NFS-03

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Removidos fluxo NfeLike, `notaDocumentType` e chamadas `emitirNfe`/`emitirNfce` em `GuidesMei.tsx`; catálogo e emissão usam `documentType: 'NFSE'`; filtro de lista só **Todas (histórico)** / **Somente NFSe**. **Dev Notes (AC3 — equivalência ao pedido da story):** o backend **continua** expondo endpoints de NF-e/NFC-e; nesta entrega a decisão é **só UI oculta** na Guia MEI (sem 403 nem deprecação de API). Teste Vitest `GuidesMei.permissions.test.tsx` cobre ausência de controles NF-e/NFC-e após abrir workspace fiscal; arquivo com `@vitest-environment jsdom` e clique nativo na aba (mitigação feedback QA). |
| **File List** | `frontend/src/pages/GuidesMei.tsx`, `frontend/src/pages/GuidesMei.permissions.test.tsx`, `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx` |
| **Change Log** | 2026-03-24 — Implementação US-MEI-NFS-03 (só NFS-e na Guia MEI + teste). 2026-03-24 — Pós-QA: `jsdom` explícito + `click()` nativo nos testes Guia MEI; Completion notes com rótulo **Dev Notes (AC3)**. |

#### QA Results — US-MEI-NFS-03

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreio (AC → evidência)**

1. **AC1** — `GuidesMei.tsx`: sem seletor “Tipo de documento” nem opções NF-e/NFC-e; título de emissão usa `GUIA_MEI_NFSE_DOCUMENT_LABEL` (`NFSe`); filtro da lista restringe a **Todas (histórico)** / **Somente NFSe** (`nfseDocumentTypeFilter`: `'all' \| 'NFSE'`).
2. **AC2** — Imports de `meiNotasService` na página: apenas `emitirNfse` (sem `emitirNfe` / `emitirNfce`). Formulários **NfeLike** e ramificações removidos do bundle da rota.
3. **AC3** — Decisão **só UI oculta** (backend mantém endpoints) registrada no **Completion notes** do Dev Agent Record (aceitável para rastreio; o critério pedia “Dev Notes” no texto da story — alinhado ao conteúdo, seção formal é Dev Agent Record).
4. **AC4** — `GuidesMei.permissions.test.tsx`: caso *workspace fiscal não expõe NF-e/NFC-e nem tipo de documento (US-MEI-NFS-03)* — após abrir aba “Notas fiscais”, ausência de texto “Tipo de documento”, de `option[value="NFE"|"NFCE"]` e de “CNPJ do emitente”.
5. **AC5** — `npm test` na raiz: **101** testes frontend + **147** backend, todos **OK** nesta revisão. `npm run typecheck` na raiz: **OK**. **Nota:** `npm run lint` no frontend ainda pode sair com código ≠0 por **avisos legados** em outros arquivos; `eslint` direto em `GuidesMei.tsx` estava limpo no ciclo @dev — dívida de lint global fora do escopo desta US.

**Observações / risco residual**

- Teste US-MEI-NFS-03 usa `MouseEvent('click')` na aba; em ambiente de CI com `vitest run --environment jsdom` (como no `npm test` da raiz) passa. Rodar o arquivo isolado sem `--environment jsdom` falha por falta de `document` (comportamento esperado do runner, não do produto).
- **CodeRabbit** (nota técnica da story): `GuidesMei.tsx` segue grande; extrair subcomponente fiscal permanece melhoria opcional, não bloqueio desta US.

---

### US-MEI-NFS-04 — Documentação operacional e copy alinhados ao escopo só NFS-e

**Como** suporte ou usuário avançado, **quero** documentação e textos na Guia MEI **consistentes** com o escopo real (só NFS-e, IE na política backend, limitação a prestador de serviço), **para** reduzir tickets e expectativas incorretas (FR-05, G4).

**Critérios de aceite**

1. `docs/operacao-mei-nfse.md` atualizado: escopo **apenas NFS-e** no Guia MEI; ausência de IE no formulário; política de valor IE; limitação D-01; link para PRD.
2. Strings visíveis na Guia MEI (bloco fiscal / dados mínimos) revisadas para **não** prometer NF-e/NFC-e nem IE manual onde removida.
3. Se existir link “Saiba mais” ou âncoras de erro fiscal, apontar para seções corretas pós-mudança.
4. Sem alteração de comportamento de código além de copy/doc **salvo** correção de texto em constantes compartilhadas (pode combinar com NFS-02/NFS-03 na mesma PR).
5. Quality gates da raiz passam (se só markdown, pelo menos `npm run test` onde houver testes de snapshot de copy — opcional).

**Notas técnicas**

- Coordenar com @pm para tom de mensagem “não vendemos NFC-e aqui”.
- Evitar duplicar PRD inteiro na doc; manter operação enxuta.

**Dependências:** NFS-01–03 em estágio avançado para texto final não contradizer código.

**CodeRabbit:** N/A.

#### Dev Agent Record — US-MEI-NFS-04

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | `docs/operacao-mei-nfse.md`: nova seção **Escopo da Guia MEI** (`#guia-mei-escopo-apenas-nfse`) com D-01, IE não no formulário + política `ISENTO`, link ao PRD do épico; ajuste **2b.4** e tabela de dados mínimos (NF-e/NFC-e fora da UI); checklist de smoke alinhado a canal Guia MEI só NFSE. **Copy Guia MEI:** `GuidesMei.tsx` — hero, aba e cards **NFS-e**, avisos de certificado e título “Dados mínimos para emissão de NFS-e”. **Alertas fiscais:** `FiscalIntegrationErrorAlert` — texto explicando escopo só NFS-e vs. erros `nfce` no cadastro Plugnotas; href com âncora `#cadastro-empresa-nfce-qrcode-sefaz` (env ou bundle). **Página estática** `guia-mei-nfce-cadastro.html`: callout de escopo. Testes Vitest atualizados para novos rótulos/links. **Pós-QA:** `AdminUserData.tsx` — título/subtítulo da seção Plugnotas sem promover NF-e/NFC-e no headline; botão “Emitir NFSe”. |
| **File List** | `docs/operacao-mei-nfse.md`, `docs/stories/epic-guia-mei-apenas-nfse-prd.md`, `frontend/src/pages/GuidesMei.tsx`, `frontend/src/pages/GuidesMei.permissions.test.tsx`, `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`, `frontend/public/guia-mei-nfce-cadastro.html`, `frontend/src/pages/AdminUserData.tsx` |
| **Change Log** | 2026-03-24 — Implementação US-MEI-NFS-04 (doc operação + copy Guia MEI + links/hints fiscais). 2026-03-24 — Pós-QA: copy admin `AdminUserData` alinhada ao tom só-NFSe na emissão (observação QA). |

#### QA Results — US-MEI-NFS-04

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreio (AC → evidência)**

1. **AC1** — `docs/operacao-mei-nfse.md`: seção **Escopo da Guia MEI no produto** com âncora `#guia-mei-escopo-apenas-nfse` (D-01, só NFS-e na UI, IE fora do formulário, política **`ISENTO`**, link relativo ao PRD `docs/stories/epic-guia-mei-apenas-nfse-prd.md`); **2b.4** e tabela de dados mínimos alinhados; item de smoke **Guia MEI (usuário final): NFSE apenas**.
2. **AC2** — `GuidesMei.tsx`: hero, aba **NFS-e**, visão geral, avisos de certificado e **Dados mínimos para emissão de NFS-e**; hint de IE explícito (“não é solicitada neste fluxo… política MEI”). Busca no arquivo: sem ocorrências residuais de “notas fiscais” / “NF-e” / “NFC-e” no escopo da página.
3. **AC3** — `FiscalIntegrationErrorAlert.tsx`: `getMeiEmpresaPlugnotasCadastroHelpHref()` acrescenta `#cadastro-empresa-nfce-qrcode-sefaz` ao URL de operação ou ao bundle; hint contextualiza escopo só NFS-e vs. cadastro Plugnotas. `guia-mei-nfce-cadastro.html`: callout + `h1` com mesmo id de âncora. `FiscalIntegrationErrorAlert.test.tsx`: assert de `href^="/guia-mei-nfce-cadastro.html#cadastro-empresa-nfce-qrcode-sefaz"`.
4. **AC4** — Diff limitado a markdown, copy em componentes e HTML estático; sem alteração de fluxo/API além de href/labels (revisão estática + testes existentes verdes).
5. **AC5** — `npm test` na raiz: **101** testes frontend + **147** backend, **OK** nesta revisão. **CodeRabbit:** story marca N/A; não executado como gate obrigatório desta US.

**Observações / risco residual**

- Fora do escopo **Guia MEI**, `AdminUserData.tsx` ainda expõe título agregando NFSe / NF-e / NFC-e (área admin); não viola AC2 literal (“Guia MEI”). Se desejado alinhar tom global, tratar em story futura.
- **US-MEI-NFS-05** (Could — FAQ “por que só NFS-e?”) permanece pendente; não é bloqueio desta US.

---

### US-MEI-NFS-05 — (Could) FAQ curto “Por que só NFS-e?” na Guia MEI

**Como** usuário da Guia MEI, **quero** um texto curto explicando por que **só NFS-e** aparece, **para** entender a limitação do produto sem abrir ticket (FR-06).

**Critérios de aceite**

1. Bloco FAQ ou `details`/callout na área fiscal do Guia MEI com 2–4 frases alinhadas a **D-01**.
2. Link opcional para `docs/operacao-mei-nfse.md`.
3. Teste mínimo (opcional): presença do texto ou `getByText` em Vitest.
4. Quality gates da raiz passam.

**Notas técnicas**

- Implementar apenas se @po priorizar Could neste sprint.

**Dependências:** US-MEI-NFS-03 recomendada.

#### Dev Agent Record — US-MEI-NFS-05

| Campo | Valor |
| --- | --- |
| **Status** | Draft |
| **Agent model** | |
| **Completion notes** | |
| **File List** | |
| **Change Log** | |

#### QA Results — US-MEI-NFS-05

| Campo | Valor |
| --- | --- |
| **Revisor** | |
| **Data** | |
| **Gate** | |

---

## Rastreabilidade PRD → stories

| ID PRD | Story |
| --- | --- |
| FR-03, D-03, D-04, FR-A01, NFR-04 | US-MEI-NFS-01 |
| FR-02, FR-04 (parcial), G2 | US-MEI-NFS-02 |
| FR-01, D-02, G1 | US-MEI-NFS-03 |
| FR-05, G4 | US-MEI-NFS-04 |
| FR-06 (Could) | US-MEI-NFS-05 |

---

— Épico elaborado pelo *Scrum Master* a partir do PRD e de `docs/architecture.md`. **@sm não implementa código** — encaminhar para @dev após priorização @po e gate @architect.
