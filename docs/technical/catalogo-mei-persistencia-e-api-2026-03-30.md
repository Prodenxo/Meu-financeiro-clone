# Catálogo MEI (NFS-e) — persistência e contrato API de escrita

**Versão:** 1.1  
**Data:** 2026-03-30  
**Spike:** STORY-CAT-MEI-01  
**Estado:** canónico para CAT-MEI-02 … CAT-MEI-08 (DELETE em §7.5) até nova ADR rever.

---

## 1. Conclusão executiva (go/no-go)

| Pergunta | Resposta |
|----------|----------|
| Onde persiste o catálogo? | **Supabase (Postgres)** — tabelas `public.mei_nfse_clientes` e `public.mei_nfse_produtos`. **Não** há catálogo de tomador/serviço na Plugnotas como fonte de verdade da app. |
| A emissão alimenta o catálogo? | **Sim.** Após `emitirNota`, o serviço chama `upsertClienteCatalogo` e `upsertProdutosCatalogo` (best-effort; falhas só geram `console.warn`). |
| POST/PATCH dedicados existem hoje? | **Não.** Apenas `GET /api/mei-notas/catalogo/clientes` e `GET /api/mei-notas/catalogo/produtos`. |
| **Go** para implementar CRUD app-side? | **Sim (go).** Escrita pode ser implementada **no backend** com **service role** Supabase nas mesmas tabelas, espelhando validações de domínio e `dedupe_key`, **sem** depender de API de catálogo do provedor fiscal. |
| DELETE no MVP? | **Fase 2 (CAT-MEI-06):** rotas `DELETE` autenticadas no backend com **service role**; sem FK de `mei_nfse` para `id` do catálogo (notas usam `payload_json`, sem referência relacional) — **hard delete** aprovado no gate 2026-03-30. RLS continua sem política `DELETE` para PostgREST direto. |

---

## 2. Fluxo de dados (leitura)

```
Browser → GET /api/mei-notas/catalogo/{clientes|produtos}
       → mei-notas.controller (requireAuth, requireMeiEnabled)
       → mei-notas.service.listarCatalogoClientes | listarCatalogoProdutos
       → Supabase (service role) SELECT … WHERE user_id = req.user.id
       → JSON para o frontend (tipos NfseCatalogCliente / NfseCatalogProduto)
```

- **Ficheiros de referência:** `backend/src/routes/mei-notas.routes.js`, `backend/src/controllers/mei-notas.controller.js`, `backend/src/services/mei-notas.service.js` (funções `listarCatalogo*`).
- **Autorização HTTP:** igual à emissão — utilizador autenticado + MEI habilitado (`requireMeiEnabled`).

---

## 3. Fluxo de dados (escrita hoje — só via emissão)

```
emitirNota(userId, input)
  → adapter.emitir (Plugnotas)
  → insertRecord em public.mei_nfse (nota)
  → upsertClienteCatalogo(userId, payload, { documentType })
  → upsertProdutosCatalogo(userId, payload, { documentType })
```

- **Funções:** `upsertClienteCatalogo`, `upsertProdutosCatalogo`, `buildClienteCatalogEntry`, `buildProdutoCatalogEntries` em `mei-notas.service.js`.
- **Conflito UPSERT:** `onConflict: 'user_id,document_type,dedupe_key'` (índice único correspondente nas migrações).

---

## 4. Modelo físico (Supabase)

### 4.1 `public.mei_nfse_clientes`

| Coluna | Notas |
|--------|--------|
| `id` | UUID PK |
| `user_id` | FK `auth.users` |
| `document_type` | ex.: `NFSE` (constraint em migração `20260312114000_*`) |
| `dedupe_key` | Texto único por `(user_id, document_type, dedupe_key)` |
| `documento` | Apenas `NULL` ou **11 ou 14** caracteres (`mei_nfse_clientes_documento_len_chk`) |
| `nome`, `email` | Opcionais em DB; lógica de emissão exige tomador completo na **nota**, não necessariamente no catálogo |
| `metadata_json` | JSONB (opcional) |
| `last_used_at`, `created_at`, `updated_at` | Timestamps |

**RLS:** `SELECT`, `INSERT`, `UPDATE` para `auth.uid() = user_id`. **Sem** política `DELETE` explícita (utilizador anónimo/authenticated via PostgREST não apaga). O backend usa **`createSupabaseClient({ useServiceRole: true })`**, que **contorna RLS** — a segurança de escrita via API REST da app deve impor sempre `user_id` = utilizador da sessão.

### 4.2 `public.mei_nfse_produtos`

