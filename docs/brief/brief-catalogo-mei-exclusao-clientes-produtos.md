# Brief — Exclusão de clientes e produtos no catálogo MEI (NFS-e)

**Data:** 2026-03-30  
**Tipo:** descoberta / enquadramento para PRD ou story  
**Relaciona com:** `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` (spike CAT-MEI-01), páginas `MeiCatalogoClientes` / `MeiCatalogoServicosProdutos`, emissão NFS-e em `GuidesMei`

---

## 1. Problema e oportunidade

Utilizadores com MEI precisam **corrigir erros de cadastro** e **remover entradas obsoletas** no catálogo local (clientes e serviços/produtos usados como atalhos na emissão). Hoje o MVP documentado prevê **criação e edição** (e upsert via emissão), mas **não** exclusão explícita na app — o que gera frustração quando um registo foi criado por engano ou duplicado de forma confusa.

---

## 2. Estado atual (brownfield)

| Aspeto | Situação |
|--------|----------|
| UI | Listas/modais de catálogo sem fluxo de “Excluir” documentado como requisito cumprido. |
| API REST | Rotas de catálogo orientadas a leitura e escrita parcial (POST/PATCH conforme stories); **sem** `DELETE` canónico no contrato público da story spike. |
| Supabase | Tabelas `mei_nfse_clientes` e `mei_nfse_produtos`; RLS com `SELECT`/`INSERT`/`UPDATE` para o dono; **sem** política `DELETE` para o cliente PostgREST — exclusão via app implica **backend com service role** + regras de autorização explícitas (como já na escrita). |
| PRD/spike | Spike afirma explicitamente: **DELETE não no MVP do produto**; tecnicamente viável numa fase posterior com rota + revisão de segurança. |

**Implicação:** a funcionalidade é **mudança de escopo de produto** e **extensão técnica** (API, possivelmente migração RLS, testes, UX de confirmação).

---

## 3. Objetivo da funcionalidade

Permitir que o utilizador autenticado com acesso MEI **elimine** um registo de **cliente** ou de **serviço/produto** do **seu** catálogo, com salvaguardas claras, sem comprometer a integridade mínima da app nem criar expectativa falsa sobre efeitos em notas **já emitidas**.

---

## 4. Princípios de produto (a validar com PM/PO)

1. **Dono dos dados:** só o `user_id` dono do registo pode apagar (paridade com listagem/edição).
2. **Irreversibilidade comunicada:** após confirmar, o registo deixa de aparecer no catálogo e nos selects da emissão; **não** se promete “apagar a nota” ou dados fiscais já transmitidos.
3. **Transparência sobre histórico:** se notas NFS-e já gravadas referenciam dados espelhados do catálogo, o brief assume que o modelo atual guarda **snapshot na nota** ou referências que **não** dependem da linha do catálogo para exibir PDF/histórico — **validação técnica obrigatória** antes de implementar hard delete.
4. **Alternativa futura:** se o risco de hard delete for alto, considerar **arquivo / soft delete** (`deleted_at`) para permitir recuperação administrativa — implica colunas ou tabela de arquivo e filtros nas queries de listagem.

---

## 5. Regras de negócio candidatas (elicitar com stakeholders)

| # | Regra | Notas |
|---|--------|--------|
| R1 | Exclusão apenas com **confirmação** explícita (modal ou diálogo nativo com copy clara). | Evita cliques acidentais em mobile. |
| R2 | Opcional: **bloquear** exclusão se existir dependência técnica (ex.: FK de outra entidade) — depende do schema real. | Se não houver FK, R2 pode ser “N/A”. |
| R3 | Após DELETE bem-sucedido, **atualizar lista** na página e **invalidar/refetch** catálogo na zona NFS-e (alinhado a FR-CAT-07 / padrões já usados em `GuidesMei`). | |
| R4 | **Auditoria:** registar `who`/`when`/`what` (log estruturado ou tabela de auditoria) para suporte — nice-to-have P1. | |
| R5 | Rate limiting / idempotência no backend como nas outras rotas sensíveis. | |

---

## 6. Experiência utilizador (resumo)

- **Onde:** nas páginas de catálogo (linha da tabela ou menu de ações) e/ou dentro do modal de edição (“Eliminar…”).
- **Fluxo:** Ação → confirmação com nome do cliente ou descrição resumida do produto → feedback de sucesso ou erro → lista atualizada.
- **Acessibilidade:** botão destrutivo identificável; foco preso no diálogo; mensagens de erro compreensíveis (rede, permissão, já removido).

---

## 7. Implicações técnicas (para @architect / @dev)

1. **Backend:** `DELETE /api/mei-notas/catalogo/clientes/:id` e `.../produtos/:id` (ou equivalente REST já convencionado), `requireAuth` + `requireMeiEnabled`, verificação `row.user_id === req.user.id`, resposta 204/404.
2. **Supabase:** ou DELETE via service role (como spike antecipou), ou soft delete com migração; se se expuser PostgREST direto no futuro, alinhar **RLS DELETE** com política explícita.
3. **Frontend:** serviços HTTP, estado da lista, testes RTL nos fluxos críticos; e2e opcional.
4. **Documentação:** atualizar contrato técnico canónico e PRD (FR novo ou alteração ao “fora do MVP” do DELETE).

---

## 8. Critérios de aceite sugeridos (rascunho para story)

- [ ] Utilizador com MEI pode excluir um cliente próprio; outro utilizador não (403/404).
- [ ] Utilizador com MEI pode excluir um produto/serviço próprio; idem.
- [ ] Confirmação obrigatória antes de persistir a exclusão.
- [ ] Após exclusão, o item **não** reaparece em `GET` de catálogo nem nos selects da emissão após refetch.
- [ ] Notas já emitidas (se aplicável) **continuam** consultáveis com os dados que tinham no momento da emissão — **a confirmar** com análise de schema.
- [ ] Testes automatizados cobrem API e, no mínimo, um fluxo UI por entidade.

---

## 9. Riscos e dependências

| Risco | Mitigação |
|-------|-----------|
| Utilizador apaga registo ainda “necessário” mentalmente para reemitir igual | Copy de UI + possível “duplicar antes de apagar” ou edição em vez de apagar. |
| Efeitos colaterais em relatórios ou caches | Refetch/invalidação explícita; testes de regressão na emissão. |
| Divergência PRD vs spike | Revisão PM + atualização de `catalogo-mei-persistencia-e-api` e stories CAT-MEI-* |

---

## 10. Próximos passos recomendados

1. **PO/PM:** decidir hard delete vs soft delete e política sobre histórico de notas.  
2. **Arquitetura / dev:** validar integridade referencial (`mei_nfse` e tabelas relacionadas).  
3. **SM:** abrir story única ou duas (clientes / produtos) com estimativa e dependência de migração se necessário.  
4. **QA:** casos negativos (ID alheio, ID inexistente, duplo clique, offline).

---

## 11. Resumo executivo

A exclusão no catálogo MEI é **desejada pelo utilizador** e **tecnicamente prevista como extensão** no spike, mas foi **excluída do MVP** por decisão de produto. Implementá-la exige **decisão explícita de escopo**, **desenho de UX de confirmação**, **endpoints DELETE seguros** e **validação de impacto** em dados de notas já emitidas.
