# PRD — Guia MEI: emissão de **NF-e** e **NFC-e** via Plugnotas (aba emissão + seletor por tipo)

**Versão:** 1.0  
**Data:** 2026-04-06  
**Tipo:** Brownfield — frontend Guia MEI, integração `mei-notas` / Plugnotas, possível evolução de cadastro de empresa  
**Fonte canónica do pedido:** `docs/brief/brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md`

**Relação com outros artefatos:**

- **Alinha-se** a `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` (NFS-e, Plugnotas, fonte de verdade).  
- **Complementa** `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md` (cadastro MEI / certificado — emitente continua obrigatório para emissão).  
- **Respeita** `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` — catálogos atuais são majoritariamente orientados a **NFS-e**; este PRD define como evoluir **sem** quebrar contratos existentes.  
- **Admin (fase 2):** `docs/prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md` — paridade opcional; ver §5.2.  
- **Não substitui** documentação legal/tributária: o produto **orquestra** dados e chamadas ao integrador; o utilizador permanece responsável pela conformidade fiscal com apoio do contador.

---

## 1. Resumo executivo

O **Guia MEI** oferece hoje emissão e acompanhamento centrados em **NFS-e**. O **backend** já suporta emissão unificada (`POST …/mei-notas/emitir`) com `documentType` **NFSE**, **NFE** e **NFCE**, validação de payload para notas “tipo NF-e” (modelos **55** e **65**) e serviços Plugnotas dedicados.

Este PRD define requisitos rastreáveis (**FR-GUIA-FISC-\***), NFRs, decisões de produto, critérios de release e proposta de epic/story para:

1. Expor na **aba de emissão** um **seletor explícito** de documento: **NFS-e** | **NF-e** | **NFC-e**, com formulário **contextual** por tipo.  
2. Garantir que a submissão envia **`documentType`** e **`payload`** coerentes com o tipo escolhido, reutilizando o endpoint existente.  
3. Evoluir **lista e filtros** de histórico para **NFE** / **NFCE** / **NFSE**, alinhados ao que o backend já persiste.  
4. Tratar **cadastro da empresa no Plugnotas** quando **NF-e** ou **NFC-e** exigirem blocos ativos e configuração adicional (CSC, etc.) — com bloqueio claro e fluxo de habilitação **definido em conjunto com arquitetura/backend**.  
5. Manter **não regressão** para quem usa apenas **NFS-e**.

---

## 2. Visão de produto (experiência)

O utilizador MEI com **venda de mercadorias** ou necessidade de **nota de produto** deve conseguir, **no mesmo hub fiscal** onde já trata certificado, DAS e NFS-e:

- **Escolher o tipo de nota** antes de preencher, reduzindo confusão entre serviço (NFS-e) e produto (NF-e / NFC-e).  
- Ver **campos e ajudas** adequados ao tipo (sem misturar bloco de “serviço/prestador/tomador” com bloco de “emitente/destinatário/itens” de NF-e).  
- **Emitir** e **acompanhar** o resultado na mesma lista, filtrando por tipo.

A integração continua a ser **Plugnotas**; não se introduz novo motor fiscal.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Cobertura na UI** | Emissão apresentada como NFS-e; capacidade NFE/NFCE invisível. | Um único ecrã com **seletor** e jornada clara por tipo. |
| **Expectativa** | Utilizador assume que “emissão fiscal” = só serviço. | Copy e controlos explicam **NFC-e** (consumidor) vs **NF-e** (modelo 55) vs **NFS-e**. |
| **Cadastro emitente** | Fluxos MEI podem manter `nfe`/`nfce` **inativos** no Plugnotas por política atual. | Fluxo de **habilitação** + mensagens se o tipo escolhido não estiver disponível no provedor. |
| **Histórico** | Filtros/lista podem não destacar NF-e/NFC-e. | Paridade de leitura com `document_type` gravado. |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| **MEI — venda ao consumidor** | Emitir **NFC-e** | Seleciona NFC-e → preenche emitente/destinatário/itens conforme validação → emite → vê registo na lista como NFC-e. |
| **MEI — necessidade de NF-e** | Emitir **NF-e** (mod. 55) | Seleciona NF-e → modelo 55 validado (app + provedor) → emite → acompanha. |
| **MEI — só serviços** | Manter **NFS-e** | Default ou seleção NFS-e → fluxo atual preservado. |
| **Suporte interno** | Menos tickets de “não encontro NFC-e” | Seletor + FAQ curto na UI ou link para guia. |

**Stakeholders:** PO (decisões §6), UX (padrão do seletor, troca de tipo com dados parciais), Architect (payload, cadastro empresa Plugnotas), Backend, Frontend, QA.

---

## 5. Escopo

### 5.1 Dentro do escopo

