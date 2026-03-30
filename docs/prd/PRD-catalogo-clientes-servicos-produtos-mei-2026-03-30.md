# PRD — Catálogo MEI: áreas dedicadas de clientes e de serviços/produtos

**Versão:** 1.2  
**Data:** 2026-03-30  
**Tipo:** Brownfield — nova capacidade (frontend + backend)  
**Fontes:** [`docs/brief/brief-area-cadastro-clientes-servicos-produtos.md`](../brief/brief-area-cadastro-clientes-servicos-produtos.md); código atual (`mei-notas` catálogo, `GuidesMei.tsx`, `meiNotasService.ts`)

**Relação com outros PRDs:** complementa [`PRD-meu-financeiro-produto-brownfield-2026-03-26.md`](PRD-meu-financeiro-produto-brownfield-2026-03-26.md) e pode coexistir com melhorias de UI em [`PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`](PRD-meu-mei-ui-ux-melhoria-2026-03-30.md). Este PRD introduz **CRUD de catálogo** onde hoje existe apenas **listagem**.

---

## 1. Resumo executivo

O Meu Financeiro já expõe **listagem** de clientes e de serviços/produtos do catálogo NFS-e (`GET /mei-notas/catalogo/clientes` e `GET /mei-notas/catalogo/produtos`), consumida no fluxo de emissão em `GuidesMei.tsx`. Não existe, no repositório, **área dedicada** para o utilizador **cadastrar e editar manualmente** esses registos, nem rotas explícitas de criação/atualização.

Este PRD define **dois módulos de produto separados** (navegação e ecrãs distintos), **requisitos funcionais e não funcionais**, **compatibilidade** com o fluxo atual de emissão, **decisões de MVP** onde o brief deixou aberto, **métricas**, **riscos** e uma **estrutura de épico/histórias** para handoff ao SM.

---

## 2. Análise do projeto existente (brownfield)

| Aspeto | Estado atual |
|--------|----------------|
| **Análise** | Brief + inspeção de código (sem *document-project* completo nesta entrega). |
| **Frontend** | `frontend/src/pages/GuidesMei.tsx` — estado `nfseCatalogClientes` / `nfseCatalogProdutos`, selects no formulário de emissão. |
| **Cliente API** | `frontend/src/services/meiNotasService.ts` — `listarCatalogoNfseClientes`, `listarCatalogoNfseProdutos` (GET com `q`, `limit`, `documentType`). |
| **Backend** | `backend/src/routes/mei-notas.routes.js` — apenas `GET /catalogo/clientes`, `GET /catalogo/produtos` (`requireAuth`, `requireMeiEnabled`). |
| **Tipos** | `NfseCatalogCliente`, `NfseCatalogProduto` (campos alinhados a tomador/item fiscal). |

**Lacuna a fechar:** operações de **escrita** (API + UI) e **descoberta** (menu/rotas dedicadas), mantendo uma **única fonte de verdade** com o catálogo já usado na emissão.

---

## 3. Visão e objetivos de produto

O MEI (e perfis associados) deve conseguir **gerir o catálogo antes e durante** o ciclo de faturação: corrigir dados, pré-cadastrar tomadores e itens, e reutilizá-los **sem retrabalho** no ecrã de emissão.

**Objetivos mensuráveis (direção):**

1. Reduzir dependência exclusiva de “histórico de uso” ou de edição implícita só no momento da emissão.
2. Melhorar qualidade dos dados (documento, contacto, discriminação, CNAE, alíquota, valor sugerido) com validação explícita nos formulários.
3. Garantir que **criar/editar no catálogo** reflete **imediatamente** (ou após refresh previsível) nos selects de `GuidesMei` (ou rota equivalente futura).

---

## 4. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Descoberta | Não há “lugar” óbvio para ir ao catálogo fora do formulário de nota. | Duas entradas de menu claras: **Clientes** e **Serviços e produtos**. |
| Operações | Só leitura via API no app. | CRUD mínimo (criar + editar no MVP; ver secção 6). |
| Expectativa | Utilizadores compar com ERPs/emissores com cadastro dedicado. | Paridade de mental model sem duplicar fontes de dados. |

