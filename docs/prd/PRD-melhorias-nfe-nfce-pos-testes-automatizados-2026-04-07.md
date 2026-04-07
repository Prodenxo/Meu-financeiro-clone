# PRD — Melhorias **NF-e / NFC-e** após cobertura de testes automatizados (qualidade real + decisões de produto)

**Versão:** 1.2  
**Data:** 2026-04-07  
**Notas de versão:** 1.2 — **FR-POSQA-07** (POSQA-5): script `scripts/smoke-nfe-nfce-plugnotas.mjs` + workflow opcional GitHub Actions. 1.1 — **FR-POSQA-03** / §8.1: decisão **D1** registada (ADR + change log).  
**Tipo:** Brownfield — `mei-notas`, Plugnotas, Guia MEI, operação e documentação  
**Fonte canónica do pedido:** `docs/brief/brief-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`

**Relação com outros artefatos:**

- **Complementa** `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` (**FR-GUIA-FISC-\***) — aquele PRD cobre **funcionalidade** de seletor, formulário e histórico; **este PRD** cobre o **fecho da lacuna** entre testes de contrato (mock/CI) e **confiança em ambiente real**, mais **decisões explícitas** (empresa Plugnotas, limite MEI, governança de stories).  
- **Alinha-se** a `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` e a `docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md`.  
- **Referencia** `docs/technical/mei-limite-faturamento-agregado-2026-04-02.md` para a regra atual de agregado (NFSE).  
- **Não substitui** assessoria legal/tributária: o produto continua a **orquestrar** integração; o utilizador e o contador respondem pela conformidade fiscal.

---

## 1. Resumo executivo

A suíte de testes automatizados (backend: serviços Plugnotas NF-e/NFC-e e `mei-notas.service.js`; frontend: `meiNotasService`, Guia MEI, capacidades de empresa) **valida o contrato de software** e reduz regressões de integração. **Não valida** autorização pela SEFAZ, comportamento específico por UF, nem o estado real da **empresa** no Plugnotas (modalidades `nfe` / `nfce` ativas).

Este PRD define requisitos rastreáveis (**FR-POSQA-\***, **NFR-POSQA-\***, **CR-POSQA-\***) para:

1. **Smoke E2E** (sandbox ou homologação) documentado e reproduzível.  
2. **Política e evolução** do cadastro de empresa Plugnotas quando NF-e/NFC-e devem estar disponíveis de facto.  
3. **Reconciliação** da story P0 de emissão com o estado do código e testes (itens fechados vs P1).  
4. **Comunicação clara** do **limite de faturamento MEI** relativamente a NF-e/NFC-e (manter exclusão ou decisão futura explícita).  
5. **Observabilidade na UI** para erros Plugnotas (400), com mensagens **acionáveis** e **sem vazamento** de PII ou segredos.

---

## 2. Visão de produto

O utilizador e a equipa interna devem **confiar** que, quando o CI está verde e a UI permite escolher NF-e ou NFC-e, existe um **caminho verificável** até uma emissão bem-sucedida em **ambiente real** (ou um bloqueio **explicado** com próximos passos). Paralelamente, o **backlog** e as **stories** refletem o que já está implementado, evitando planeamento fantasma.

Stakeholders: **PO** (prioridade e copy), **QA** (smoke e evidências), **Architect** (contratos Plugnotas e empresa), **Dev** (implementação incremental), **Suporte** (base de conhecimento a partir do runbook).

---

## 3. Problema e oportunidade

| ID interno | Problema | Oportunidade |
|------------|----------|--------------|
| **M1** | Regressões fiscais ou de integração só aparecem em produção ou testes manuais ad hoc. | Runbook de smoke E2E com pré-condições e evidência. |
| **M2** | Empresa Plugnotas pode ter `nfe`/`nfce` inativos por desenho; utilizador não distingue “bug da app” de “config em falta no emissor”. | Decisão de produto + fluxo/UI ou documentação explícita de habilitação. |
| **M3** | Critérios de aceite na story P0 podem estar desatualizados vs `GuidesMei.tsx` e testes. | Reconciliação única com referência cruzada (story + PRD). |
| **M4** | Limite MEI no agregado pode ser interpretado como “todas as notas fiscais”. | Copy e/ou decisão de escopo registada (NFSE-only vs extensão futura). |
| **M5** | Erros 400 Plugnotas são claros nos logs de engenharia; na UI o utilizador pode ver mensagem genérica. | Paridade de detalhe **seguro** para o utilizador (campos, sem dados sensíveis). |

---

## 4. Personas e cenários de validação