- **Frontend (prioridade P0):** `GuidesMei.tsx` (e componentes extraídos se necessário) — seletor **NFS-e | NF-e | NFC-e** no **topo do painel da aba de emissão**; formulário condicional; integração com `POST …/mei-notas/emitir` enviando `documentType` (`NFSE` / `NFE` / `NFCE`) e corpo já suportado pelo serviço (`payload` aninhado ou formato aceite pelo `buildPayloadByDocumentType` — **contrato fino na story com @architect**).  
- **Validação em UI:** alinhamento **mínimo** às regras já aplicadas no servidor para NF-e/NFC-e (emitente CNPJ, destinatário CPF/CNPJ + razão social, itens com código, descrição, **NCM 8 dígitos**, **CFOP 4 dígitos**, unidade, quantidade e valor unitário > 0, **CST/CSOSN ICMS**, **CST PIS/COFINS**) — ver `validateNfeLikePayload` em `mei-notas.service.js`; objetivo: **reduzir ida-e-volta** e mensagens claras antes do submit.  
- **Lista / filtros:** permitir filtrar ou segmentar visualmente **NFSE**, **NFE**, **NFCE** (conforme parâmetros já suportados pelo `GET …/mei-notas` ou extensão mínima acordada com backend).  
- **Erros Plugnotas:** reutilizar padrões existentes (`formatPlugnotasIntegrationError`, `getPlugnotasCodeFromUnknownError`, alertas de integração) com menção ao **tipo de documento** quando útil.  
- **Acessibilidade:** `fieldset`/`legend` ou grupo de rádio com nome acessível; foco e `aria-live` coerentes com o padrão já usado na área de emissão NFS-e.  
- **Backend / Plugnotas empresa (P0 se bloqueante):** se a emissão falhar sistematicamente por **nfe/nfce inativos** no cadastro, o incremento deve incluir **uma** das abordagens acordadas em §6.2 (habilitação guiada, PATCH documentado, ou feature flag + suporte). **Não** lançar UI de NFC-e/NF-e sem caminho honesto para o utilizador saber o que falta.  
- **Testes:** extensão de testes de rota/serviço já existentes **ou** testes de componente/contrato conforme política do repo; gates `lint`, `typecheck`, `test` (`AGENTS.md`).

### 5.2 Fora do escopo (fase 2 ou explícito “não”)

- **CT-e** na mesma aba (tipo pode existir no backend — só entra com requisito explícito).  
- **Substituir** Plugnotas ou motor fiscal próprio.  
- Emissão em massa, importação de XML de terceiros, **stock** automático.  
- **Paridade imediata no painel admin** (modal “Emitir …” com os mesmos tipos): **P2** — story derivada referenciando este PRD e `PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`.  
- **Auditoria fiscal completa** além do que o integrador e os registos actuais já guardam.

---

## 6. Decisões de produto (a fechar ou recomendações default)

### 6.1 Valor default do seletor

**Recomendação default deste PRD:** ao abrir a aba de emissão (ou ao entrar no Guia MEI), o tipo pré-seleccionado é **NFS-e**, para **máxima compatibilidade** com o comportamento actual e com a maioria dos MEIs focados em serviço.

**Alternativa:** “último tipo usado” persistido em `localStorage` — opcional em story P1 se o PO validar privacidade/UX.

**Critério de fecho:** story indica explicitamente qual opção foi implementada.

### 6.2 Habilitação NF-e / NFC-e no Plugnotas (empresa)

**Problema:** em fluxos de cadastro focados em NFS-e, o backend pode enviar `nfe`/`nfce` **inativos** sem `config` ao Plugnotas, o que **impede** emissão real de produto até a empresa estar configurada.

**Opções (escolher na story com @architect):**

| Opção | Descrição |
|-------|-----------|
| **A — Fluxo guiado na app** | Após o utilizador escolher NF-e ou NFC-e, se a consulta ao cadastro indicar indisponibilidade, mostrar **checklist** (certificado, CSC/token NFC-e, dados adicionais) e **ação** “Concluir configuração” que dispara `PATCH`/`POST` documentado. |
| **B — Suporte apenas** | UI informa que a funcionalidade exige **configuração no emissor**; link para suporte/documentação; sem PATCH automático. |
| **C — Feature flag** | NF-e/NFC-e só visíveis para contas/flags autorizadas enquanto o rollout é controlado. |

**Critério de fecho:** uma opção principal + mensagens de erro mapeadas (sem HTTP 500 opaco na UI).

### 6.3 Catálogo de produtos para NF-e / NFC-e

**Recomendação MVP:** permitir **emissão com itens preenchidos manualmente** (e opcionalmente “adicionar linha” / “remover linha”) **sem** obrigar integração com `catalogo/produtos` no primeiro incremento.

