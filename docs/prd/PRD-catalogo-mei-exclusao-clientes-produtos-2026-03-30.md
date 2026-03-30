# PRD — Catálogo MEI: exclusão de clientes e de serviços/produtos

**Versão:** 1.0  
**Data:** 2026-03-30  
**Tipo:** Brownfield — extensão de capacidade (API + UI)  
**Fonte:** [`docs/brief/brief-catalogo-mei-exclusao-clientes-produtos.md`](../brief/brief-catalogo-mei-exclusao-clientes-produtos.md)

**Relação com outros documentos:**

- Altera a decisão de MVP em [`PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md`](PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md) §6.3 (*Remoção: sem exclusão no MVP*) — esta entrega **introduz** exclusão como **fase 2** canónica.
- Contrato técnico base: [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md) — **deve ser revisto e atualizado** com verbos `DELETE`, semântica de resposta e (se aplicável) RLS ou soft delete.
- Complementa [`PRD-meu-financeiro-produto-brownfield-2026-03-26.md`](PRD-meu-financeiro-produto-brownfield-2026-03-26.md) na vertente MEI / NFS-e.

---

## 1. Resumo executivo

O catálogo MEI (`mei_nfse_clientes`, `mei_nfse_produtos`) já suporta **listagem, criação e edição** (stories CAT-MEI-02 … 05). O spike original excluiu **DELETE** do MVP de produto por risco e priorização. Os utilizadores continuam a precisar de **remover registos criados por erro, duplicados ou obsoletos**, sem depender de suporte ou de “workarounds” na emissão.

Este PRD define **exclusão explícita** no **mesmo modelo de dados** e **mesmo critério de acesso** que o CRUD atual (`requireAuth`, `requireMeiEnabled`, isolamento por `user_id`), com **confirmação obrigatória**, **atualização da UI e da zona de emissão** após sucesso, e **garantias** sobre o impacto em **notas já emitidas** (validação técnica pré-implementação).

---

## 2. Análise brownfield

| Aspeto | Estado atual |
|--------|----------------|
| **Persistência** | Supabase; backend com **service role** nas escritas; RLS com `SELECT`/`INSERT`/`UPDATE` para o dono; **sem** política `DELETE` exposta ao PostgREST. |
| **API** | `POST`/`PATCH` em catálogo (conforme CAT-MEI-02); **sem** rota `DELETE` pública documentada. |
| **UI** | `MeiCatalogoClientes`, `MeiCatalogoServicosProdutos` — criar/editar; sem fluxo de excluir. |
| **Emissão** | `GuidesMei` consome catálogo via GET; FR-CAT-07 cobre refetch após criar/editar — o mesmo padrão aplica-se após **excluir**. |

**Lacuna:** operação de **remoção** segura, rastreável em testes, alinhada ao brief de análise.

---

## 3. Visão e objetivos

**Visão:** O utilizador com MEI trata o catálogo como **cadastro próprio completo** (incluindo corrigir a vida útil dos registos removendo os que não quer reutilizar).

**Objetivos:**

1. Reduzir frustração e pedidos de suporte por registos “presos” no catálogo.
2. Manter **paridade de segurança** com criar/editar (só o dono; mesmos guards).
3. Não degradar a **consulta de notas históricas** nem criar expectativa de apagar dados fiscais já transmitidos.

---

## 4. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Erro humano | Cliente ou item criado incorretamente ou duplicado. | Exclusão com confirmação e copy clara sobre irreversibilidade **no catálogo**. |
| Expectativa legal | Utilizador pode confundir “apagar cadastro” com “anular nota”. | Mensagens que **explicitam** que notas emitidas não são revogadas por esta ação. |
| Consistência | Lista de emissão mostra entradas fantasma do ponto de vista do utilizador. | Refetch/invalidação alinhada a FR-CAT-07. |

---

## 5. Personas e cenários

| Persona | Cenário de validação |
|---------|----------------------|
| MEI autónomo | Apaga cliente de teste → deixa de aparecer na lista e nos selects NFS-e após navegação/refetch; emissões antigas com esse tomador **continuam listáveis** se o produto guardar snapshot (confirmar em implementação). |
| MEI recorrente | Remove serviço obsoleto → não volta a aparecer na pesquisa de itens; pode criar novo item equivalente depois. |
| Admin / suporte | (P1) Evidência em log de exclusão para diagnóstico, sem expor PII em excesso. |