| Persona | Cenário |
|---------|---------|
| **QA / Dev** | Executa o smoke documentado em sandbox, anexa evidência (status da nota, PDF/XML se aplicável), regista divergências UF/sandbox. |
| **MEI** | Ao falhar emissão, lê mensagem que indica **o que corrigir** (campo, cadastro, certificado) ou **contactar suporte** com contexto não sensível. |
| **PO / SM** | Atualiza story P0 e deriva P1 (ex.: `localStorage` do último tipo) com base na reconciliação. |
| **Suporte** | Usa o mesmo runbook para reproduzir incidentes sem pedir credenciais desnecessárias ao utilizador. |

---

## 5. Escopo

### 5.1 Dentro do escopo

- **Documentação operacional:** secção nova ou ficheiro em `docs/runbook/` (ou extensão de `docs/operacao-mei-nfse.md`) com passos de smoke E2E **NF-e** e **NFC-e** em ambiente não produtivo acordado.  
- **Decisão registada** sobre cadastro empresa Plugnotas: comportamento atual **mantido** vs **roadmap** de PATCH/POST para ativar modalidades — documentada neste PRD (§8) ou em ADR referenciado.  
- **Governança de backlog:** atualização da story `story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md` (ou nota de reconciliação ligada) com checkboxes alinhados ao repositório.  
- **Limite MEI:** texto de interface e/ou documentação de ajuda que deixe explícito que o agregado **atual** foca **NFS-e** (e linhas `document_type` nulas conforme regra técnica), **salvo** decisão futura de incluir NFE/NFCE.  
- **UX de erros:** garantir que erros típicos de validação Plugnotas (400) em emissão NF-e e NFC-e são **mapeados** para a experiência do Guia MEI (componentes existentes: `formatMeiFiscalErr`, alertas de integração, etc.), com teste automatizado **ou** evidência de QA conforme **NFR-POSQA-03**.  
- **Qualidade:** gates `npm run lint`, `npm run typecheck`, `npm test` (`AGENTS.md`) nos incrementos de código tocados.

### 5.2 Fora do âmbito

- Troca de integrador ou integração directa com SEFAZ.  
- Definição de alíquotas, CFOP ou CST por sector (responsabilidade do utilizador + contador).  
- Refactor massivo da tabela `mei_nfse` ou renomeação canónica (story separada).  
- **Inclusão de NF-e/NFC-e no cálculo do limite MEI** — apenas como **decisão futura** explícita em §8; implementação exigiria PRD/ADR adicional e alteração de `agregarLimiteFaturamento` + cliente.  
- CTe na mesma iniciativa.

---

## 6. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-POSQA-01** | Existe **documentação reproduzível** (runbook) para executar smoke E2E de **emissão NF-e** e **emissão NFC-e** contra ambiente **não produtivo** (sandbox/homologação), incluindo pré-condições: credenciais Plugnotas fora do repositório, certificado A1 quando exigido, CNPJ de teste, empresa com modalidades **ativas** quando o teste pretende sucesso fim-a-fim. | P0 |
| **FR-POSQA-02** | O runbook define **resultado esperado** (ex.: nota em processamento/autorizada conforme sandbox) e **onde registar evidência** (ticket interno, template de QA). | P0 |
| **FR-POSQA-03** | Existe **decisão de produto escrita** (neste PRD §8 ou ADR) sobre **cadastro empresa Plugnotas**: (a) manter inativação intencional de `nfe`/`nfce` em certos fluxos e apenas orientar o utilizador; ou (b) **roadmap** para habilitação guiada ou PATCH documentado — sem obrigar implementação completa neste incremento se o PO escolher (a) + documentação apenas. | P0 |
| **FR-POSQA-04** | A story **P0** de seletor/formulário NF-e/NFC-e é **reconciliada** com o código e testes: itens já cobertos são marcados; itens em aberto têm owner ou story filha (**FR-GUIA-FISC** permanece canónico para funcionalidade). | P0 |
| **FR-POSQA-05** | A UI do Guia MEI (área de emissão fiscal) expõe **texto claro** sobre o **limite de faturamento MEI**: que o valor agregado **atual** considera **NFS-e** (e regra técnica de `document_type`/`null` conforme implementação), e que **NF-e/NFC-e não entram** no somatório **salvo** futura alteração anunciada. | P0 |
| **FR-POSQA-06** | Em falhas de emissão **NF-e** e **NFC-e** devolvidas pela API (incl. erros Plugnotas agregados), o utilizador vê mensagem que permite **corrigir dados** ou **perceber bloqueio de configuração**, sem expor stack trace nem PII desnecessária (**detalhe em §9 NFR**). | P0 |
| **FR-POSQA-07** | (P1) Automatizar **um** teste de contrato E2E opcional (ex.: script que chama API com mocks desligados em CI com secrets — **só se** o repositório tiver política de secrets de CI; caso contrário, manter manual + evidência). | P1 |