**Evolução P1:** reutilizar `GET/POST …/catalogo/produtos` **se** o modelo de dados e `documentType` no catálogo forem estendidos de forma compatível com NFS-e — **decisão de dados** na story com @architect (evitar duplicar entidades sem necessidade).

### 6.4 Troca de tipo com formulário parcialmente preenchido

**Recomendação default:** ao mudar o tipo (ex.: NFS-e → NFC-e), o sistema **reinicia** o estado do formulário **ou** pede **confirmação** explícita se houver dados não submetidos — para não misturar campos incompatíveis no payload.

**Critério de fecho:** UX spec ou story descreve o comportamento exacto (reset vs confirm dialog).

### 6.5 Restrição por perfil MEI / município

**Recomendação default:** não introduzir, no MVP, filtro por município no cliente; confiar em **validação do Plugnotas** + mensagens claras. Se o PO exigir **feature flag** ou bloqueio por perfil, tratar como **§6.2 opção C** ou requisito adicional na story.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-GUIA-FISC-01** | Na aba de **emissão** do Guia MEI, existe controlo principal para seleccionar o **tipo de documento**: **NFS-e**, **NF-e** ou **NFC-e**, com labels compreensíveis para o utilizador brasileiro. | P0 |
| **FR-GUIA-FISC-02** | Ao seleccionar **NFS-e**, o utilizador vê o **mesmo conjunto funcional** de blocos/copy que hoje suporta emissão NFS-e (**não regressão**). | P0 |
| **FR-GUIA-FISC-03** | Ao seleccionar **NF-e** ou **NFC-e**, o ecrã apresenta blocos para **emitente**, **destinatário** e **itens** (e demais campos acordados na story) adequados ao payload esperado pelo backend. | P0 |
| **FR-GUIA-FISC-04** | A submissão de emissão envia `documentType` **NFE** ou **NFCE** (normalização coerente com o backend) e `payload` com **modelo 55** ou **65** conforme o tipo; o servidor continua a validar modelo vs tipo. | P0 |
| **FR-GUIA-FISC-05** | A lista de notas (ou filtros associados) permite distinguir e filtrar **NFSE**, **NFE** e **NFCE** quando existirem registos desses tipos. | P0 |
| **FR-GUIA-FISC-06** | Erros devolvidos pela API (validação local ou Plugnotas) são apresentados de forma **legível** e **acessível**, identificando quando fizer sentido o **tipo de documento** em contexto. | P0 |
| **FR-GUIA-FISC-07** | Se a emissão NF-e/NFC-e não for possível por **configuração em falta** no emissor (empresa/certificado/CSC, etc.), a UI **bloqueia** ou **orienta** com mensagem explícita (sem falha silenciosa). | P0 |
| **FR-GUIA-FISC-08** | Existe **linha de ajuda contextual** por tipo (ex.: diferença entre NFC-e e NFS-e) para reduzir erro de interpretação. | P1 |
| **FR-GUIA-FISC-09** | (Opcional P1) Integração com **catálogo de produtos** para pré-preencher itens de NF-e/NFC-e, desde que não quebre o catálogo NFS-e existente. | P1 |
| **FR-GUIA-FISC-10** | (Opcional P2) **Paridade admin:** modal ou fluxo de emissão em nome do utilizador com o **mesmo seletor** de tipo e mesmas validações de UI. | P2 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-GUIA-FISC-01** | **Segurança** | Mantém `requireAuth` + `requireMeiEnabled` nas rotas existentes; sem expor dados fiscais de terceiros. |
| **NFR-GUIA-FISC-02** | **Consistência** | Mesma rota `POST /mei-notas/emitir`; sem fork de regras de negócio no cliente que contradizam o servidor. |
| **NFR-GUIA-FISC-03** | **Performance** | Lista e catálogos com limites já usados no Guia MEI; evitar re-render excessivo ao trocar tipo (memoização onde aplicável). |
| **NFR-GUIA-FISC-04** | **Acessibilidade** | Controlo de tipo nomeável por leitores de ecrã; foco ao mudar de modo; erros na região já usada para feedback de emissão. |
| **NFR-GUIA-FISC-05** | **Qualidade** | `npm run lint`, `npm run typecheck`, `npm test` por `AGENTS.md`; ficheiros tocados com file list na story. |
| **NFR-GUIA-FISC-06** | **Observabilidade** | Logs/metrics existentes no backend para emissão; novos erros de habilitação Plugnotas **não** vazam PII em mensagens públicas. |

---

