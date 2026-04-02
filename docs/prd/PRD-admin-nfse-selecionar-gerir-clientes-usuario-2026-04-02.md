# PRD — Painel admin: selecionar e gerir clientes (tomadores) do utilizador na emissão de NFSe

**Versão:** 1.0  
**Data:** 2026-04-02  
**Tipo:** Brownfield — painel administrativo, API e UI (`AdminUserData`, modal “Emitir NFSe”)  
**Fonte canónica do pedido:** `docs/brief/brief-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`

**Relação com outros artefatos:**

- **Alinha-se** a `docs/brief/brief-area-cadastro-clientes-servicos-produtos.md` (catálogo no contexto do utilizador).  
- **Complementa** `docs/brief/brief-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` e `docs/prd/PRD-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` (Guia MEI — mesma fonte de dados `mei_nfse_clientes`, outro ator e superfície).  
- **Respeita** `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` e o serviço `mei-notas.service.js` — **sem** duplicar regras de negócio; admin delega nas mesmas operações de catálogo com `user_id` explícito no servidor.  
- **Stories** de catálogo MEI (`docs/stories/story-cat-mei-*.md`) permanecem referência para **paridade** de políticas (ex.: exclusão).  
- **Não altera** o contrato com o provedor fiscal de emissão: o payload de tomador na emissão admin mantém-se; evolui-se apenas **origem dos dados** na UI e **novas rotas admin** para catálogo.

---

## 1. Resumo executivo

No painel administrativo, ao **emitir NFSe em nome de um utilizador U selecionado**, o administrador preenche hoje **manualmente** CPF/CNPJ, razão social e e-mail do tomador. O produto já persiste, por utilizador, o catálogo **NFS-e** (`mei_nfse_clientes`), consumido no **Guia MEI** com listagem e gestão autenticada como o próprio user.

Este PRD define requisitos rastreáveis (**FR-ADM-NFSE-\***), NFRs, decisões de produto em aberto e critérios de release para:

1. **Seleção:** no modal “Emitir NFSe”, permitir escolher um **cliente já cadastrado de U** e **preencher** documento, razão social e e-mail (editáveis antes de submeter).  
2. **Gestão:** no mesmo contexto (fluxo preferencial **sem** sair da emissão), permitir **listar, criar e editar** clientes de U; **eliminar** apenas se estiver **alinhado** ao que o utilizador já pode fazer (paridade com stories/política de catálogo).  
3. **Rastreio:** UI deixa explícito que a emissão é **em nome de U** e que alterações no catálogo são **dados de U**.  
4. **Não regressão:** emissão **sem** escolher catálogo (entrada manual) permanece obrigatoriamente disponível.

---

## 2. Visão de produto (experiência)

O administrador autorizado deve **reutilizar o catálogo do MEI** ao emitir em nome dele: **menos cópia/cola**, **menos erro de transcrição** e **paridade** entre o que o utilizador vê no Guia MEI e o que o admin vê no painel. A gestão de tomadores habituais deve ser **acessível a um clique** a partir do modal, sem obrigar navegação a outra área do produto (preferência **A** do brief: painel lateral ou segundo passo modal).

O utilizador final (MEI) beneficia **indiretamente**: alterações feitas pelo admin no catálogo de U refletem-se na mesma tabela e aparecem nas próximas emissões do próprio utilizador.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Eficiência** | Admin copia/cola tomador de tickets ou sistemas externos. | Seleção a partir do catálogo + edição pontual no formulário. |
| **Fonte de verdade** | Catálogo existe por `user_id`; UI admin de emissão **não** consome. | **Uma** fonte (`mei_nfse_clientes`) para MEI e admin. |
| **Suporte** | Expectativa de “dados do MEI” inclui tomadores habituais. | Ligar modal admin ao **universo de clientes** de U. |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| **Admin / suporte** | Emitir para tomador habitual sem reintroduzir dados; corrigir e-mail ou razão no catálogo antes de emitir. | Abrir modal para U → ver lista / selecionar → campos preenchidos → ajustar se necessário → emitir. |
| **Admin** | Pré-cadastrar tomador em U e emitir de seguida. | “Gerir clientes” → criar → voltar ao modal → selecionar novo registo → emitir. |
| **MEI (efeito indireto)** | Catálogo coerente entre canais. | Após ação admin, Guia MEI lista os mesmos registos para U. |

**Stakeholders:** PO (decisões §6 e §7), UX (combobox, fluxo modal vs drawer), Architect (contrato API), Backend, Frontend, QA.

---

## 5. Escopo

### 5.1 Dentro do escopo