---

## 5. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| MEI autónomo | Cadastrar cliente fixo antes do primeiro serviço. | Criar cliente na área dedicada → emitir NFS-e → tomador aparece na lista/seleção. |
| MEI recorrente | Corrigir e-mail ou documento após erro na emissão. | Editar cliente → reabrir emissão → dados atualizados. |
| Prestador de serviços | Reutilizar item com CNAE/alíquota padrão. | Criar/editar serviço-produto → selecionar na emissão com valores sugeridos corretos. |

**Stakeholders:** Produto, Engenharia (frontend + backend), QA, suporte (copy de erros).

---

## 6. Escopo

### 6.1 Dentro do escopo (MVP — versão 1.0 deste PRD)

- **Duas áreas separadas** (rotas distintas ou páginas distintas): **Clientes do catálogo** e **Serviços e produtos do catálogo**.
- **Lista** com pesquisa (reutilizar contrato `q` + `limit` alinhado ao GET existente, com paginação ou “carregar mais” se necessário).
- **Criar** e **editar** cliente e serviço/produto via formulários com validação de campos obrigatórios **definidos pelo produto + arquitetura** após spike de persistência.
- **Integração** com auth existente: mesmo critério que `requireMeiEnabled` para **aceder** às áreas (utilizador sem MEI: **ocultar entradas de menu** e **bloquear rota** com mensagem amigável ou redirect — decisão única documentada na story de navegação).
- **Sincronização com emissão:** registos criados/editados **devem** aparecer no fluxo de emissão atual sem duplicar modelos de dados concorrentes.

### 6.2 Fora do escopo (fases futuras)

- Importação em massa (CSV/Excel).
- Sincronização bidirecional complexa com portais municipais ou provedores externos, salvo capacidade já existente encapsulada no backend.
- Gestão avançada de conflitos multi-utilizador (além de “último a gravar vence” salvo requisito legal futuro).

### 6.3 Decisões de produto propostas (resolver na story 1.1 / refinamento)

| Tema | Decisão proposta no MVP | Alternativa |
|------|-------------------------|-------------|
| Remoção | **Sem exclusão** no MVP; apenas criar/editar. Fase 2: arquivar ou apagar conforme API/provedor. | Incluir DELETE já no MVP se backend já suportar com baixo risco. |
| Utilizador sem MEI | **Ocultar** itens de menu + guard de rota com empty state / CTA para ativar MEI. | Mostrar somente leitura vazia (mais trabalho sem valor claro). |

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-CAT-01 | Existem **duas** entradas de navegação distintas: **Clientes** (catálogo MEI) e **Serviços e produtos** (catálogo MEI). | P0 |
| FR-CAT-02 | Utilizador autenticado com **MEI habilitado** vê e acede à **lista de clientes** do catálogo, com **campo de pesquisa** que utiliza o padrão de filtro já suportado pelo backend (`q` / `limit` conforme implementação). | P0 |
| FR-CAT-03 | Utilizador **cria** cliente manualmente; o sistema valida formato de **CPF/CNPJ** (dígitos/checksum conforme regra do projeto), **e-mail** quando preenchido, e campos mínimos acordados (ex.: nome, documento). | P0 |
| FR-CAT-04 | Utilizador **edita** cliente existente; alterações persistem e aparecem na lista. | P0 |
| FR-CAT-05 | Utilizador acede à **lista de serviços/produtos** com pesquisa análoga à de clientes. | P0 |
| FR-CAT-06 | Utilizador **cria** e **edita** serviço/produto (campos alinhados a `NfseCatalogProduto`: discriminação, CNAE, alíquota, valor sugerido, código, etc., conforme contrato final da API). | P0 |
| FR-CAT-07 | Após criar/editar, o registo é **selecionável** (ou encontrável por busca) no fluxo de **emissão** em `GuidesMei` (ou substituto) **sem** passos manuais não documentados (ex.: não exigir “hard refresh” salvo limitação técnica aceite e documentada). | P0 |
| FR-CAT-08 | Erros do backend ou do provedor são mostrados com **mensagem compreensível** e, quando seguro, **detalhe técnico** colapsável ou em log (sem vazar dados sensíveis). | P1 |
| FR-CAT-09 | (Opcional P2) Ordenação ou destaque por `last_used_at` na lista, se o backend ordenar ou o cliente puder ordenar sem custo excessivo. | P2 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| NFR-CAT-01 | **Autorização** | Mesmo nível que `GET /catalogo/*`; isolamento por utilizador/empresa conforme modelo atual de `mei-notas`. |
| NFR-CAT-02 | **Performance** | Listas não devem degradar UX: limites/paginação; evitar pedidos duplicados ao digitar (debounce). |
| NFR-CAT-03 | **Acessibilidade** | Formulários com labels, associação erro/campo, foco após erro; padrão alinhado ao restante frontend. |
| NFR-CAT-04 | **Qualidade** | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes alterados; extensão de testes de rotas (`mei-notas-routes.test.js`) para novos verbos. |
| NFR-CAT-05 | **Observabilidade** | Erros de escrita registados no servidor com contexto mínimo (request id, utilizador), sem dados fiscais completos em claro se política do projeto proíbe. |