---

## 6. Escopo

### 6.1 Dentro do escopo (MVP deste PRD)

- **Exclusão de um cliente** do catálogo NFS-e do utilizador (por `id` de registo), com **diálogo de confirmação** mostrando identificador humano (nome / documento resumido).
- **Exclusão de um serviço/produto** do catálogo, com confirmação (discriminação ou código resumido).
- **Backend:** endpoint(s) `DELETE` autenticados, validação `user_id`, respostas **204** ou **404** (id inexistente ou não pertencente ao utilizador — preferir **404** uniforme para não vazar existência, se política de segurança do projeto assim o fixar).
- **Frontend:** ação na lista ou no modal de edição; atualização otimista ou refetch da lista; alinhamento com **emissão** (refetch quando aplicável, igual espírito a FR-CAT-07).
- **Testes:** contrato de rota no backend; pelo menos **um** fluxo RTL por entidade no frontend (confirmação + remoção da lista).

### 6.2 Fora do escopo (fases futuras)

- Exclusão em massa (multi-select).
- Papelera / restauração de 30 dias **salvo** se a decisão §6.3 escolher **soft delete** como MVP — nesse caso, “restaurar” pode ficar P2.
- Exclusão em cascata de notas fiscais ou integração com cancelamento municipal.

### 6.3 Decisão de produto: hard delete vs soft delete

| Opção | Quando escolher | Implicação |
|-------|-----------------|------------|
| **A — Hard delete (padrão proposto)** | Schema **sem** FK do catálogo para `mei_nfse` (ou notas guardam snapshot) e risco aceite pelo PO. | Implementação mais simples; spike/doc técnico atualizado; DELETE SQL via service role. |
| **B — Soft delete** | Arquitetura encontra dependências ou necessidade forte de auditoria/recuperação. | Migração `deleted_at` (ou equivalente); todos os `GET` de catálogo filtram `deleted_at IS NULL`; UI mostra “Arquivado” apenas se produto quiser P2. |

**Resolução:** iniciar por **A** no refinamento técnico; se a análise de schema (`mei_nfse` + payloads) **obrigar** integridade referencial, **mudar para B** antes de codificar DELETE físico.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-CAT-10 | Utilizador com **MEI habilitado** pode **excluir** um **cliente** do seu catálogo, após **confirmação explícita** (modal ou diálogo acessível). | P0 |
| FR-CAT-11 | O mesmo utilizador pode **excluir** um **serviço/produto** do seu catálogo, após confirmação explícita. | P0 |
| FR-CAT-12 | Após exclusão bem-sucedida, o registo **não** aparece na **lista** da página de catálogo nem nos **atalhos/selects** de emissão NFS-e após o mecanismo de atualização já acordado (refetch ao separador, visibilidade, ou equivalente — paridade com FR-CAT-07). | P0 |
| FR-CAT-13 | A UI comunica que a ação **remove o atalho do catálogo** e é **irreversível** neste contexto; **não** afirma cancelamento de notas já emitidas. | P0 |
| FR-CAT-14 | Tentativa de excluir recurso de **outro** utilizador ou id inexistente resulta em erro **seguro** (404/403 conforme padrão do projeto), sem vazar dados. | P0 |
| FR-CAT-15 | (P1) Registo estruturado no servidor da exclusão (`user_id`, `catalog_entity`, `record_id`, timestamp) para suporte. | P1 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| NFR-CAT-06 | **Idempotência:** segundo `DELETE` no mesmo id → 404 ou 204 conforme convenção documentada; sem efeitos colaterais duplicados. | |
| NFR-CAT-07 | **Performance:** exclusão única &lt; 2 s p95 em condições normais; sem refetch global agressivo em todo o `GuidesMei`. | Alinhado a NFR-CAT-02. |
| NFR-CAT-08 | **Acessibilidade:** foco no diálogo, botão destrutivo identificável (`aria` coerente), escape fecha modal. | |
| NFR-CAT-09 | **Qualidade:** `lint`, `typecheck`, `testes` nos pacotes alterados; extensão de testes de rotas backend para `DELETE`. | |
| NFR-CAT-10 | **Segurança:** mesmos middlewares que `POST`/`PATCH` de catálogo; sem bypass de `user_id`. | |

---

## 9. Requisitos de compatibilidade