| Coluna | Notas |
|--------|--------|
| `id` | UUID PK |
| `user_id`, `document_type`, `dedupe_key` | Igual ideia ao cliente |
| `codigo`, `cnae` | `NOT NULL` com default `''` na migração base |
| `discriminacao` | `NOT NULL` |
| `aliquota` | `numeric(10,4)` nullable |
| `valor_sugerido` | `numeric(14,2)` nullable |
| `metadata_json` | JSONB opcional |

**RLS:** igual ao cliente; sem DELETE público.

**Migrações:** `supabase/migrations/20260312103000_create_mei_nfse_catalog_tables.sql`, `20260312114000_add_document_type_to_mei_nfse_catalog.sql`.

---

## 5. Regras de `dedupe_key` (código atual)

### 5.1 Cliente (NFS-e)

- Com documento normalizado: `doc:{documento}` (apenas dígitos, 11 ou 14).
- Sem documento mas com nome/e-mail: `fallback:{nomeNormalizado}|{email}`.

Referência: `buildClienteCatalogEntry` em `mei-notas.service.js`.

### 5.2 Produto / serviço (NFS-e)

- Por linha de `payload.servico`:  
  `servico:{codigo}|{cnae}|{discriminacaoNormalizada}|{aliquota4casas}`.

Referência: `buildProdutoCatalogEntries` em `mei-notas.service.js`.

### 5.3 Cadastro **manual** (recomendação para CAT-MEI-02)

- **Cliente:** reutilizar a **mesma** regra que `buildClienteCatalogEntry` para manter um único registo por CPF/CNPJ por `document_type`. Se o utilizador criar sem CPF/CNPJ válido, alinhar com constraint DB (11/14) — na prática o MVP deve **exigir** documento válido para POST manual.
- **Produto:** para linhas criadas só pela UI (sem espelhar uma linha de emissão), usar prefixo estável que **não colida** com chaves `servico:…` geradas na emissão, por exemplo:  
  `manual:{uuid_v4}`  
  gerado no servidor no POST. Assim alterações futuras de código/CNAE/discriminação em PATCH **não** criam duplicados por conflito com upserts da emissão. Alternativa (mais complexa): recalcular `dedupe_key` no PATCH como na emissão e fazer upsert — documentar se se escolher este caminho.

---

## 6. Matriz mínima de campos (MVP catálogo + ligação à emissão NFS-e)

A **prefeitura/provedor** pode exigir campos adicionais no **payload de emissão**; o catálogo guarda um **subconjunto** usado pelos selects em `GuidesMei`. Validação na **emissão** permanece a autoridade final (ver testes `mei-notas-core.test.js`).

### 6.1 Cliente (UI + API interna)

| Campo | Obrigatório MVP catálogo | Validação | Nota |
|-------|---------------------------|-----------|------|
| `documentType` | Sim (default `NFSE`) | Enum já usado (`normalizeDocumentType`) | Query/body |
| `documento` | Sim | 11 ou 14 dígitos; checksum CPF/CNPJ recomendado no backend | Constraint DB |
| `nome` | Sim | Não vazio | Alinha a `razaoSocial` na emissão |
| `email` | Não | Formato e-mail se presente | |
| `metadata_json` | Não | Objeto JSON limitado (tamanho/chaves) se exposto | |

### 6.2 Serviço / produto (UI + API interna)

| Campo | Obrigatório MVP catálogo | Validação | Nota |
|-------|---------------------------|-----------|------|
| `documentType` | Sim | `NFSE` default | |
| `discriminacao` | Sim | Não vazio | NOT NULL na DB |
| `codigo` | Não | string | Default `''` |
| `cnae` | Não | string | Default `''`; pode ser exigido na emissão conforme município |
| `aliquota` | Não | número | |
| `valor_sugerido` | Não | monetário | |
| `metadata_json` | Não | | |

**Risco PRD §13 (município):** se CNAE/alíquota forem obrigatórios para **aprovação** da nota num dado município, a UI pode mostrar aviso (*copy*) de que dados incompletos no catálogo ainda podem falhar na emissão — sem duplicar toda a matriz municipal neste documento.

---

## 7. Contrato REST proposto (implementação CAT-MEI-02 + CAT-MEI-06)