---

## 7. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-POSQA-01** | **Segurança** | Runbook e exemplos **não** incluem API keys, passwords ou certificados em claro; referir cofre ou variáveis de ambiente. |
| **NFR-POSQA-02** | **Rastreabilidade** | Alterações de copy ou runbook referenciam este PRD e o brief de origem. |
| **NFR-POSQA-03** | **Qualidade** | Novos testes (se **FR-POSQA-06** implicar alteração de `formatMeiFiscalErr` ou equivalente) cobrem pelo menos um caso **NF-e** e um **NFC-e** de erro Plugnotas simulado ou fixture, alinhado aos padrões já usados em `plugnotas-nfe.test.js` / `nfce.test.js`. |
| **NFR-POSQA-04** | **Manutenção** | Revisão do runbook quando a API Plugnotas ou o fluxo `mei-notas` mudar (owner: equipa que toca em `empresa.service.js` / emissão). |

---

## 8. Decisões de produto (registo obrigatório)

### 8.1 Cadastro empresa Plugnotas (M2)

**Estado actual (contexto):** fluxos MEI podem enviar empresa com `nfe`/`nfce` **inativos** para evitar reativação indevida; a UI já pode bloquear emissão com base em `parsePlugnotasEmpresaCapabilities`.

**Decisão a registar até o fecho deste PRD (escolha uma ou combinação explícita):**

| Opção | Descrição |
|-------|-----------|
| **D1 — Documentação + bloqueio honesto** | Mantém-se lógica actual; reforça-se copy e runbook (“como pedir ativação” / suporte). **Sem** PATCH automático neste incremento. |
| **D2 — Roadmap de habilitação** | Compromisso de story futura: fluxo guiado ou alteração de `POST/PATCH` empresa conforme `architecture-mei-emissao-nfe-nfce` §5–6. |
| **D3 — Feature flag** | NF-e/NFC-e visíveis apenas para contas autorizadas até D2 estar pronto. |

**Decisão registada (2026-04-07 — STORY-POSQA-4, FR-POSQA-03):** **D1 — Documentação + bloqueio honesto** como linha de produto à data: manter consulta de capacidades (`GET` empresa emissão fiscal) e bloqueio na UI quando `nfe`/`nfce` estiverem inactivos (`MeiFiscalCapabilityCallout`); reforço em runbook e ADR. **D2** (roadmap PATCH/POST ou fluxo guiado) e **D3** (feature flag) ficam como opções de backlog explícitas, **sem** implementação neste incremento — ver ADR [`adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md`](../technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md).

**Critério de fecho:** uma linha no **Change log** (§15) + entrada em `.cursor/mem/PROJECT_MEMORY.md` se a decisão for transversal (sem secrets).

### 8.2 Limite MEI e NF-e/NFC-e (M4)

**Regra técnica actual:** `agregarLimiteFaturamento` agrega essencialmente notas **NFSE** (ver código e ADR de limite).

**Decisão default deste PRD:** **manter** exclusão de NFE/NFCE do agregado até PRD específico; **FR-POSQA-05** obriga **transparência na UI**.

**Se o PO decidir incluir NFE/NFCE no futuro:** novo PRD + alteração de regra servidor/cliente + testes de regressão do limite.

### 8.3 Story P0 vs código (M3)

**Ação:** `@sm` ou PO atualiza `docs/stories/story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md` com secção “Reconciliação 2026-04-07” ou equivalente, referenciando este PRD.

---

## 9. Compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-POSQA-01** | Não remover nem enfraquecer testes existentes de `plugnotas-nfe`, `plugnotas-nfce`, `mei-notas-core` salvo refactor equivalente com cobertura. |
| **CR-POSQA-02** | Melhorias de mensagem de erro **não** alteram contratos HTTP públicos de `POST /mei-notas/emitir` sem versionamento ou nota de breaking change. |
| **CR-POSQA-03** | `requireAuth` / `requireMeiEnabled` mantidos; runbook não documenta bypass de segurança. |

---

## 10. Integração técnica (resumo)

| Área | Notas |
|------|--------|
| **Smoke** | Chamadas reais a `POST /mei-notas/emitir` com `documentType` **NFE** / **NFCE** e payload mínimo válido; depende de ambiente Plugnotas. |
| **Empresa** | `GET /mei-notas/setup/emissao-fiscal/empresa` + `empresa.service.js` — alinhamento com **FR-POSQA-03**. |
| **Limite** | `agregarLimiteFaturamento` em `mei-notas.service.js`; UI `meiLimiteFaturamento` — só copy/decisão, salvo novo PRD. |
| **Erros UI** | `GuidesMei.tsx`, helpers de erro fiscal existentes; possível extensão de testes em `GuidesMei.permissions.test.tsx` ou testes unitários de formatação. |