- **Backend:** rotas admin sob o mesmo padrão de autorização que `listAdminUserMeiNfse` / `emitirNotaAsAdmin` (`requireAdmin` + `ensureCanViewUser` ou equivalente canónico), operando **sempre** com `user_id = :userId` da URL — **nunca** confiar no cliente para o dono dos dados. Delegação em `meiNotasService.listarCatalogoClientes`, `criarCatalogoCliente`, `atualizarCatalogoCliente`, e delete **se** paridade com utilizador.  
- **Frontend:** `AdminUserData.tsx` (e/ou componente extraído), serviço `adminUserDataService.ts` — combobox/select **“Cliente do catálogo (opcional)”** com pesquisa; opção explícita **preencher manualmente**; carregamento da lista ao abrir modal ou ao expandir bloco tomador; **“Gerir clientes deste utilizador”** abrindo fluxo preferencial **A**.  
- **Carga de dados:** `limit` e opcionalmente `q` coerentes com `listarCatalogoClientes`; estado vazio com mensagem orientadora (brief §7.2).  
- **Acessibilidade:** labels, foco em sub-fluxos, erros anunciáveis — paridade com resto do painel admin.  
- **Testes:** rotas admin (403/404 para `userId` não autorizado, happy path listagem) conforme padrão existente.

### 5.2 Fora do escopo (validar com PO)

- Catálogo de **serviços/produtos** no modal admin (possível fase 2).  
- Importação em massa de tomadores pelo admin.  
- Permissões granulares além de “admin que já pode ver o utilizador”.  
- Alteração do contrato com o provedor fiscal (payload de emissão).  
- **Auditoria** explícita de “quem alterou o catálogo de quem” — **fase 2** salvo o projeto já ter padrão a reutilizar.

---

## 6. Decisões de produto (a fechar com PO)

### 6.1 Comportamento após selecionar cliente (persistência)

**Recomendação default deste PRD (alinhada ao brief §7.1):** ao selecionar um registo do catálogo, o sistema **apenas preenche o formulário** (estado local). **Não** persiste alterações nos campos até ação explícita do tipo **“Atualizar cadastro com estes dados”** ou equivalente, **se** o produto vier a incluir essa ação. A emissão usa **sempre** o payload atual do formulário, independentemente de ter havido seleção prévia.

**Critério de fecho:** story especifica claramente se existe botão de sincronizar catálogo a partir do formulário; na ausência desse botão, **nenhuma** escrita em `mei_nfse_clientes` ocorre só por editar campos após select.

### 6.2 Utilizador com MEI não habilitado

**Opções:** (a) ocultar bloco de catálogo; (b) somente leitura; (c) igual ao habilitado se dados puderem existir.  

**Critério de fecho:** PO escolhe uma opção; implementação e copy refletem a decisão sem ambiguidade.

### 6.3 Eliminação de cliente (paridade)

Se o fluxo do **utilizador** permitir `DELETE` no catálogo, o admin **deve** poder eliminar no âmbito de U **com a mesma política** (validações, efeitos colaterais). Caso contrário, **omitir** delete admin ou substituir por comportamento já definido em story de catálogo (ex.: apenas arquivar).

**Critério de fecho:** story referencia explicitamente a story/política de exclusão aplicável (`story-cat-mei-*` ou PRD de exclusão).

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-ADM-NFSE-01** | Com utilizador **U** selecionado e admin autenticado autorizado, o modal (ou bloco tomador) **lista** clientes do catálogo de **U** via API admin dedicada. | P0 |
| **FR-ADM-NFSE-02** | Selecionar um cliente **preenche** documento, razão social e e-mail no formulário de emissão; o admin pode **editar** antes de submeter. | P0 |
| **FR-ADM-NFSE-03** | O admin pode **emitir NFSe sem** selecionar catálogo (entrada **manual** intacta, com opção explícita “preencher manualmente” / valor vazio). | P0 |
| **FR-ADM-NFSE-04** | O admin pode **criar** cliente no catálogo de **U** a partir do fluxo de gestão ligado ao modal. | P0 |
| **FR-ADM-NFSE-05** | O admin pode **editar** cliente existente de **U** (campos permitidos pelo domínio — **paridade** com `PATCH` utilizador / serviço existente). | P0 |
| **FR-ADM-NFSE-06** | Se o produto permitir **delete** de cliente ao utilizador, admin com mesma política pode **eliminar** no catálogo de **U**; caso contrário, comportamento alinhado à story de catálogo (sem delete ou alternativa aprovada). | P1 |
| **FR-ADM-NFSE-07** | Falhas de API mostram **mensagem clara**; respostas e listagens **não** expõem dados de utilizadores fora do **U** da página (escopo sempre **U**). | P0 |
| **FR-ADM-NFSE-08** | Existe controlo de gestão (**“Gerir clientes deste utilizador”** ou equivalente) que abre fluxo **preferencial A** (drawer/modal secundário), sem obrigar rota dedicada neste entregável. | P1 |
| **FR-ADM-NFSE-09** | Copy da UI reforça que a emissão é **em nome do utilizador selecionado** e que o catálogo é **desse utilizador**. | P1 |