---

## 9. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| CR-CAT-01 | Os endpoints **GET** existentes de catálogo **continuam** a funcionar para o fluxo de emissão; clientes antigos não quebram. |
| CR-CAT-02 | O modelo de dados exposto ao frontend permanece **compatível** com `NfseCatalogCliente` / `NfseCatalogProduto` (evoluções via campos opcionais ou versão de API acordada). |
| CR-CAT-03 | A UI nova segue **componentes e tokens** já usados em áreas MEI (cards, tabelas, modais, toasts), salvo exceção justificada na story. |
| CR-CAT-04 | Integração com **provedor de emissão** (se aplicável): contratos de escrita definidos pelo backend; fallback claro se o provedor não suportar campo. |

---

## 10. Objetivos de interface

| Área | Integração com UI existente | Ecrãs |
|------|-----------------------------|--------|
| Navegação | Agrupar sob **MEI / Notas** (ou secção equivalente já usada para `GuidesMei`) com **dois** itens explícitos. | — |
| Clientes | Reutilizar padrões de lista + modal/drawer de formulário como em `Recorrencias` ou listas admin, conforme consistência do repo. | Lista + formulário criar/editar. |
| Serviços/produtos | Idem. | Lista + formulário criar/editar. |

**Consistência:** mensagens de sucesso/erro via `toast` ou padrão já adoptado na app; estados de carregamento explícitos.

---

## 11. Restrições técnicas e integração

| Tema | Diretriz |
|------|----------|
| **Backend** | Adicionar rotas REST (nomes sugeridos para alinhamento: `POST/PATCH /mei-notas/catalogo/clientes`, `POST/PATCH /mei-notas/catalogo/produtos` — **confirmar** com implementação real e provedor). |
| **Persistência** | Spike obrigatório: confirmar se dados residem em **Supabase**, **provedor Plugnotas** (ou outro), ou **híbrido**; o PRD assume **uma fonte de verdade** espelhada nos GETs actuais. |
| **Frontend** | Novas rotas em `App.tsx` / router; funções em `meiNotasService.ts` ou módulo `meiCatalogService.ts` se reduzir acoplamento. |
| **Testes** | Testes de contrato de rota no backend; testes de serviço no frontend onde já existir mock de `apiClient`. |

### 11.1 Spike CAT-MEI-01 (2026-03-30) — conclusão

- **Persistência:** catálogo em **Supabase** (`mei_nfse_clientes`, `mei_nfse_produtos`); emissão **Plugnotas** grava a **nota** em `mei_nfse` e faz **upsert** no catálogo local — **não** depende de CRUD de catálogo no provedor.
- **Contrato de escrita:** ver documento canónico [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md) (rotas `POST`/`PATCH` propostas, exemplos JSON, `dedupe_key`, matriz de campos, **go** para CAT-MEI-02).