**Prefixo:** `/api/mei-notas` (já montado em `backend/src/routes/index.js`).

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/catalogo/clientes` | Cria ou substitui por `dedupe_key` implícito (mesma lógica que upsert emissão). |
| `PATCH` | `/catalogo/clientes/:id` | Atualiza campos permitidos do registo do `user_id` da sessão. |
| `DELETE` | `/catalogo/clientes/:id` | Remove o registo **se** `id` existir e `user_id` coincidir com a sessão. Ver semântica §7.5. |
| `POST` | `/catalogo/produtos` | Cria linha com `dedupe_key` servidor (`manual:uuid`). |
| `PATCH` | `/catalogo/produtos/:id` | Atualiza campos permitidos. |
| `DELETE` | `/catalogo/produtos/:id` | Igual ao DELETE de clientes (§7.5). |

**Query params dos GET:** mantidos (`q`, `limit`, `documentType`).

### 7.5 Semântica `DELETE` (CAT-MEI-06)

- **Autenticação:** `requireAuth` + `requireMeiEnabled`, como nos outros verbos de catálogo.
- **Resposta:** **`204 No Content`** sem corpo quando:
  - a linha foi apagada neste pedido, ou
  - já não existia para este utilizador (**idempotência** — segundo `DELETE` no mesmo `id` após sucesso).
- **`404`:** quando existe linha com o `id` pedido mas pertencente a **outro** `user_id` (mensagem genérica *não encontrado*, sem vazar existência alheia).
- **`400`:** `:id` vazio ou não UUID v4/válido conforme validação do serviço.
- **Persistência:** `DELETE` SQL com filtro `id` + `user_id` da sessão (service role).

### 7.6 Exemplo `DELETE /catalogo/clientes/:id`

**Pedido:** sem corpo.

**Resposta:** `204` (sucesso ou idempotente).

**Erros:** `400` id inválido; `401`/`403`; `404` registo de outro utilizador.

### 7.1 Exemplo `POST /catalogo/clientes`

**Pedido (JSON):**

```json
{
  "documentType": "NFSE",
  "documento": "12345678000199",
  "nome": "Empresa Exemplo LTDA",
  "email": "financeiro@exemplo.invalid"
}
```

**Resposta 201:** objeto linha como no GET (incl. `id`, `created_at`, `updated_at`, `last_used_at`, `metadata_json`).

**Erros:** `400` validação (documento inválido, comprimento); `401`/`403` auth/MEI.

### 7.2 Exemplo `PATCH /catalogo/clientes/:id`

**Pedido (JSON):**

```json
{
  "nome": "Novo nome fantasia",
  "email": "novo@exemplo.invalid"
}
```

Regra: não permitir PATCH que viole `documento` 11/14 ou `dedupe_key` duplicado se alterar documento (se PATCH de `documento` for permitido, recalcular `dedupe_key` e tratar conflito — recomendação: **MVP** só PATCH de `nome`, `email`, `metadata_json`; documento imutável).

### 7.3 Exemplo `POST /catalogo/produtos`

**Pedido (JSON):**

```json
{
  "documentType": "NFSE",
  "discriminacao": "Desenvolvimento de software sob encomenda",
  "codigo": "SVC-01",
  "cnae": "6201501",
  "aliquota": 2.5,
  "valor_sugerido": 1500.0
}
```

**Resposta 201:** linha completa incl. `id` e `dedupe_key` gerado.

### 7.4 Exemplo `PATCH /catalogo/produtos/:id`

**Pedido (JSON):**

```json
{
  "discriminacao": "Consultoria em TI",
  "valor_sugerido": 2000.0
}
```

---

## 8. Segurança e observabilidade

- Sempre filtrar por `user_id` da sessão em todas as escritas/leituras no serviço (mesmo com service role).
- Não registar em logs corpo completo com dados fiscais sensíveis (NFR-CAT-05).
- Rate limiting: seguir política global do `express` app se existir.

---

## 9. Referências de código

| Tópico | Ficheiro |
|--------|----------|
| Listagem catálogo | `backend/src/services/mei-notas.service.js` — `listarCatalogoClientes`, `listarCatalogoProdutos` |
| DELETE catálogo | `mei-notas.service.js` — `eliminarCatalogoCliente`, `eliminarCatalogoProduto` |
| Upsert pós-emissão | `mei-notas.service.js` — `upsertClienteCatalogo`, `upsertProdutosCatalogo`, `buildClienteCatalogEntry`, `buildProdutoCatalogEntries` |
| Rotas GET | `backend/src/routes/mei-notas.routes.js` |
| Schema | `supabase/migrations/20260312103000_create_mei_nfse_catalog_tables.sql`, `20260312114000_add_document_type_to_mei_nfse_catalog.sql` |

---

## 10. Registo de alterações

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 2026-03-30 | Dex (dev) / spike CAT-MEI-01 | Primeira versão após análise do código e migrações. |
| 1.1 | 2026-03-30 | CAT-MEI-06 | Contrato `DELETE` clientes/produtos; gate schema (sem FK `mei_nfse` → catálogo); §7.5–7.6. |