**Mapeamento ao brief:** **FR-ADM-NFSE-01** a **07** correspondem a **RF-ADM-NFSE-01** a **07** do brief §8; **08–09** detalham UX e rastreio do brief §5 e §7.

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-ADM-NFSE-01** | **Segurança** | Todas as operações de catálogo admin no **backend** com `requireAdmin` + `ensureCanViewUser(token, userId)` (ou equivalente); serviço opera com `user_id` da rota. |
| **NFR-ADM-NFSE-02** | **Consistência de domínio** | Mesmas validações que `criarCatalogoCliente` / `atualizarCatalogoCliente` (sem fork de regras). |
| **NFR-ADM-NFSE-03** | **Performance** | Lista com `limit`; pesquisa opcional `q` alinhada às rotas existentes de catálogo. |
| **NFR-ADM-NFSE-04** | **Acessibilidade** | Labels associados, foco ao abrir sub-fluxos, erros anunciáveis (objectivo alinhado a WCAG 2.1 AA na zona alterada). |
| **NFR-ADM-NFSE-05** | **Qualidade** | `npm run lint`, `npm run typecheck`, `npm test` conforme `AGENTS.md`; testes de rota admin para autorização e happy path de listagem. |
| **NFR-ADM-NFSE-06** | **Rate limiting / abuso** | Coerente com outras rotas admin já expostas; sem novo vetor desproporcional. |

---

## 9. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-ADM-NFSE-01** | Emissão admin existente (`POST .../mei-nfse/emitir`) mantém **contrato** de payload; apenas enriquece a **origem** dos dados na UI. |
| **CR-ADM-NFSE-02** | Rotas de catálogo **utilizador** (`/catalogo/clientes` com `req.user.id`) **não** são enfraquecidas; admin usa **rotas distintas** com `userId` validado no servidor. |
| **CR-ADM-NFSE-03** | Tabela `mei_nfse_clientes` e modelo de dados permanecem canónicos; **sem** migração obrigatória para este entregável salvo decisão arquitetural separada. |

---

## 10. Integração técnica (resumo)

| Área | Abordagem |
|------|-----------|
| **Backend** | Novas rotas em `admin.routes.js`, por exemplo: `GET/POST/PATCH` (+ `DELETE` se **FR-ADM-NFSE-06** aplicável) em `/admin/users/:userId/mei-catalogo/clientes` (e `/:id` onde necessário), delegando em `meiNotasService` existente. |
| **Frontend** | `adminUserDataService.ts` + `AdminUserData.tsx` (refactor para componente se o ficheiro exceder limite de manutenção). |
| **Testes** | Padrão existente para `admin.routes` / controller; casos 403/404 e listagem. |

---

## 11. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Eficiência operacional | Redução de retrabalho **qualitativa** (feedback de quem opera o painel admin). |
| Qualidade de dados | Menos erros de digitação em tomador em emissões assistidas (suporte / amostragem). |
| Paridade percebida | Admin e MEI veem o **mesmo** universo de clientes para **U** após ações no catálogo. |

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **MEI não habilitado** | UX confusa ou dados inesperados | Decisão explícita **§6.2** + copy e guards alinhados. |
| **Edição local vs catálogo** | Expectativa de “guardar ao emitir” | **§6.1** + copy clara; ação explícita se houver “atualizar cadastro”. |
| **Ficheiro AdminUserData grande** | Manutenção difícil | Extrair componentes; story com file list. |
| **Vazamento de escopo** | Admin acede a clientes de outro user | Revisão de código: sempre `userId` da rota + `ensureCanViewUser`. |

---

## 13. Epic e story (proposta)

**Epic:** Admin NFSe — catálogo de clientes do utilizador no modal de emissão.

| Story sugerida | Conteúdo mínimo |
|----------------|-----------------|
| **Story 1** | Rotas admin de catálogo + testes de autorização e listagem. |
| **Story 2** | UI: lista/combobox, preenchimento manual preservado, carga ao abrir modal. |
| **Story 3** | Fluxo “Gerir clientes” (criar/editar; delete se **FR-ADM-NFSE-06**); copy e a11y. |

As stories devem **referenciar** este PRD e o brief; checklist com **file list** e gates (`lint`, `typecheck`, `test`).

---

## 14. Critérios de release / Definition of Done (produto)

- [ ] **FR-ADM-NFSE-01** a **07** satisfeitos; **08–09** conforme acordo PO para o incremento.  
- [ ] Decisões **§6.1**, **§6.2** e **§6.3** **explicitadas** na story e reflectidas na UI/API.  
- [ ] **NFR-ADM-NFSE-01** a **06** verificados.  
- [ ] **CR-ADM-NFSE-01** a **03** sem regressão.  
- [ ] Architect validou contrato das rotas e reutilização do serviço (sem duplicação de regras).

---

## 15. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-02 | PM (a partir do brief Atlas) | Versão inicial a partir de `brief-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`. |

---

*Próximo passo canónico AIOX: @architect — contrato fino das rotas admin; @sm — story(ies) em `docs/stories/` com IDs FR-ADM-NFSE-* e estimativa; @dev — implementação com gates do `AGENTS.md`.*