---

## 12. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Adoção | % de utilizadores MEI com pelo menos **1 cliente** e **1 serviço** criados manualmente em N semanas (analytics, se disponível). |
| Eficiência | Redução de tempo até primeiro preenchimento completo de emissão com tomador/item novos (baseline vs pós — estudo qualitativo ou telemetria de fluxo). |
| Qualidade | Queda de erros de validação na **emissão** relacionados a tomador/item mal preenchidos (suporte/feedback). |
| Estabilidade | Zero regressões P0 nos fluxos GET de catálogo e emissão após release. |

---

## 13. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Provedor não expõe CRUD de catálogo | ~~Bloqueio~~ **mitigado** para catálogo app-side | Spike: catálogo é **local (Supabase)**; escrita manual via API própria (ver §11.1). Risco mantém-se para **regras de emissão** no provedor/município, não para persistência do catálogo. |
| Campos obrigatórios variam por município | Rejeição na emissão após “sucesso” no cadastro | Mapear validações mínimas com arquiteto; mensagens que liguem cadastro ↔ emissão. |
| `GuidesMei` monolítico | Regressões | PRs pequenos; QA focalizada em emissão após cada story. |
| Concorrência “último grava” | Dados sobrepostos | Aceite no MVP; documentar para utilizadores multi-dispositivo se aplicável. |

---

## 14. Épico e sequência de histórias sugerida

**Épico único:** “Catálogo MEI — clientes e serviços/produtos com CRUD dedicado”.

**Racional:** uma entrega coordenada (API + UI + navegação) minimiza inconsistência entre listagem e escrita; histórias podem mergear incrementalmente se a API for entregue primeiro.

| # | História (título sugerido) | Valor | Notas |
|---|----------------------------|-------|-------|
| 1.1 | Spike: origem de persistência e contrato REST de escrita | Desbloqueio | Saída: ADR ou apêndice técnico + OpenAPI/comentários nas rotas. |
| 1.2 | Backend: POST/PATCH catálogo clientes e produtos + testes | API estável | Incluir validação e erros normalizados. |
| 1.3 | Frontend: serviços + página **Clientes** (lista, criar, editar) | UX dedicada | Guard MEI + empty states. |
| 1.4 | Frontend: página **Serviços e produtos** (lista, criar, editar) | UX dedicada | Reutilizar padrão da 1.3. |
| 1.5 | Navegação + integração emissão (refresh/cache) | Fecho E2E | Garantir FR-CAT-07; teste manual ou e2e smoke. |

**Verificação de integridade após cada entrega:** emissão NFS-e com seleção de cliente/produto existente e recém-criado; GETs de catálogo sem regressão.

---

## 15. Dependências e handoff

| Para | Ação |
|------|------|
| **@architect** | Fechar contrato REST, origem de dados, estratégia de erro com provedor. |
| **@sm** | Criar stories em `docs/stories/` com checklist, file list e critérios de aceitação copiados deste PRD. |
| **@po** | Priorizar P2 (FR-CAT-09) e política exata “sem MEI”. |
| **@qa** | Plano de regressão: `GuidesMei`, rotas `mei-notas`, auth. |

---

## 16. Registo de alterações

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 2026-03-30 | Morgan (PM) | Versão inicial a partir do brief de catálogo MEI. |
| 1.1 | 2026-03-30 | Spike CAT-MEI-01 | §11.1 + ajuste de risco §13; ligação a `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`. |
| 1.2 | 2026-03-30 | Morgan (PM) | Extensão de escopo: exclusão no catálogo documentada em [`PRD-catalogo-mei-exclusao-clientes-produtos-2026-03-30.md`](PRD-catalogo-mei-exclusao-clientes-produtos-2026-03-30.md) (fase 2; §6.3 do MVP mantém-se histórico até implementação). |

---

**Documento vivo:** atualizar após implementação real das rotas (CAT-MEI-02) se o contrato divergir do doc técnico v1.0.