Detalhe de implementação na story com **@architect** quando tocar em contratos.

---

## 11. Métricas de sucesso

| Objetivo | Medição |
|----------|---------|
| **Confiança em release** | Smoke E2E executado pelo menos uma vez por release maior que toque em `mei-notas` ou serviços Plugnotas NFe/NFCe, com evidência arquivada. |
| **Clareza ao utilizador** | Redução qualitativa de tickets “app não emite” quando a causa é **config Plugnotas** (baseline a definir pelo suporte). |
| **Backlog honesto** | Story P0 sem checkboxes obsoletos críticos; discrepâncias documentadas. |
| **Segurança** | Zero secrets colados em runbook ou PRs. |

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Sandbox ≠ produção | Falso sentimento de cobertura | Runbook declara limitações; produção com monitorização e rollout gradual (**D3** se necessário). |
| Decisão D2 atrasada | Utilizadores bloqueados sem NFC-e/NF-e | **D1** com suporte informado + FAQ. |
| Copy de limite mal interpretada | Decisões fiscais erradas pelo utilizador | Texto conservador + “em caso de dúvida, contador”; não apresentar NFE/NFCE como incluídos no teto sem mudança de regra. |
| Testes de erro frágeis | Flakiness | Preferir fixtures estáveis e mensagens estáveis documentadas pela Plugnotas. |

---

## 13. Epic e stories (proposta)

**Epic sugerido:** Qualidade e confiança **NF-e / NFC-e** pós-testes automatizados.

| Story sugerida | Conteúdo mínimo |
|----------------|-----------------|
| **POSQA-1 (P0)** | Runbook smoke E2E + template de evidência; revisão `operacao-mei-nfse` ou novo ficheiro em `docs/runbook/`. |
| **POSQA-2 (P0)** | Reconciliação story P0 + atualização de checkboxes; referência a este PRD. |
| **POSQA-3 (P0)** | **FR-POSQA-05** + **FR-POSQA-06**: copy limite + revisão de mensagens de erro NF-e/NFC-e; testes conforme NFR-POSQA-03. |
| **POSQA-4 (P0/P1)** | Registo de decisão **§8.1** (ADR ou PROJECT_MEMORY) e, se **D2**, story de habilitação empresa (pode sobrepor a Story C do PRD 2026-04-06). |
| **POSQA-5 (P1)** | **FR-POSQA-07** — automação opcional E2E com política de CI. |

---

## 14. Critérios de release / Definition of Done (produto)

- [ ] **FR-POSQA-01** e **FR-POSQA-02** satisfeitos (runbook publicado e utilizável).  
- [x] **FR-POSQA-03** satisfeito (decisão **§8.1** registada — **D1**, 2026-04-07; ADR + change log).  
- [ ] **FR-POSQA-04** satisfeito (story P0 reconciliada).  
- [ ] **FR-POSQA-05** e **FR-POSQA-06** satisfeitos.  
- [x] **FR-POSQA-07** satisfeito (automação opcional: script + workflow condicionado a secrets; runbook §“Automação opcional”).  
- [ ] **NFR-POSQA-01** a **NFR-POSQA-04** verificados.  
- [ ] **CR-POSQA-01** a **CR-POSQA-03** sem regressão comprovada.  
- [ ] Gates `AGENTS.md` verdes nos pacotes tocados.

---

## 15. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.2 | 2026-04-07 | Dev (POSQA-5) | **FR-POSQA-07:** script `scripts/smoke-nfe-nfce-plugnotas.mjs`; workflow `.github/workflows/posqa-5-plugnotas-smoke-optional.yml` (secrets obrigatórios para correr); runbook v1.3 secção automação opcional. |
| 1.1 | 2026-04-07 | Dev (POSQA-4) | **FR-POSQA-03:** decisão **§8.1** — **D1** (documentação + bloqueio honesto); ADR `docs/technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md`; `.cursor/mem/PROJECT_MEMORY.md`; runbook secção política empresa. |
| 1.0 | 2026-04-07 | PM (Morgan — a partir do brief Atlas) | Versão inicial a partir de `brief-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`. |

---

## 16. Próximos passos canónicos AIOX

- **@architect** — validar runbook técnico (URLs, variáveis, ordem certificado → empresa → emitir).  
- **@sm** — criar ou fatiar stories **POSQA-\*** com file list e critérios.  
- **@qa** — primeira execução do smoke e registo de evidência piloto.  
- **@dev** — implementação de **FR-POSQA-05** / **FR-POSQA-06** conforme stories.

— Morgan, planejando o futuro 📊
