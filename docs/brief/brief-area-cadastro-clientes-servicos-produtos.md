# Brief: áreas dedicadas — cadastro e edição manual de clientes e de serviços/produtos

**Data:** 2026-03-30  
**Origem:** pedido de produto (Atlas / analista)  
**Produto:** Meu Financeiro (contexto MEI / emissão fiscal)

---

## 1. Resumo executivo

O utilizador pretende **duas áreas de produto distintas**: uma para **gerir clientes** (criar, editar, eventualmente remover ou arquivar) e outra para **gerir serviços/produtos**, também com cadastro e edição manual. Hoje o catálogo aparece sobretudo como **apoio à emissão** (seleção em fluxo), com API de **apenas listagem**.

---

## 2. Problema / oportunidade

- **Dor:** não existe um lugar claro na aplicação para “ir ao catálogo”, corrigir dados, pré-cadastrar tomadores e itens antes de emitir, ou manter consistência sem depender só do histórico de uso.
- **Oportunidade:** reduzir retrabalho na emissão, melhorar qualidade dos dados (CPF/CNPJ, e-mail, discriminação, CNAE, alíquota, valor sugerido) e alinhar expectativas de utilizadores MEI que já usam cadastros em outros sistemas.

---

## 3. Estado atual (brownfield)

| Aspeto | Situação |
|--------|----------|
| **Frontend** | `GuidesMei.tsx` carrega `nfseCatalogClientes` / `nfseCatalogProdutos` e usa selects no fluxo de emissão. |
| **Serviços** | `meiNotasService.ts`: `listarCatalogoNfseClientes`, `listarCatalogoNfseProdutos` (GET). |
| **Backend** | `mei-notas.routes.js`: apenas `GET /catalogo/clientes` e `GET /catalogo/produtos` (com `requireAuth`, `requireMeiEnabled`). |
| **Modelo de dados (API)** | Tipos `NfseCatalogCliente` e `NfseCatalogProduto` já descrevem campos úteis (documento, nome, e-mail; código, CNAE, discriminação, alíquota, valor_sugerido, etc.). |

**Lacuna:** não há rotas nem UI de **criação, atualização ou remoção** explícitas no âmbito deste repositório (a persistência pode estar no serviço externo de notas; isso deve ser confirmado na implementação).

---

## 4. Objetivos

1. Oferecer **navegação dedicada** a “Clientes” e a “Serviços / produtos” (rotas ou secções separadas, não apenas dropdowns dentro da emissão).
2. Permitir **cadastro manual** e **edição** dos registos permitidos pelo domínio fiscal (validações alinhadas ao que a emissão já exige).
3. Manter **paridade** com o catálogo usado na emissão (mesma fonte de verdade: após gravar, os itens devem aparecer nos selects de emissão).

---

## 5. Fora de âmbito (sugerido, a validar com PO)

- Importação em massa (CSV) — pode ser fase 2.
- Sincronização bidirecional complexa com portal da prefeitura/provedor, salvo se já existir API pronta no backend.
- Gestão de clientes/produtos **sem** `mei` habilitado — definir se as áreas ficam ocultas ou somente leitura.

---

## 6. Proposta de experiência (UX)

### 6.1 Clientes

- Lista com busca/filtro (reutilizar padrão de `q` + `limit` se aplicável).
- Ação “Novo cliente” → formulário (mínimo sugerido: nome, documento CPF/CNPJ, e-mail; campos adicionais conforme `NfseCatalogCliente` e regras NFS-e).
- Ação “Editar” por linha → mesmo formulário em modo edição.
- Comportamento opcional: “último uso” / ordenação por `last_used_at` na listagem.

### 6.2 Serviços / produtos

- Lista com busca.
- Ação “Novo” → formulário (discriminação, CNAE, alíquota, valor sugerido, código interno, etc.).
- Ação “Editar” por linha.

### 6.3 Navegação

- Entrada no menu lateral ou agrupamento sob “MEI / Notas” com **dois itens** explícitos (Clientes | Serviços e produtos), para respeitar o pedido de **área separada para cada**.

---

## 7. Requisitos funcionais (rascunho)

| ID | Descrição |
|----|-----------|
| RF-01 | Utilizador autenticado com MEI (ou política definida) acede à lista de clientes do catálogo. |
| RF-02 | Utilizador cria cliente manualmente; validações impedem dados inválidos óbvios (documento, e-mail). |
| RF-03 | Utilizador edita cliente existente. |
| RF-04 | Utilizador acede à lista de serviços/produtos. |
| RF-05 | Utilizador cria e edita serviço/produto manualmente. |
| RF-06 | Alterações refletem na emissão (GuidesMei ou equivalente) sem passos manuais extra. |
| RF-07 | Mensagens de erro claras quando o backend/provedor recusar operação. |

---

## 8. Requisitos não funcionais

- **Segurança:** mesmas regras de auth que `GET /catalogo/*`; RLS ou isolamento por `user_id` / empresa conforme schema existente.
- **Performance:** listas paginadas ou limite padrão coerente com hoje (`limit` na query).
- **Acessibilidade:** formulários com labels, foco e erros anunciáveis (alinhado ao resto do frontend).

---

## 9. Dependências técnicas (para @architect / @dev)

1. **Backend:** expor (ou reutilizar no serviço de notas) operações **POST/PATCH** (e **DELETE** ou **arquivar**, se desejado) para clientes e produtos, espelhando o contrato esperado pelo provedor/armazenamento atual.
2. **Frontend:** novas páginas ou rotas + serviços em `meiNotasService.ts` (ou módulo dedicado).
3. **Testes:** contratos de rota (como em `mei-notas-routes.test.js`) e testes de serviço onde já existir padrão.

---

## 10. Critérios de aceitação (testáveis)

1. Existem **duas** entradas de navegação distintas: uma só para clientes e outra só para serviços/produtos.
2. É possível **criar** e **editar** pelo menos um cliente e um serviço/produto manualmente e **vê-los na lista** após guardar.
3. Os mesmos registos aparecem como opções (ou resultados de busca) no fluxo de **emissão** atual.
4. Utilizador sem permissão / sem MEI vê comportamento definido (bloqueio ou empty state), sem erros 500 silenciosos.

---

## 11. Riscos e perguntas em aberto

1. O catálogo é **100% local (Supabase)** ou **delegado ao provedor** de emissão? Isso define esforço de API.
2. **Remoção:** permitir apagar, apenas arquivar, ou só editar?
3. **Conflitos:** dois utilizadores da mesma empresa editam o mesmo cliente — último a gravar ganha?
4. Campos obrigatórios variam por município/NFS-e — precisamos de matriz de validação por `documentType`?

---

## 12. Handoff sugerido

- **@pm / @po:** priorizar escopo (MVP sem delete vs. completo), política multi-empresa, copy da UI.
- **@architect:** desenhar contrato REST final e origem da persistência.
- **@sm:** quebrar em story(s) em `docs/stories/` com checklist e file list.

---

**Documento vivo:** atualizar após decisões de API e de produto.