| ID | Requisito |
|----|-----------|
| CR-CAT-05 | Os endpoints **GET** e **POST/PATCH** de catálogo **mantêm** comportamento atual para clientes não afetados. |
| CR-CAT-06 | Registos de **notas já persistidas** (`mei_nfse` ou equivalente) **permanecem** consultáveis; se a implementação usar apenas FK por id de catálogo, **validar** antes do hard delete — caso contrário aplicar soft delete (§6.3-B). |
| CR-CAT-07 | Tipos `NfseCatalogCliente` / `NfseCatalogProduto` no frontend **não** exigem campo novo salvo soft delete (`deleted_at`) na opção B. |

---

## 10. Experiência de interface

| Elemento | Diretriz |
|----------|----------|
| **Entrada** | Botão ou ícone “Excluir” / “Remover do catálogo” na linha da tabela e/ou secção perigosa no modal de edição. |
| **Confirmação** | Título claro; corpo com nome do cliente ou resumo do item; botões “Cancelar” (primário seguro) e “Excluir” (destrutivo). |
| **Feedback** | Toast ou mensagem de sucesso; em erro, mensagem compreensível (rede, sessão expirada). |
| **Mobile** | Área de toque adequada; confirmação full-screen ou modal conforme padrão do app. |

---

## 11. Restrições técnicas e integração

| Tema | Diretriz |
|------|----------|
| **REST** | `DELETE /api/mei-notas/catalogo/clientes/:id` e `DELETE /api/mei-notas/catalogo/produtos/:id` (ou prefixo já convencionado no backend) — **confirmar** path final na story. |
| **Supabase** | DELETE via cliente service role com cláusula `user_id = req.user.id`; se no futuro o cliente PostgREST for usado diretamente, adicionar política RLS `DELETE` explícita. |
| **Documentação** | Atualizar `catalogo-mei-persistencia-e-api-2026-03-30.md` com semântica DELETE, exemplos de erro e decisão hard/soft. |
| **Frontend** | Funções em `meiNotasService.ts` (ou módulo de catálogo existente); invalidação de estado partilhado com `GuidesMei` se existir cache em memória. |

---

## 12. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Utilidade | % de utilizadores MEI que executam ≥1 exclusão em N semanas (se analytics disponível) ou redução de tickets “apagar cliente”. |
| Segurança | Zero incidentes de exclusão cross-user em QA/produção. |
| Estabilidade | Zero regressões P0 em emissão NFS-e e GET de catálogo após release. |

---

## 13. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| FK ou referência implícita nota → catálogo | Corrupção ou perda de visualização de histórico | Gate técnico antes do merge; preferir soft delete se necessário. |
| Duplo clique em Excluir | Pedidos duplicados | Desabilitar botão durante request; idempotência (NFR-CAT-06). |
| Utilizador arrependido | Suporte | P1: soft delete + recuperação; ou orientar a recriar registo. |

---

## 14. Épico e histórias sugeridas

**Épico:** “Catálogo MEI — exclusão de clientes e produtos”.

| # | História (título sugerido) | Valor |
|---|----------------------------|-------|
| 2.1 | Análise de integridade: `mei_nfse` vs catálogo (gate hard/soft delete) | Desbloqueio |
| 2.2 | Backend: `DELETE` clientes + produtos + testes de rota | API |
| 2.3 | Frontend: exclusão clientes (UI + serviço + teste RTL) | UX |
| 2.4 | Frontend: exclusão serviços/produtos + teste RTL | UX |
| 2.5 | Regressão emissão + atualização doc técnico | Fecho |

**Dependência:** CAT-MEI-02 (API escrita) e páginas CAT-MEI-03/04 concluídas ou equivalentes.

---

## 15. Dependências e handoff

| Para | Ação |
|------|------|
| **@architect** | Validar schema e decisão A/B em §6.3; assinar contrato `DELETE`. |
| **@sm** | Stories `docs/stories/story-cat-mei-06-…` (números livres) com critérios deste PRD. |
| **@dev** | Implementar após gate 2.1 se hard delete. |
| **@qa** | Matriz: dono/alheio, id inválido, duplo submit, offline, regressão FR-CAT-07. |

---

## 16. Registo de alterações

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 2026-03-30 | Morgan (PM) | PRD inicial a partir do brief de exclusão no catálogo MEI. |

---

**Documento vivo:** após implementação, alinhar com paths reais da API e com a versão revista do documento técnico canónico.