## 9. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-GUIA-FISC-01** | Emissão **NFS-e** existente mantém contrato e fluxo de utilizador salvo melhorias cosméticas acordadas. |
| **CR-GUIA-FISC-02** | Webhooks e persistência de `document_type` / `plugnotas_id` permanecem canónicos; UI apenas consome e exibe tipos adicionais. |
| **CR-GUIA-FISC-03** | Rotas de setup (`certificado`, `empresa`) não são enfraquecidas; evoluções para ativar NFE/NFCE são **aditivas** ou documentadas como migração controlada. |
| **CR-GUIA-FISC-04** | Catálogo de **clientes** NFS-e existente não é removido; reutilização para **destinatário** em NF-e/NFC-e é **opcional** e tratada na story se incluída. |

---

## 10. Integração técnica (resumo — detalhe na story + architect)

| Área | Abordagem |
|------|-----------|
| **API emissão** | `POST /mei-notas/emitir` com `documentType` + `payload` (ou formato já aceite por `emitirNota`). |
| **Validação servidor** | `validatePayloadByDocumentType` — modelo 55 vs 65, `validateNfeLikePayload`. |
| **Plugnotas** | `emitirNfe` / `emitirNfce` em `nfe.service.js` / `nfce.service.js`. |
| **Empresa Plugnotas** | `empresa.service.js` — avaliar PATCH/POST para actuar `nfe`/`nfce` quando o produto exigir emissão real (§6.2). |
| **Frontend** | `GuidesMei.tsx`, serviços de API existentes para `mei-notas`; possível extração de componentes. |

---

## 11. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| **Adopção** | Utilização do seletor NF-e/NFC-e (evento analítico, se o produto já tiver base de eventos — **opcional**). |
| **Redução de fricção** | Menos erros “payload incompleto” antes do envio (validação UI + mensagens). |
| **Suporte** | Menos pedidos do tipo “a app não emite NFC-e” após lançamento (feedback qualitativo). |
| **Qualidade** | Zero regressões críticas em emissão NFS-e (QA smoke). |

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Empresa sem NFE/NFC-e activos no Plugnotas | Emissão falha sempre | §6.2 + **FR-GUIA-FISC-07**. |
| Complexidade fiscal (NCM, CFOP, CST) | Utilizador abandona | Ajuda contextual, tooltips, orientação a contador; MVP com campos mínimos já validados no backend. |
| Confusão NFS-e vs NFC-e | Nota errada ou suporte | **FR-GUIA-FISC-01**, **FR-GUIA-FISC-08**. |
| Ficheiro `GuidesMei.tsx` muito grande | Manutenção difícil | Extrair componentes; story com file list. |

---

## 13. Epic e stories (proposta)

**Epic:** Guia MEI — emissão fiscal multi-documento (NFS-e, NF-e, NFC-e) via Plugnotas.

| Story sugerida | Conteúdo mínimo |
|----------------|-----------------|
| **Story A (P0)** | Seletor de tipo + reset/confirmação ao trocar tipo; formulário NF-e/NFC-e mínimo alinhado a `validateNfeLikePayload`; submit `emitir`; testes. |
| **Story B (P0)** | Lista/filtros por `document_type`; labels na tabela; regresso visual NFC-e/NF-e. |
| **Story C (P0/P1)** | Habilitação empresa Plugnotas para NFE/NFCE (backend + copy UI) conforme §6.2. |
| **Story D (P1)** | Catálogo de produtos ou reutilização de destinatários — conforme §6.3 e CR-GUIA-FISC-04. |
| **Story E (P2)** | Paridade admin (**FR-GUIA-FISC-10**). |

Cada story deve referenciar este PRD, o brief, checklist, **file list** e gates.

---

## 14. Critérios de release / Definition of Done (produto)

- [ ] **FR-GUIA-FISC-01** a **FR-GUIA-FISC-07** satisfeitos.  
- [ ] **FR-GUIA-FISC-08** satisfeito ou explicitamente adiado com acordo PO (P1).  
- [ ] **NFR-GUIA-FISC-01** a **NFR-GUIA-FISC-05** verificados.  
- [ ] **CR-GUIA-FISC-01** a **CR-GUIA-FISC-04** sem regressão comprovada em QA.  
- [ ] Decisões **§6.1**, **§6.2**, **§6.3**, **§6.4** documentadas na story e reflectidas na UI/backend.  
- [ ] Architect validou contrato de payload e impacto em `empresa.service.js` (se aplicável).

---

## 15. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-06 | PM (Morgan — a partir do brief Atlas) | Versão inicial a partir de `brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md`. |

---

*Próximo passo canónico AIOX: **@architect** — contrato fino UI ↔ `emitir`, desenho de habilitação Plugnotas; **@sm** — story(ies) em `docs/stories/` com IDs **FR-GUIA-FISC-**\*; **@dev** — implementação com gates do `AGENTS.md`.*

— Morgan, planejando o futuro 📊
